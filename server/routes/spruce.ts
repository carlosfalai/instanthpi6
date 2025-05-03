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

// Setup Spruce Health API
const spruceApi = axios.create({
  baseURL: 'https://api.sprucehealth.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.SPRUCE_API_KEY || 'YWlkX0x4WEZaNXBCYktwTU1KbjA3a0hHU2Q0d0UrST06c2tfVkNxZGxFWWNtSHFhcjN1TGs3NkZQa2ZoWm9JSEsyVy80bTVJRUpSQWhCY25lSEpPV3hqd2JBPT0='}`,
    'Content-Type': 'application/json',
    's-access-id': process.env.SPRUCE_ACCESS_ID || 'aid_LxXFZ5pBbKpMMJn07kHGSd4wE+I='
  }
});

export const router = Router();

// Search patients in real-time from Spruce API only
router.get('/search-patients', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      // If no query is provided, return empty list
      return res.json({
        patients: [],
        source: 'spruce'
      });
    }
    
    const searchTerm = query.toLowerCase();
    console.log(`Searching for patients with term: "${searchTerm}"`);
    
    // Search using Spruce API only
    try {
      console.log('Searching patients via Spruce API');
      
      // According to the documentation, we should use the /contacts endpoint
      const response = await spruceApi.get('/contacts', {
        params: { query: searchTerm }
      });
      
      // Filter patients based on query
      const allPatients = response.data.contacts || [];
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
      // Return empty list if Spruce API fails
      return res.json({
        patients: [],
        source: 'spruce',
        error: 'Failed to search patients in Spruce API'
      });
    }
  } catch (error) {
    console.error('Error in patient search:', error);
    res.status(500).json({ message: 'Failed to search patients' });
  }
});

// Fetch contacts from Spruce API - no local database used
router.post('/sync-patients', async (req, res) => {
  try {
    // Get patients directly from Spruce API using /contacts endpoint
    try {
      const response = await spruceApi.get('/contacts');
      const sprucePatients = response.data.contacts || [];
      
      res.json({ 
        message: `Retrieved ${sprucePatients.length} patients from Spruce API`,
        count: sprucePatients.length,
        source: 'spruce',
        patients: sprucePatients.map((patient: SprucePatient) => ({
          id: parseInt(patient.id) || Math.floor(Math.random() * 10000) + 1000,
          name: patient.name || 'Unknown Name',
          email: patient.email || '',
          phone: patient.phone || '',
          dateOfBirth: patient.date_of_birth || '',
          gender: patient.gender || 'unknown',
          language: patient.language || null,
          spruceId: patient.id
        }))
      });
    } catch (spruceError) {
      console.error('Error connecting to Spruce API:', spruceError);
      
      // Return empty list if Spruce API fails
      return res.json({ 
        message: 'Failed to connect to Spruce API',
        count: 0,
        source: 'spruce',
        patients: []
      });
    }
  } catch (error) {
    console.error('Error in sync-patients endpoint:', error);
    res.status(500).json({ message: 'Failed to sync patients' });
  }
});

// One-click refresh for patient data from Spruce API
router.post('/refresh-patients', async (req, res) => {
  try {
    console.log('One-click patient data refresh requested');
    
    // Create timestamp for logging
    const timestamp = new Date().toISOString();
    
    // Attempt to get fresh patient data from Spruce API
    try {
      const response = await spruceApi.get('/contacts', {
        params: {
          // Add cache-busting parameter to ensure we get fresh data
          _ts: timestamp
        },
        headers: {
          // Add cache control headers
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      const sprucePatients = response.data.contacts || [];
      console.log(`Successfully refreshed ${sprucePatients.length} patients from Spruce API`);
      
      // Format and return the patient data
      const formattedPatients = sprucePatients.map((patient: SprucePatient) => ({
        id: parseInt(patient.id) || Math.floor(Math.random() * 10000) + 1000,
        name: patient.name || 'Unknown Name',
        email: patient.email || '',
        phone: patient.phone || '',
        dateOfBirth: patient.date_of_birth || '',
        gender: patient.gender || 'unknown',
        language: patient.language || null,
        spruceId: patient.id
      }));
      
      res.json({
        success: true,
        message: `Successfully refreshed ${formattedPatients.length} patients from Spruce API`,
        timestamp: timestamp,
        source: 'spruce',
        count: formattedPatients.length,
        patients: formattedPatients
      });
    } catch (spruceError: any) {
      console.error('Error refreshing data from Spruce API:', spruceError);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh patient data from Spruce API',
        error: spruceError.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error in refresh-patients endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refresh request',
      error: error.message
    });
  }
});

// Send a message exclusively via Spruce Health API
router.post('/messages', async (req, res) => {
  try {
    const { patientId, message, messageType } = req.body;
    
    if (!patientId || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    try {
      // Send the message through Spruce API
      const spruceResponse = await spruceApi.post('/messages', {
        patient_id: patientId,
        content: message,
        message_type: messageType || 'GENERAL',
        sender_id: 1, // Doctor ID
      });
      
      // Return the Spruce API response
      res.json({
        id: spruceResponse.data.id,
        patientId,
        senderId: 1,
        content: message,
        isFromPatient: false,
        spruceMessageId: spruceResponse.data.id,
        timestamp: new Date()
      });
    } catch (spruceError) {
      console.error('Error sending message to Spruce API:', spruceError);
      res.status(500).json({ message: 'Failed to send message to Spruce API' });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Get patient messages exclusively from Spruce Health API
router.get('/patients/:patientId/messages', async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
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
    // No fallback to local database - return empty array
    res.json([]);
  }
});