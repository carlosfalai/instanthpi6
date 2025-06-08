import { Router } from 'express';
import { SpruceHealthClient } from '../spruce-health-client';

// Initialize Spruce Health client
const SPRUCE_BEARER_TOKEN = process.env.SPRUCE_BEARER_TOKEN;
const SPRUCE_ACCESS_ID = process.env.SPRUCE_ACCESS_ID;

if (!SPRUCE_BEARER_TOKEN) {
  console.warn('⚠️ WARNING: No Spruce bearer token found. Set SPRUCE_BEARER_TOKEN environment variable for API access.');
}

console.log('🔑 Spruce Health API Configuration:');
console.log('📋 Access ID:', SPRUCE_ACCESS_ID || 'Not provided'); 
console.log('🔐 Bearer Token:', SPRUCE_BEARER_TOKEN ? 'Configured' : 'Missing');

const spruceClient = new SpruceHealthClient({
  bearerToken: SPRUCE_BEARER_TOKEN || '',
  maxRetries: 3,
  retryDelay: 1000
});

export const router = Router();

// Get conversations for inbox
router.get('/conversations', async (req, res) => {
  try {
    const { page, per_page, status } = req.query;
    
    const conversations = await spruceClient.getConversations({
      page: page ? parseInt(page as string) : 1,
      per_page: per_page ? parseInt(per_page as string) : 20,
      status: status as string
    });
    
    // Transform conversations for inbox format
    const transformedConversations = conversations.conversations.map(conv => {
      // Extract patient name from title, externalParticipants, or other available fields
      let displayName = 'Unknown Patient';
      
      if (conv.title && conv.title !== 'Centre Médical Font') {
        displayName = conv.title;
      } else if (conv.externalParticipants && conv.externalParticipants.length > 0) {
        displayName = conv.externalParticipants[0].displayName || conv.externalParticipants[0].contact;
      }
      
      return {
        id: conv.id,
        entityId: conv.id,
        displayName: displayName,
        lastActivity: conv.lastMessageAt || conv.createdAt,
        unreadCount: conv.unread_count || 0,
        lastMessage: undefined
      };
    });
    
    res.json(transformedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
router.get('/patients/:patientId/messages', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page, per_page } = req.query;
    
    const messages = await spruceClient.getMessages(patientId, {
      page: page ? parseInt(page as string) : 1,
      per_page: per_page ? parseInt(per_page as string) : 50
    });
    
    // Transform messages for frontend format
    const transformedMessages = messages.messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      timestamp: msg.sent_at,
      isFromPatient: msg.sender_id !== 'doctor',
      sender: msg.sender_name
    }));
    
    res.json({ messages: transformedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Search patients using conversations
router.get('/search-patients', async (req, res) => {
  try {
    const { query } = req.query;
    
    console.log('Fetching patients via Spruce API');
    if (query) {
      console.log(`Searching for patients with query: "${query}"`);
    } else {
      console.log('No search term provided, fetching all patients');
    }

    // Get conversations which contain patient data
    const conversations = await spruceClient.getConversations({
      per_page: 100
    });

    // Transform conversations to patient format
    const patients = conversations.conversations.map((conv, index) => ({
      id: index + 1,
      name: conv.participants?.[0]?.name || conv.subject || 'Unknown Patient',
      email: conv.participants?.[0]?.email || '',
      phone: conv.participants?.[0]?.phone || '',
      spruceId: conv.id,
      lastActivity: conv.updated_at || conv.created_at
    }));

    // Filter by query if provided
    const filteredPatients = query 
      ? patients.filter(patient => 
          patient.name.toLowerCase().includes((query as string).toLowerCase()) ||
          patient.email.toLowerCase().includes((query as string).toLowerCase()) ||
          patient.phone.includes(query as string)
        )
      : patients;

    console.log(`Found ${filteredPatients.length} matching patients in Spruce API`);
    res.json({ patients: filteredPatients });
  } catch (error) {
    console.error('Error searching patients via Spruce API:', error);
    res.status(500).json({ message: 'Failed to search patients' });
  }
});

// Send message to conversation
router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, message_type = 'text' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    const message = await spruceClient.sendMessage(conversationId, content, message_type);
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Mark messages as read
router.patch('/conversations/:conversationId/messages/read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message_ids } = req.body;
    
    if (!message_ids || !Array.isArray(message_ids)) {
      return res.status(400).json({ error: 'message_ids array is required' });
    }
    
    await spruceClient.markMessagesAsRead(conversationId, message_ids);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

// Get rate limit status
router.get('/rate-limit', (req, res) => {
  const rateLimitStatus = spruceClient.getRateLimitStatus();
  res.json(rateLimitStatus);
});