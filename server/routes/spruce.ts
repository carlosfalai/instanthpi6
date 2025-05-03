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
      // If no query is provided, return all patients from local database
      try {
        const allPatients = await storage.getAllPatients();
        return res.json({
          patients: allPatients,
          source: 'local'
        });
      } catch (dbError) {
        console.error('Error fetching all patients:', dbError);
        return res.status(500).json({ message: 'Failed to fetch patients' });
      }
    }
    
    const searchTerm = query.toLowerCase();
    console.log(`Searching for patients with term: "${searchTerm}"`);
    
    // API key is always available now (hardcoded)
    if (false) {
      console.log('No Spruce API key available, using local search only');
      // If no API key, fall back to local search
      try {
        const localPatients = await storage.getAllPatients();
        
        const filteredPatients = localPatients.filter(patient => {
          return (
            (patient.name && patient.name.toLowerCase().includes(searchTerm)) ||
            (patient.email && patient.email.toLowerCase().includes(searchTerm)) ||
            (patient.phone && patient.phone && patient.phone.includes(searchTerm))
          );
        });
        
        console.log(`Found ${filteredPatients.length} matching patients in local database`);
        
        return res.json({
          patients: filteredPatients,
          source: 'local'
        });
      } catch (dbError) {
        console.error('Error searching local patients:', dbError);
        return res.status(500).json({ message: 'Failed to search local patients' });
      }
    }
    
    // Try to search using Spruce API
    try {
      console.log('Attempting to search patients via Spruce API');
      
      // According to the documentation, we should use the /contacts endpoint instead of /patients
      const response = await axios.create({
        baseURL: 'https://api.sprucehealth.com/v1',
        headers: {
          'Authorization': 'Bearer YWlkX0x4WEZaNXBCYktwTU1KbjA3a0hHU2Q0d0UrST06c2tfVkNxZGxFWWNtSHFhcjN1TGs3NkZQa2ZoWm9JSEsyVy80bTVJRUpSQWhCY25lSEpPV3hqd2JBPT0=',
          'Content-Type': 'application/json',
          's-access-id': 'aid_LxXFZ5pBbKpMMJn07kHGSd4wE+I='
        }
      }).get('/contacts');
      
      // Filter patients based on query
      const allPatients = response.data.patients || [];
      console.log(`Received ${allPatients.length} patients from Spruce API`);
      
      const filteredPatients = allPatients.filter((patient: SprucePatient) => {
        return (
          (patient.name && patient.name.toLowerCase().includes(searchTerm)) ||
          (patient.email && patient.email.toLowerCase().includes(searchTerm)) ||
          (patient.phone && patient.phone.includes(searchTerm))
        );
      });
      
      console.log(`Found ${filteredPatients.length} matching patients in Spruce API`);
      
      // Convert Spruce patients to our format
      const mappedPatients = filteredPatients.map((sprucePatient: SprucePatient) => ({
        id: parseInt(sprucePatient.id) || Math.floor(Math.random() * 10000) + 1000, // Convert to number or generate random ID
        name: sprucePatient.name || 'Unknown Name',
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
      console.log('Falling back to local search');
      
      // Fallback to local search if Spruce API fails
      try {
        const localPatients = await storage.getAllPatients();
        
        const filteredPatients = localPatients.filter(patient => {
          return (
            (patient.name && patient.name.toLowerCase().includes(searchTerm)) ||
            (patient.email && patient.email.toLowerCase().includes(searchTerm)) ||
            (patient.phone && patient.phone && patient.phone.includes(searchTerm))
          );
        });
        
        console.log(`Found ${filteredPatients.length} matching patients in local database (fallback)`);
        
        return res.json({
          patients: filteredPatients,
          source: 'local',
          message: 'Using local search due to Spruce API error'
        });
      } catch (dbError) {
        console.error('Error in fallback local search:', dbError);
        return res.status(500).json({ message: 'Failed to search patients in both Spruce and local database' });
      }
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
    'Authorization': 'Bearer YWlkX0x4WEZaNXBCYktwTU1KbjA3a0hHU2Q0d0UrST06c2tfVkNxZGxFWWNtSHFhcjN1TGs3NkZQa2ZoWm9JSEsyVy80bTVJRUpSQWhCY25lSEpPV3hqd2JBPT0=',
    'Content-Type': 'application/json',
    's-access-id': 'aid_LxXFZ5pBbKpMMJn07kHGSd4wE+I='
  }
});

// Sync patients from Spruce Health API (or return existing local patients)
router.post('/sync-patients', async (req, res) => {
  try {
    // API key is always available now (hardcoded)
    if (false) {
      // If no API key, just return the existing patients
      const localPatients = await storage.getAllPatients();
      return res.json({ 
        message: 'Using local patients (Spruce API key not configured)',
        count: localPatients.length,
        source: 'local'
      });
    }
    
    try {
      // Get patients from Spruce API using /contacts endpoint
      const response = await spruceApi.get('/contacts');
      const sprucePatients = response.data.contacts || [];
      
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
              email: sprucePatient.email || '',
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
    
    // API key is always available now (hardcoded)
    if (false) {
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
    
    // API key is always available now (hardcoded)
    if (false) {
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