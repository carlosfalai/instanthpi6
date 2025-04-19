import { Router } from 'express';
import { storage } from '../storage';
import { ZodError } from 'zod';
import { insertPatientSchema, insertMessageSchema } from '@shared/schema';
import axios from 'axios';

export const router = Router();

// Setup Spruce Health API
const spruceApi = axios.create({
  baseURL: 'https://api.sprucehealth.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.SPRUCE_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Error handling middleware for Zod validation errors
const handleZodError = (error: unknown, res: any) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: error.errors,
    });
  }
  console.error("Unexpected error:", error);
  return res.status(500).json({ message: "Internal server error" });
};

// Get all patients
router.get('/', async (req, res) => {
  try {
    const { query } = req.query;
    const patients = await storage.getAllPatients();
    
    if (query && typeof query === 'string') {
      const searchTerm = query.toLowerCase();
      const filteredPatients = patients.filter(patient => {
        return (
          patient.name.toLowerCase().includes(searchTerm) ||
          patient.email.toLowerCase().includes(searchTerm) ||
          patient.phone.includes(searchTerm)
        );
      });
      return res.json(filteredPatients);
    }
    
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Failed to fetch patients' });
  }
});

// Get a specific patient
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const patient = await storage.getPatient(id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ message: 'Failed to fetch patient' });
  }
});

// Create a new patient
router.post('/', async (req, res) => {
  try {
    const patientData = insertPatientSchema.parse(req.body);
    const patient = await storage.createPatient(patientData);
    res.status(201).json(patient);
  } catch (error) {
    handleZodError(error, res);
  }
});

// Update a patient
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const patientData = insertPatientSchema.partial().parse(req.body);
    const updatedPatient = await storage.updatePatient(id, patientData);
    
    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json(updatedPatient);
  } catch (error) {
    handleZodError(error, res);
  }
});

// Get messages for a patient
router.get('/:patientId/messages', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    // Get today's date in ISO format (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Try to synchronize with Spruce API if API key is available
      if (process.env.SPRUCE_API_KEY) {
        // Call the Spruce Health API to get today's messages for this patient
        const response = await spruceApi.get(`/patients/${patientId}/messages`, {
          params: {
            date_from: `${today}T00:00:00Z`,
            date_to: `${today}T23:59:59Z`
          }
        });
        
        // Process the Spruce API response and convert to our data format
        const spruceMessages = response.data.messages || [];
        
        // Convert Spruce messages to our format and store them
        for (const msg of spruceMessages) {
          // Check if we already have this message stored (by Spruce ID)
          const existingMessage = await storage.getMessageBySpruceId(msg.id);
          
          if (!existingMessage) {
            // Store the new message
            await storage.createMessage({
              patientId,
              senderId: msg.sender_type === 'patient' ? patientId : 1, // 1 for doctor
              content: msg.content,
              isFromPatient: msg.sender_type === 'patient',
              spruceMessageId: msg.id
            });
          }
        }
      }
    } catch (spruceError) {
      console.error('Error fetching messages from Spruce API:', spruceError);
      // We'll continue and return locally stored messages even if Spruce API fails
    }
    
    // Return all messages for this patient from our database
    const messages = await storage.getMessagesByPatientId(patientId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Create a new message for a patient
router.post('/:patientId/messages', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const messageData = insertMessageSchema.parse({
      ...req.body,
      patientId
    });
    
    const message = await storage.createMessage(messageData);
    res.status(201).json(message);
  } catch (error) {
    handleZodError(error, res);
  }
});

// Get pending items for a patient
router.get('/:patientId/pending-items', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const pendingItems = await storage.getPendingItemsByPatientId(patientId);
    res.json(pendingItems);
  } catch (error) {
    console.error('Error fetching pending items:', error);
    res.status(500).json({ message: 'Failed to fetch pending items' });
  }
});

// Get preventative care items for a patient
router.get('/:patientId/preventative-care', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const preventativeCare = await storage.getPreventativeCareByPatientId(patientId);
    res.json(preventativeCare);
  } catch (error) {
    console.error('Error fetching preventative care items:', error);
    res.status(500).json({ message: 'Failed to fetch preventative care items' });
  }
});

// Get next preventative care item for a patient
router.get('/:patientId/next-preventative-care', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const nextItem = await storage.getNextPreventativeCareItem(patientId);
    
    if (!nextItem) {
      return res.status(404).json({ message: 'No upcoming preventative care items found' });
    }
    
    res.json(nextItem);
  } catch (error) {
    console.error('Error fetching next preventative care item:', error);
    res.status(500).json({ message: 'Failed to fetch next preventative care item' });
  }
});

// Get AI documentation for a patient
router.get('/:patientId/documentation', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const documentation = await storage.getDocumentationByPatientId(patientId);
    
    if (!documentation) {
      return res.status(404).json({ message: 'No documentation found for this patient' });
    }
    
    res.json(documentation);
  } catch (error) {
    console.error('Error fetching documentation:', error);
    res.status(500).json({ message: 'Failed to fetch documentation' });
  }
});

// Get form submissions for a patient
router.get('/:patientId/form-submissions', async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const submissions = await storage.getFormSubmissionsByPatientId(patientId);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    res.status(500).json({ message: 'Failed to fetch form submissions' });
  }
});