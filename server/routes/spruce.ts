import { Router } from 'express';
import axios from 'axios';
import { Patient, insertPatientSchema, Message } from '@shared/schema';
import { storage } from '../storage';
import { randomUUID } from 'crypto';

export const router = Router();

// Configure Spruce API client
const spruceClient = axios.create({
  baseURL: 'https://api.sprucehealth.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SPRUCE_API_KEY}`
  }
});

// Get all conversations
router.get('/conversations', async (req, res) => {
  try {
    const response = await spruceClient.get('/conversations', {
      params: {
        // Add any needed parameters like date ranges
        limit: 50
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Spruce conversations:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json({ 
        error: `Spruce API error: ${error.response.data}` 
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch conversations from Spruce' });
    }
  }
});

// Get messages for a specific patient
router.get('/patients/:patientId/messages', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  
  try {
    // First check if patient exists
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // If we have a spruceId (external identifier for this patient), use it to get messages
    if (patient.spruceId) {
      try {
        // Get today's date range for the query
        const today = new Date();
        const dateFrom = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const dateTo = new Date(today.setHours(23, 59, 59, 999)).toISOString();
        
        const response = await spruceClient.get(`/patients/${patient.spruceId}/messages`, {
          params: {
            date_from: dateFrom,
            date_to: dateTo
          }
        });
        
        // Map Spruce messages to our internal format
        const messages = response.data.map((message: any) => ({
          id: message.id,
          patientId: patientId,
          content: message.content,
          timestamp: message.created_at,
          isFromPatient: message.direction === 'INBOUND',
          sender: message.sender_name
        }));
        
        // Save messages to our database for caching
        for (const message of messages) {
          const existingMessage = await storage.getMessageBySpruceId(message.id);
          if (!existingMessage) {
            await storage.createMessage({
              patientId: message.patientId,
              content: message.content,
              senderId: 1, // Default to doctor ID 1 for now
              isFromPatient: message.isFromPatient,
              spruceMessageId: message.id
            });
          }
        }
        
        return res.json(messages);
      } catch (error) {
        console.error('Error fetching messages from Spruce:', error);
        // If Spruce API fails, fall back to our local storage
      }
    }
    
    // Fall back to locally stored messages
    const messages = await storage.getMessagesByPatientId(patientId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching patient messages:', error);
    res.status(500).json({ error: 'Failed to fetch patient messages' });
  }
});

// Send a message to a patient
router.post('/messages', async (req, res) => {
  const { patientId, message, messageType = 'GENERAL' } = req.body;
  
  if (!patientId || !message) {
    return res.status(400).json({ error: 'Patient ID and message are required' });
  }
  
  try {
    // Get the patient
    const patient = await storage.getPatient(parseInt(patientId));
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    let spruceMessageId = null;
    
    // If patient has a Spruce ID, send message through Spruce API
    if (patient.spruceId) {
      try {
        const response = await spruceClient.post('/messages', {
          patient_id: patient.spruceId,
          content: message,
          type: messageType
        });
        
        spruceMessageId = response.data.id;
      } catch (error) {
        console.error('Error sending message via Spruce:', error);
        // Continue with local storage even if Spruce fails
      }
    }
    
    // Always store message locally
    const newMessage = await storage.createMessage({
      patientId: parseInt(patientId),
      content: message,
      senderId: 1, // Default to doctor ID 1 for now
      isFromPatient: false,
      spruceMessageId
    });
    
    // Convert to Message type with timestamp
    const formattedMessage = {
      id: newMessage.id.toString(),
      patientId: newMessage.patientId,
      content: newMessage.content,
      timestamp: newMessage.timestamp.toISOString(),
      isFromPatient: newMessage.isFromPatient,
      sender: "Dr. Font"  // Hardcoded for now
    };
    
    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark patient conversation as read
router.post('/patients/:patientId/read', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  
  try {
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    if (patient.spruceId) {
      try {
        await spruceClient.post(`/patients/${patient.spruceId}/read`);
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error marking conversation as read in Spruce:', error);
        // Fall through to local handling
      }
    }
    
    // Update local patient record to mark as read
    await storage.updatePatient(patientId, { status: 'read' });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
});

// Archive a patient conversation
router.post('/patients/:patientId/archive', async (req, res) => {
  const patientId = parseInt(req.params.patientId);
  
  try {
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    if (patient.spruceId) {
      try {
        await spruceClient.post(`/patients/${patient.spruceId}/archive`);
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error archiving conversation in Spruce:', error);
        // Fall through to local handling
      }
    }
    
    // Update local patient record to mark as archived
    await storage.updatePatient(patientId, { status: 'archived' });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
});