import express, { Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';

const router = express.Router();

// Ensure Spruce API key is available
const SPRUCE_API_KEY = process.env.SPRUCE_API_KEY;
if (!SPRUCE_API_KEY) {
  console.warn('SPRUCE_API_KEY environment variable is not set. Spruce API integration will not work.');
}

// Configure Spruce API client
const spruceApi = axios.create({
  baseURL: 'https://api.sprucehealth.com/v1',
  headers: {
    'Authorization': `Bearer ${SPRUCE_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Get all patient conversations
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    if (!SPRUCE_API_KEY) {
      return res.status(503).json({ message: 'Spruce API integration not configured' });
    }

    // Get today's date range for conversations
    const today = new Date();
    const dateFrom = new Date(today);
    dateFrom.setHours(0, 0, 0, 0);
    
    const dateTo = new Date(today);
    dateTo.setHours(23, 59, 59, 999);

    // Format dates as ISO strings
    const dateFromStr = dateFrom.toISOString();
    const dateToStr = dateTo.toISOString();

    // Fetch conversations from Spruce
    const response = await spruceApi.get('/conversations', {
      params: {
        date_from: dateFromStr,
        date_to: dateToStr
      }
    });

    // Transform the data to our required format
    const conversations = response.data.data.map((conv: any) => ({
      patientId: conv.patient.id,
      patientName: `${conv.patient.first_name} ${conv.patient.last_name}`,
      spruceId: conv.id,
      avatarUrl: conv.patient.avatar_url,
      lastActive: conv.updated_at,
      hasUnread: conv.unread_count > 0,
      lastMessage: conv.last_message ? {
        content: conv.last_message.text || 'Media message',
        timestamp: conv.last_message.created_at,
        isFromPatient: conv.last_message.direction === 'inbound'
      } : undefined
    }));

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations from Spruce:', error);
    res.status(500).json({ message: 'Failed to retrieve conversations from Spruce' });
  }
});

// Get messages for a specific patient
router.get('/patients/:patientId/messages', async (req: Request, res: Response) => {
  try {
    if (!SPRUCE_API_KEY) {
      return res.status(503).json({ message: 'Spruce API integration not configured' });
    }

    const { patientId } = req.params;
    
    // Get date range for messages (default to last 7 days)
    const today = new Date();
    const dateFrom = new Date(today);
    dateFrom.setDate(dateFrom.getDate() - 7);
    
    const dateTo = new Date(today);

    // Format dates as ISO strings
    const dateFromStr = dateFrom.toISOString();
    const dateToStr = dateTo.toISOString();

    // Fetch messages from Spruce
    const response = await spruceApi.get(`/patients/${patientId}/messages`, {
      params: {
        date_from: dateFromStr,
        date_to: dateToStr
      }
    });

    // Transform the data to our required format
    const messages = response.data.data.map((msg: any) => ({
      id: msg.id,
      patientId: parseInt(patientId),
      content: msg.text || 'Media message',
      timestamp: msg.created_at,
      isFromPatient: msg.direction === 'inbound',
      sender: msg.direction === 'outbound' ? msg.sender?.name : undefined,
      attachmentUrl: msg.media && msg.media.length > 0 ? msg.media[0].url : undefined,
      spruceMessageId: msg.id
    }));

    res.json(messages);
  } catch (error) {
    console.error(`Error fetching messages for patient ${req.params.patientId} from Spruce:`, error);
    res.status(500).json({ message: 'Failed to retrieve messages from Spruce' });
  }
});

// Schema validation for sending messages
const sendMessageSchema = z.object({
  content: z.string().min(1),
  attachmentUrl: z.string().url().optional()
});

// Send a message to a patient
router.post('/patients/:patientId/messages', async (req: Request, res: Response) => {
  try {
    if (!SPRUCE_API_KEY) {
      return res.status(503).json({ message: 'Spruce API integration not configured' });
    }

    const { patientId } = req.params;
    
    // Validate request body
    const validation = sendMessageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: 'Invalid message data', errors: validation.error.errors });
    }
    
    const { content, attachmentUrl } = validation.data;

    // Prepare message payload
    const messageData: any = {
      text: content,
      patient_id: patientId
    };
    
    // Add media if provided
    if (attachmentUrl) {
      messageData.media = [{ url: attachmentUrl }];
    }

    // Send message via Spruce API
    const response = await spruceApi.post('/messages', messageData);

    // Return the created message
    const newMessage = {
      id: response.data.id,
      patientId: parseInt(patientId),
      content,
      timestamp: response.data.created_at,
      isFromPatient: false,
      sender: response.data.sender?.name,
      attachmentUrl,
      spruceMessageId: response.data.id
    };

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(`Error sending message to patient ${req.params.patientId} via Spruce:`, error);
    res.status(500).json({ message: 'Failed to send message via Spruce' });
  }
});

// Mark a conversation as read
router.post('/patients/:patientId/read', async (req: Request, res: Response) => {
  try {
    if (!SPRUCE_API_KEY) {
      return res.status(503).json({ message: 'Spruce API integration not configured' });
    }

    const { patientId } = req.params;

    // Get the conversation ID first
    const convsResponse = await spruceApi.get('/conversations', {
      params: {
        patient_id: patientId
      }
    });
    
    if (!convsResponse.data.data || convsResponse.data.data.length === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    const conversationId = convsResponse.data.data[0].id;

    // Mark the conversation as read
    await spruceApi.post(`/conversations/${conversationId}/read`);

    res.status(200).json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error(`Error marking conversation for patient ${req.params.patientId} as read:`, error);
    res.status(500).json({ message: 'Failed to mark conversation as read' });
  }
});

// Archive a conversation
router.post('/patients/:patientId/archive', async (req: Request, res: Response) => {
  try {
    if (!SPRUCE_API_KEY) {
      return res.status(503).json({ message: 'Spruce API integration not configured' });
    }

    const { patientId } = req.params;

    // Get the conversation ID first
    const convsResponse = await spruceApi.get('/conversations', {
      params: {
        patient_id: patientId
      }
    });
    
    if (!convsResponse.data.data || convsResponse.data.data.length === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    const conversationId = convsResponse.data.data[0].id;

    // Archive the conversation
    await spruceApi.post(`/conversations/${conversationId}/archive`);

    res.status(200).json({ message: 'Conversation archived' });
  } catch (error) {
    console.error(`Error archiving conversation for patient ${req.params.patientId}:`, error);
    res.status(500).json({ message: 'Failed to archive conversation' });
  }
});

export default router;