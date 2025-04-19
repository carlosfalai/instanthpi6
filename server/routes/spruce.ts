import express, { Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { storage } from '../storage';

const router = express.Router();

// Validate API key exists
if (!process.env.SPRUCE_API_KEY) {
  console.warn('SPRUCE_API_KEY not found in environment variables. Spruce API integration will not work.');
}

// Configure Spruce API client
const spruceApiClient = axios.create({
  baseURL: 'https://api.sprucehealth.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SPRUCE_API_KEY}`
  }
});

// Helper to format date range for Spruce API
const getDateRange = (days = 30) => {
  const now = new Date();
  const dateTo = new Date(now).toISOString();
  const dateFrom = new Date(now.setDate(now.getDate() - days)).toISOString();
  return { dateFrom, dateTo };
};

// Get all conversations
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    // Validate API key exists
    if (!process.env.SPRUCE_API_KEY) {
      return res.status(503).json({ error: 'Spruce API not configured' });
    }

    const { dateFrom, dateTo } = getDateRange(30);
    
    const response = await spruceApiClient.get('/conversations', {
      params: {
        date_from: dateFrom,
        date_to: dateTo,
        include_archived: req.query.includeArchived === 'true'
      }
    });
    
    // Save patients to our database if needed
    if (response.data && Array.isArray(response.data.conversations)) {
      // Process patients here
      for (const conversation of response.data.conversations) {
        if (conversation.patient) {
          try {
            const existingPatient = await storage.getPatientByEmail(conversation.patient.email);
            
            if (!existingPatient) {
              // Create patient in our system
              await storage.createPatient({
                name: conversation.patient.name,
                email: conversation.patient.email || 'unknown',
                spruceId: conversation.patient.id.toString(),
                language: conversation.patient.language || 'english',
                dateOfBirth: conversation.patient.date_of_birth || null,
                lastActive: new Date(conversation.last_message_timestamp || Date.now()),
                status: 'active',
                gender: conversation.patient.gender || 'unknown'
              });
            }
          } catch (error) {
            console.error('Error saving patient:', error);
          }
        }
      }
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Spruce conversations:', error);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch conversations',
      details: error.response?.data || error.message
    });
  }
});

// Get messages for a specific patient
router.get('/patients/:patientId/messages', async (req: Request, res: Response) => {
  try {
    // Validate API key exists
    if (!process.env.SPRUCE_API_KEY) {
      return res.status(503).json({ error: 'Spruce API not configured' });
    }
    
    const patientId = req.params.patientId;
    const { dateFrom, dateTo } = getDateRange(req.query.days ? parseInt(req.query.days as string) : 30);
    
    // Using Spruce API to get messages
    const response = await spruceApiClient.get(`/patients/${patientId}/messages`, {
      params: {
        date_from: dateFrom,
        date_to: dateTo
      }
    });
    
    // Process and store messages in our database
    if (response.data && response.data.messages) {
      // Transform messages to our schema
      const transformedMessages = response.data.messages.map(message => ({
        id: message.id,
        patientId: parseInt(patientId),
        content: message.content,
        timestamp: message.timestamp,
        isFromPatient: message.sender_type === 'patient',
        sender: message.sender.name,
        spruceMessageId: message.id
      }));
      
      // Store messages in our database
      for (const message of transformedMessages) {
        try {
          const existingMessage = await storage.getMessageBySpruceId(message.id);
          if (!existingMessage) {
            await storage.createMessage(message);
          }
        } catch (error) {
          console.error('Error saving message:', error);
        }
      }
      
      res.json(transformedMessages);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching Spruce messages:', error);
    
    // If the API call fails, try to get messages from our database as a fallback
    try {
      const messages = await storage.getMessagesByPatientId(parseInt(req.params.patientId));
      res.json(messages);
    } catch (dbError) {
      res.status(error.response?.status || 500).json({ 
        error: 'Failed to fetch messages',
        details: error.response?.data || error.message
      });
    }
  }
});

// Send a message to a patient
router.post('/patients/:patientId/messages', async (req: Request, res: Response) => {
  try {
    // Validate API key exists
    if (!process.env.SPRUCE_API_KEY) {
      return res.status(503).json({ error: 'Spruce API not configured' });
    }
    
    const patientId = req.params.patientId;
    const messageSchema = z.object({
      message: z.string().min(1),
      attachments: z.array(z.string()).optional()
    });
    
    const validationResult = messageSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid message format', details: validationResult.error });
    }
    
    const { message, attachments } = validationResult.data;
    
    // Using Spruce API to send message
    const response = await spruceApiClient.post(`/patients/${patientId}/messages`, {
      content: message,
      attachments: attachments || []
    });
    
    // Store the message in our database
    if (response.data && response.data.message) {
      const newMessage = {
        patientId: parseInt(patientId),
        content: message,
        timestamp: new Date().toISOString(),
        isFromPatient: false,
        sender: 'Doctor', // This should be dynamic based on the logged-in user
        spruceMessageId: response.data.message.id
      };
      
      try {
        const savedMessage = await storage.createMessage(newMessage);
        res.status(201).json(savedMessage);
      } catch (error) {
        console.error('Error saving sent message:', error);
        res.status(201).json(response.data);
      }
    } else {
      res.status(201).json(response.data);
    }
  } catch (error) {
    console.error('Error sending Spruce message:', error);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to send message',
      details: error.response?.data || error.message
    });
  }
});

// Mark conversation as read
router.post('/patients/:patientId/read', async (req: Request, res: Response) => {
  try {
    // Validate API key exists
    if (!process.env.SPRUCE_API_KEY) {
      return res.status(503).json({ error: 'Spruce API not configured' });
    }
    
    const patientId = req.params.patientId;
    
    // Using Spruce API to mark conversation as read
    const response = await spruceApiClient.post(`/patients/${patientId}/read`);
    
    res.json(response.data);
  } catch (error) {
    console.error('Error marking Spruce conversation as read:', error);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to mark conversation as read',
      details: error.response?.data || error.message
    });
  }
});

// Archive a conversation
router.post('/patients/:patientId/archive', async (req: Request, res: Response) => {
  try {
    // Validate API key exists
    if (!process.env.SPRUCE_API_KEY) {
      return res.status(503).json({ error: 'Spruce API not configured' });
    }
    
    const patientId = req.params.patientId;
    
    // Using Spruce API to archive conversation
    const response = await spruceApiClient.post(`/patients/${patientId}/archive`);
    
    // Update patient status in our database
    try {
      const patient = await storage.getPatient(parseInt(patientId));
      if (patient) {
        await storage.updatePatient(parseInt(patientId), { status: 'archived' });
      }
    } catch (error) {
      console.error('Error updating patient status:', error);
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Error archiving Spruce conversation:', error);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to archive conversation',
      details: error.response?.data || error.message
    });
  }
});

export default router;