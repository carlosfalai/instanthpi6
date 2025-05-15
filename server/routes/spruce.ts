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

// Setup Spruce Health API with proper authentication format
const spruceApi = axios.create({
  baseURL: 'https://api.sprucehealth.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.SPRUCE_API_KEY}`,
    'Content-Type': 'application/json',
    'X-Api-Key': process.env.SPRUCE_API_KEY // Standard API key header
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
      
      // Update to use the correct Spruce API endpoint with proper parameters
      const response = await spruceApi.get('/patients', {
        params: { 
          search: searchTerm,
          limit: 100
        }
      });
      
      // More flexible data extraction from response
      const allPatients = response.data.patients || response.data.data || response.data.contacts || [];
      console.log(`Received ${allPatients.length} patients from Spruce API`);
      
      // Filter patients based on query with more robust checking
      const filteredPatients = allPatients.filter((patient: any) => {
        return (
          (patient.name || patient.full_name || patient.display_name || '').toLowerCase().includes(searchTerm) ||
          (patient.email || patient.email_address || '').toLowerCase().includes(searchTerm) ||
          (patient.phone || patient.phone_number || '').includes(searchTerm)
        );
      });
      
      console.log(`Found ${filteredPatients.length} matching patients in Spruce API`);
      
      // Convert Spruce patients to our format with better field mapping
      const mappedPatients = filteredPatients.map((sprucePatient: any) => ({
        id: parseInt(sprucePatient.id || sprucePatient.patient_id) || Math.floor(Math.random() * 10000) + 1000,
        name: sprucePatient.full_name || sprucePatient.name || sprucePatient.display_name || 'Unknown Name',
        email: sprucePatient.email_address || sprucePatient.email || '',
        phone: sprucePatient.phone_number || sprucePatient.phone || '',
        dateOfBirth: sprucePatient.birth_date || sprucePatient.date_of_birth || '',
        gender: (sprucePatient.gender || 'unknown').toLowerCase(),
        language: sprucePatient.preferred_language || sprucePatient.language || null,
        spruceId: sprucePatient.patient_id || sprucePatient.id
      }));
      
      res.json({
        patients: mappedPatients,
        source: 'spruce'
      });
    } catch (spruceError: any) {
      // Enhanced error logging with detailed information
      console.error('Error searching patients in Spruce API:', {
        message: spruceError.message,
        response: spruceError.response?.data,
        status: spruceError.response?.status,
        headers: spruceError.response?.headers
      });
      
      // Return more specific error information
      return res.status(spruceError.response?.status || 500).json({
        patients: [],
        source: 'spruce',
        error: 'Failed to search patients in Spruce API',
        message: spruceError.response?.data?.message || spruceError.message,
        details: spruceError.response?.data
      });
    }
  } catch (error: any) {
    console.error('Error in patient search:', error);
    res.status(500).json({ 
      message: 'Failed to search patients',
      error: error.message 
    });
  }
});

// Fetch contacts from Spruce API - no local database used
router.post('/sync-patients', async (req, res) => {
  try {
    // Get patients directly from Spruce API using correct endpoint
    try {
      const response = await spruceApi.get('/patients', {
        params: {
          limit: 200, // Request more patients at once
          include_details: 'true' // Request additional details if API supports it
        }
      });
      
      // More flexible data extraction from response
      const sprucePatients = response.data.patients || response.data.data || response.data.contacts || [];
      
      res.json({ 
        message: `Retrieved ${sprucePatients.length} patients from Spruce API`,
        count: sprucePatients.length,
        source: 'spruce',
        patients: sprucePatients.map((patient: any) => ({
          id: parseInt(patient.id || patient.patient_id) || Math.floor(Math.random() * 10000) + 1000,
          name: patient.full_name || patient.name || patient.display_name || 'Unknown Name',
          email: patient.email_address || patient.email || '',
          phone: patient.phone_number || patient.phone || '',
          dateOfBirth: patient.birth_date || patient.date_of_birth || '',
          gender: (patient.gender || 'unknown').toLowerCase(),
          language: patient.preferred_language || patient.language || null,
          spruceId: patient.patient_id || patient.id
        }))
      });
    } catch (spruceError: any) {
      // Enhanced error logging with detailed information
      console.error('Error connecting to Spruce API:', {
        message: spruceError.message,
        response: spruceError.response?.data,
        status: spruceError.response?.status,
        headers: spruceError.response?.headers
      });
      
      // Return more useful error information
      return res.status(spruceError.response?.status || 500).json({ 
        message: 'Failed to connect to Spruce API',
        error: spruceError.response?.data?.message || spruceError.message,
        count: 0,
        source: 'spruce',
        patients: []
      });
    }
  } catch (error: any) {
    console.error('Error in sync-patients endpoint:', error);
    res.status(500).json({ 
      message: 'Failed to sync patients',
      error: error.message
    });
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
      const response = await spruceApi.get('/patients', {
        params: {
          // Add cache-busting parameter to ensure we get fresh data
          _ts: timestamp,
          limit: 200,
          include_details: 'true'
        },
        headers: {
          // Add cache control headers
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      // More flexible data extraction from response
      const sprucePatients = response.data.patients || response.data.data || response.data.contacts || [];
      console.log(`Successfully refreshed ${sprucePatients.length} patients from Spruce API`);
      
      // Format and return the patient data with better field mapping
      const formattedPatients = sprucePatients.map((patient: any) => ({
        id: parseInt(patient.id || patient.patient_id) || Math.floor(Math.random() * 10000) + 1000,
        name: patient.full_name || patient.name || patient.display_name || 'Unknown Name',
        email: patient.email_address || patient.email || '',
        phone: patient.phone_number || patient.phone || '',
        dateOfBirth: patient.birth_date || patient.date_of_birth || '',
        gender: (patient.gender || 'unknown').toLowerCase(),
        language: patient.preferred_language || patient.language || null,
        spruceId: patient.patient_id || patient.id
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
      // Enhanced error logging with detailed information
      console.error('Error refreshing data from Spruce API:', {
        message: spruceError.message,
        response: spruceError.response?.data,
        status: spruceError.response?.status,
        headers: spruceError.response?.headers
      });
      
      res.status(spruceError.response?.status || 500).json({
        success: false,
        message: 'Failed to refresh patient data from Spruce API',
        error: spruceError.response?.data?.message || spruceError.message,
        details: spruceError.response?.data
      });
    }
  } catch (error: any) {
    console.error('Error in refresh-patients endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refresh request',
      error: error.message || 'Unknown error'
    });
  }
});

// Test endpoint to verify Spruce API connectivity
router.get('/test-connection', async (req, res) => {
  try {
    // Try a simple endpoint that should work with minimal permissions
    const response = await spruceApi.get('/');
    res.json({
      success: true,
      message: 'Successfully connected to Spruce API',
      data: response.data
    });
  } catch (error: any) {
    console.error('Spruce API connection test failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to connect to Spruce API',
      error: error.message,
      details: error.response?.data
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