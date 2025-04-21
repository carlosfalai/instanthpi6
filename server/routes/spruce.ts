import { Router } from 'express';
import { storage } from '../storage';
import axios from 'axios';

// Define interface for Spruce patient data
interface SprucePatient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  language?: string;
  last_visit?: string;
  status?: string;
}

export const router = Router();

// Search patients in real-time from Spruce API
router.get('/search-patients', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Check if Spruce API key is available
    if (!process.env.SPRUCE_API_KEY) {
      // If no API key, fall back to local search
      const localPatients = await storage.getAllPatients();
      const searchTerm = query.toLowerCase();
      
      const filteredPatients = localPatients.filter(patient => {
        return (
          patient.name.toLowerCase().includes(searchTerm) ||
          patient.email.toLowerCase().includes(searchTerm) ||
          patient.phone.includes(searchTerm)
        );
      });
      
      return res.json({
        patients: filteredPatients,
        source: 'local'
      });
    }
    
    try {
      // Search patients in Spruce API directly
      // Spruce API doesn't have a search endpoint, so we need to get all patients and filter
      const response = await axios.create({
        baseURL: 'https://api.sprucehealth.com/v1',
        headers: {
          'Authorization': `Bearer ${process.env.SPRUCE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }).get('/patients');
      
      // Filter patients based on query
      const allPatients = response.data.patients || [];
      const searchTerm = query.toLowerCase();
      const filteredPatients = allPatients.filter((patient: SprucePatient) => {
        return (
          (patient.name && patient.name.toLowerCase().includes(searchTerm)) ||
          (patient.email && patient.email.toLowerCase().includes(searchTerm)) ||
          (patient.phone && patient.phone.includes(searchTerm))
        );
      });
      
      // Use the filtered patients
      const sprucePatients = filteredPatients || [];
      
      // Convert Spruce patients to our format
      const mappedPatients = sprucePatients.map((sprucePatient: SprucePatient) => ({
        id: sprucePatient.id,
        name: sprucePatient.name,
        email: sprucePatient.email || '',
        phone: sprucePatient.phone || '',
        dateOfBirth: sprucePatient.date_of_birth || '',
        gender: sprucePatient.gender || 'unknown',
        language: sprucePatient.language || null,
        spruceId: sprucePatient.id
      }));
      
      res.json({
        patients: mappedPatients,
        source: 'spruce'
      });
    } catch (spruceError) {
      console.error('Error searching patients in Spruce API:', spruceError);
      
      // Fallback to local search if Spruce API fails
      const localPatients = await storage.getAllPatients();
      const searchTerm = query.toLowerCase();
      
      const filteredPatients = localPatients.filter(patient => {
        return (
          patient.name.toLowerCase().includes(searchTerm) ||
          patient.email.toLowerCase().includes(searchTerm) ||
          patient.phone.includes(searchTerm)
        );
      });
      
      return res.json({
        patients: filteredPatients,
        source: 'local'
      });
    }
  } catch (error) {
    console.error('Error in patient search:', error);
    res.status(500).json({ message: 'Failed to search patients' });
  }
});

// Setup Spruce Health API
const spruceApi = axios.create({
  baseURL: 'https://api.sprucehealth.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.SPRUCE_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Sync patients from Spruce Health API (or return existing local patients)
router.post('/sync-patients', async (req, res) => {
  try {
    // Check if Spruce API key is available
    if (!process.env.SPRUCE_API_KEY) {
      // If no API key, just return the existing patients
      const localPatients = await storage.getAllPatients();
      return res.json({ 
        message: 'Using local patients (Spruce API key not configured)',
        count: localPatients.length,
        source: 'local'
      });
    }
    
    try {
      // Get patients from Spruce API
      const response = await spruceApi.get('/patients');
      const sprucePatients = response.data.patients || [];
      
      // Sync patients with our database
      const syncedPatients = [];
      
      for (const sprucePatient of sprucePatients as SprucePatient[]) {
        // Check if patient already exists in our DB by Spruce ID
        let existingPatient = null;
        const localPatients = await storage.getAllPatients();
        
        for (const patient of localPatients) {
          if (patient.spruceId === sprucePatient.id) {
            existingPatient = patient;
            break;
          }
        }
        
        if (existingPatient) {
          // Update existing patient
          const updatedPatient = await storage.updatePatient(existingPatient.id, {
            name: sprucePatient.name,
            email: sprucePatient.email || existingPatient.email,
            phone: sprucePatient.phone || existingPatient.phone,
            dateOfBirth: sprucePatient.date_of_birth || existingPatient.dateOfBirth,
            gender: sprucePatient.gender || existingPatient.gender,
            lastVisit: sprucePatient.last_visit ? new Date(sprucePatient.last_visit) : existingPatient.lastVisit,
            status: sprucePatient.status || existingPatient.status
          });
          
          if (updatedPatient) {
            syncedPatients.push(updatedPatient);
          }
        } else {
          // Create new patient
          try {
            const newPatient = await storage.createPatient({
              name: sprucePatient.name,
              gender: sprucePatient.gender || 'unknown',
              dateOfBirth: sprucePatient.date_of_birth || '1970-01-01',
              email: sprucePatient.email || `patient-${sprucePatient.id}@example.com`,
              phone: sprucePatient.phone || '',
              spruceId: sprucePatient.id,
              language: sprucePatient.language || null
            });
            
            syncedPatients.push(newPatient);
          } catch (createError) {
            console.error(`Failed to create patient from Spruce: ${sprucePatient.id}`, createError);
          }
        }
      }
      
      res.json({ 
        message: `Successfully synced ${syncedPatients.length} patients`,
        count: syncedPatients.length,
        source: 'spruce'
      });
    } catch (spruceError) {
      console.error('Error connecting to Spruce API:', spruceError);
      
      // Fallback to local patients if Spruce API fails
      const localPatients = await storage.getAllPatients();
      return res.json({ 
        message: 'Using local patients (Spruce API unavailable)',
        count: localPatients.length,
        source: 'local'
      });
    }
  } catch (error) {
    console.error('Error in sync-patients endpoint:', error);
    res.status(500).json({ message: 'Failed to sync patients' });
  }
});

// Send a message via Spruce Health API
router.post('/messages', async (req, res) => {
  try {
    const { patientId, message, messageType } = req.body;
    
    if (!patientId || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if Spruce API key is available
    if (!process.env.SPRUCE_API_KEY) {
      // Create a local message instead
      const newMessage = await storage.createMessage({
        patientId,
        senderId: 1, // Assume doctor with ID 1
        content: message,
        isFromPatient: false,
        spruceMessageId: `local-${Date.now()}`
      });
      
      return res.json(newMessage);
    }
    
    try {
      // Send the message through Spruce API
      const spruceResponse = await spruceApi.post('/messages', {
        patient_id: patientId,
        content: message,
        message_type: messageType || 'GENERAL',
        sender_id: 1, // Doctor ID
      });
      
      // Get the Spruce message ID from the response
      const spruceMessageId = spruceResponse.data.id;
      
      // Save the message to our database
      const savedMessage = await storage.createMessage({
        patientId,
        senderId: 1, // Assume doctor with ID 1
        content: message,
        isFromPatient: false,
        spruceMessageId: spruceMessageId
      });
      
      res.json(savedMessage);
    } catch (spruceError) {
      console.error('Error sending message to Spruce API:', spruceError);
      
      // Fallback: Save the message to our database even if Spruce API fails
      const savedMessage = await storage.createMessage({
        patientId,
        senderId: 1, // Assume doctor with ID 1
        content: message,
        isFromPatient: false,
        spruceMessageId: `local-${Date.now()}`
      });
      
      res.json(savedMessage);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Get patient messages from Spruce Health API
router.get('/patients/:patientId/messages', async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    // Check if Spruce API key is available
    if (!process.env.SPRUCE_API_KEY) {
      const messages = await storage.getMessagesByPatientId(parseInt(patientId));
      return res.json(messages);
    }
    
    // Get messages from Spruce API
    const response = await spruceApi.get(`/patients/${patientId}/messages`);
    const spruceMessages = response.data.messages || [];
    
    // Convert Spruce messages to our format
    const messages = spruceMessages.map((msg: any) => ({
      id: msg.id,
      patientId: parseInt(patientId),
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      isFromPatient: msg.sender_type === 'patient',
      sender: msg.sender_name || (msg.sender_type === 'patient' ? 'Patient' : 'Doctor'),
      attachmentUrl: msg.attachment_url || null
    }));
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages from Spruce API:', error);
    
    // Fallback to local messages
    try {
      const messages = await storage.getMessagesByPatientId(parseInt(req.params.patientId));
      res.json(messages);
    } catch (localError) {
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  }
});