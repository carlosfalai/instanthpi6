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

// Check if we have a valid API key
const SPRUCE_API_KEY = process.env.SPRUCE_API_KEY;
if (!SPRUCE_API_KEY) {
  console.warn('⚠️ WARNING: No Spruce API key found. Set SPRUCE_API_KEY environment variable for API access.');
}

// Setup Spruce Health API with proper authentication format based on official documentation
const spruceApi = axios.create({
  // According to the documentation, the base URL is https://api.sprucehealth.com
  baseURL: 'https://api.sprucehealth.com',
  headers: {
    // Documentation specifies authorization format as: "Authorization: Bearer <your-token>"
    'Authorization': `Bearer ${SPRUCE_API_KEY || ''}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Define interface for Spruce message
interface SpruceMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  created_at: string;
  message_type: string;
  read?: boolean;
}

export const router = Router();

// Search patients in real-time from Spruce API only
router.get('/search-patients', async (req, res) => {
  try {
    const { query } = req.query;
    
    // Search using Spruce API
    try {
      console.log('Fetching patients via Spruce API');
      
      let response;
      
      if (!query || typeof query !== 'string') {
        // If no query is provided, fetch all patients
        console.log('No search term provided, fetching all patients');
        response = await spruceApi.get('/v1/contacts', {
          params: { 
            limit: 100
          }
        });
      } else {
        const searchTerm = query.toLowerCase();
        console.log(`Searching for patients with term: "${searchTerm}"`);
        
        // Based on documentation, use the confirmed endpoint /v1/contacts
        console.log('Using documented endpoint /v1/contacts with search query');
        response = await spruceApi.get('/v1/contacts', {
          params: { 
            query: searchTerm, // Use 'query' as parameter per the docs
            limit: 100
          }
        });
      }
      
      // More flexible data extraction from response
      const allPatients = response.data.patients || response.data.data || response.data.contacts || [];
      console.log(`Received ${allPatients.length} patients from Spruce API`);
      
      // Log the raw response for debugging
      console.log('Raw Spruce API response structure:', JSON.stringify(response.data).substring(0, 500) + '...');
      
      // If no search term is provided, use all patients; otherwise filter
      let filteredPatients;
      
      // Only filter if a search term was provided
      if (query && typeof query === 'string') {
        const searchTerm = query.toLowerCase();
        filteredPatients = allPatients.filter((patient: any) => {
          // Search across all possible name/contact fields
          const givenName = (patient.givenName || patient.given_name || '').toLowerCase();
          const familyName = (patient.familyName || patient.family_name || '').toLowerCase();
          const displayName = (patient.displayName || patient.display_name || '').toLowerCase();
          
          // Check for email in nested objects
          let emailToSearch = '';
          if (patient.emailAddresses && Array.isArray(patient.emailAddresses) && patient.emailAddresses.length > 0) {
            emailToSearch = (patient.emailAddresses[0].value || patient.emailAddresses[0].address || '').toLowerCase();
          } else {
            emailToSearch = (patient.email_address || patient.email || '').toLowerCase();
          }
          
          // Check for phone in nested objects
          let phoneToSearch = '';
          if (patient.phoneNumbers && Array.isArray(patient.phoneNumbers) && patient.phoneNumbers.length > 0) {
            phoneToSearch = patient.phoneNumbers[0].value || patient.phoneNumbers[0].displayValue || '';
          } else {
            phoneToSearch = patient.phone_number || patient.phone || '';
          }
          
          return (
            givenName.includes(searchTerm) ||
            familyName.includes(searchTerm) ||
            displayName.includes(searchTerm) ||
            emailToSearch.includes(searchTerm) ||
            phoneToSearch.includes(searchTerm)
          );
        });
      } else {
        // Use all patients when no search term is provided
        filteredPatients = allPatients;
      }
      
      console.log(`Found ${filteredPatients.length} matching patients in Spruce API`);
      
      // Convert Spruce patients to our format with better field mapping
      const mappedPatients = filteredPatients.map((patient: any) => {
        // Extract name components based on the Spruce API response structure
        const givenName = patient.givenName || patient.given_name || '';
        const familyName = patient.familyName || patient.family_name || '';
        const displayName = patient.displayName || patient.display_name || '';
        
        // Compose a proper name using available fields
        const fullName = displayName || 
                        (givenName && familyName ? `${givenName} ${familyName}` : 
                        (givenName || familyName || 'Unknown Name'));
        
        // Extract phone from potentially nested objects
        let phoneNumber = '';
        if (patient.phoneNumbers && Array.isArray(patient.phoneNumbers) && patient.phoneNumbers.length > 0) {
          phoneNumber = patient.phoneNumbers[0].value || patient.phoneNumbers[0].displayValue || '';
        } else {
          phoneNumber = patient.phone_number || patient.phone || '';
        }
        
        // Extract email from potentially nested objects
        let emailAddress = '';
        if (patient.emailAddresses && Array.isArray(patient.emailAddresses) && patient.emailAddresses.length > 0) {
          emailAddress = patient.emailAddresses[0].value || patient.emailAddresses[0].address || '';
        } else {
          emailAddress = patient.email_address || patient.email || '';
        }
        
        // Extract date of birth
        const dob = patient.dateOfBirth || patient.birth_date || patient.date_of_birth || '';
        
        return {
          id: parseInt(patient.id) || Math.floor(Math.random() * 10000) + 1000,
          name: fullName,
          email: emailAddress,
          phone: phoneNumber,
          dateOfBirth: dob,
          gender: (patient.gender || 'unknown').toLowerCase(),
          language: patient.preferred_language || patient.language || null,
          spruceId: patient.id
        };
      });
      
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
    // Get patients directly from Spruce API using documented endpoint
    try {
      // Based on documentation, use the confirmed endpoint /v1/contacts
      console.log('Using documented endpoint /v1/contacts for sync');
      const response = await spruceApi.get('/v1/contacts', {
        params: {
          limit: 200
        }
      });
      
      // Log the raw response for debugging
      console.log('Raw Spruce API response structure:', JSON.stringify(response.data).substring(0, 500) + '...');
      
      // More flexible data extraction from response
      const sprucePatients = response.data.contacts || response.data.patients || response.data.data || [];
      
      // Convert Spruce patients to our format with better field mapping
      const mappedPatients = sprucePatients.map((patient: any) => {
        // Extract name components based on the Spruce API response structure
        const givenName = patient.givenName || patient.given_name || '';
        const familyName = patient.familyName || patient.family_name || '';
        const displayName = patient.displayName || patient.display_name || '';
        
        // Compose a proper name using available fields
        const fullName = displayName || 
                        (givenName && familyName ? `${givenName} ${familyName}` : 
                        (givenName || familyName || 'Unknown Name'));
        
        // Extract phone from potentially nested objects
        let phoneNumber = '';
        if (patient.phoneNumbers && Array.isArray(patient.phoneNumbers) && patient.phoneNumbers.length > 0) {
          phoneNumber = patient.phoneNumbers[0].value || patient.phoneNumbers[0].displayValue || '';
        } else {
          phoneNumber = patient.phone_number || patient.phone || '';
        }
        
        // Extract email from potentially nested objects
        let emailAddress = '';
        if (patient.emailAddresses && Array.isArray(patient.emailAddresses) && patient.emailAddresses.length > 0) {
          emailAddress = patient.emailAddresses[0].value || patient.emailAddresses[0].address || '';
        } else {
          emailAddress = patient.email_address || patient.email || '';
        }
        
        // Extract date of birth
        const dob = patient.dateOfBirth || patient.birth_date || patient.date_of_birth || '';
        
        return {
          id: parseInt(patient.id) || Math.floor(Math.random() * 10000) + 1000,
          name: fullName,
          email: emailAddress,
          phone: phoneNumber,
          dateOfBirth: dob,
          gender: (patient.gender || 'unknown').toLowerCase(),
          language: patient.preferred_language || patient.language || null,
          spruceId: patient.id
        };
      });
      
      res.json({ 
        message: `Retrieved ${mappedPatients.length} patients from Spruce API`,
        count: mappedPatients.length,
        source: 'spruce',
        patients: mappedPatients
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
      // Common headers for cache control
      const cacheHeaders = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      // Based on documentation, use the confirmed endpoint /v1/contacts
      console.log('Using documented endpoint /v1/contacts for refresh');
      const response = await spruceApi.get('/v1/contacts', {
        params: {
          _ts: timestamp, // Cache-busting
          limit: 200
        },
        headers: cacheHeaders
      });
      
      // Log the raw response for debugging
      console.log('Raw Spruce API response structure:', JSON.stringify(response.data).substring(0, 500) + '...');
      
      // More flexible data extraction from response
      const sprucePatients = response.data.contacts || response.data.patients || response.data.data || [];
      console.log(`Successfully refreshed ${sprucePatients.length} patients from Spruce API`);
      
      // Format and return the patient data with better field mapping, checking for nested fields
      const formattedPatients = sprucePatients.map((patient: any) => {
        // Extract name components based on the Spruce API response structure
        const givenName = patient.givenName || patient.given_name || '';
        const familyName = patient.familyName || patient.family_name || '';
        const displayName = patient.displayName || patient.display_name || '';
        
        // Compose a proper name using available fields
        const fullName = displayName || 
                         (givenName && familyName ? `${givenName} ${familyName}` : 
                         (givenName || familyName || 'Unknown Name'));
        
        // Extract phone from potentially nested objects
        let phoneNumber = '';
        if (patient.phoneNumbers && Array.isArray(patient.phoneNumbers) && patient.phoneNumbers.length > 0) {
          phoneNumber = patient.phoneNumbers[0].value || patient.phoneNumbers[0].displayValue || '';
        } else {
          phoneNumber = patient.phone_number || patient.phone || '';
        }
        
        // Extract email from potentially nested objects
        let emailAddress = '';
        if (patient.emailAddresses && Array.isArray(patient.emailAddresses) && patient.emailAddresses.length > 0) {
          emailAddress = patient.emailAddresses[0].value || patient.emailAddresses[0].address || '';
        } else {
          emailAddress = patient.email_address || patient.email || '';
        }
        
        return {
          id: parseInt(patient.id) || Math.floor(Math.random() * 10000) + 1000,
          name: fullName,
          email: emailAddress,
          phone: phoneNumber,
          dateOfBirth: patient.birth_date || patient.date_of_birth || '',
          gender: (patient.gender || 'unknown').toLowerCase(),
          language: patient.preferred_language || patient.language || null,
          spruceId: patient.id
        };
      });
      
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
    // From the documentation, we see that /v1/contacts is the correct endpoint
    const response = await spruceApi.get('/v1/contacts', {
      params: {
        limit: 1 // Request just one contact to minimize data transfer
      }
    });
    res.json({
      success: true,
      message: 'Successfully connected to Spruce API',
      data: response.data
    });
  } catch (error: any) {
    // Try webhooks endpoint as a fallback
    try {
      const fallbackResponse = await spruceApi.get('/v1/webhooks/endpoints');
      res.json({
        success: true,
        message: 'Successfully connected to Spruce API (fallback endpoint)',
        data: fallbackResponse.data
      });
    } catch (fallbackError: any) {
      console.error('Spruce API connection test failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      // Check for unauthorized access
      if (error.response?.status === 403) {
        return res.status(403).json({
          success: false,
          message: 'API key authentication failed. Please check your SPRUCE_API_KEY environment variable.',
          error: 'Authorization failed',
          details: error.response?.data
        });
      }
      
      // If we received headers from the API, show them for debugging
      const receivedHeaders = error.response?.headers || fallbackError.response?.headers;
      
      res.status(error.response?.status || 500).json({
        success: false,
        message: 'Failed to connect to Spruce API',
        error: error.message,
        details: error.response?.data,
        apiHeaders: receivedHeaders
      });
    }
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
      // Send the message through Spruce API using documented endpoint structure
      console.log('Sending message to patient through Spruce API');
      const spruceResponse = await spruceApi.post('/v1/messages', {
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
    
    // Get messages from Spruce API using correct endpoint format
    console.log(`Retrieving messages for patient ${patientId}`);
    
    // Use the documented endpoint from Spruce API
    const conversationsResponse = await spruceApi.get(`/v1/contacts/${patientId}/conversations`);
    console.log('Raw Spruce API messages response structure:', 
      JSON.stringify(conversationsResponse.data).substring(0, 500) + '...');
    
    // Extract conversations from response
    const conversations = conversationsResponse.data.conversations || [];
    let allMessages: any[] = [];
    
    // For each conversation, fetch messages
    for (const conversation of conversations) {
      const conversationId = conversation.id;
      if (!conversationId) continue;
      
      try {
        // Fetch messages for this conversation
        const messagesResponse = await spruceApi.get(`/v1/conversations/${conversationId}/messages`);
        console.log(`Raw message data for conversation ${conversationId}:`, 
          JSON.stringify(messagesResponse.data).substring(0, 300) + '...');
        const conversationMessages = messagesResponse.data.messages || [];
        
        if (conversationMessages.length === 0) {
          console.log(`No messages found in conversation ${conversationId}`);
        } else {
          console.log(`Found ${conversationMessages.length} messages in conversation ${conversationId}`);
        }
        
        // Add messages to allMessages
        allMessages = [...allMessages, ...conversationMessages.map((msg: any) => ({
          id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          patientId: patientId,
          conversationId: conversationId,
          content: msg.content || msg.text || '',
          timestamp: msg.created_at || msg.createdAt || new Date().toISOString(),
          isFromPatient: msg.sender && msg.sender.type === 'external',
          sender: msg.sender ? (msg.sender.type === 'external' ? 'Patient' : 'Doctor') : 'Unknown',
          attachmentUrl: msg.media && msg.media.url ? msg.media.url : null
        }))];
      } catch (err) {
        console.error(`Error fetching messages for conversation ${conversationId}:`, err);
      }
    }
    
    // Check if any message contains RAMQ card images
    const ramqVerification = allMessages.some(msg => 
      (msg.content && msg.content.toLowerCase().includes('ramq')) || 
      (msg.attachmentUrl && msg.attachmentUrl.toLowerCase().includes('photo'))
    );
    
    // Sort messages by timestamp
    allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log(`Found ${allMessages.length} messages for patient ${patientId}`);
    
    // Include RAMQ verification status in the response
    res.json({
      messages: allMessages,
      metadata: {
        ramqVerified: ramqVerification || false
      }
    });
  } catch (error: any) {
    console.error('Error fetching messages from Spruce API:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    // Return empty array with error details
    res.status(500).json({
      success: false, 
      error: error.message,
      messages: [],
      metadata: {
        ramqVerified: false
      }
    });
  }
});

// Send message to patient via Spruce API
router.post('/patients/:patientId/messages', async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    console.log(`Sending message to patient ${patientId}: ${content.substring(0, 50)}...`);
    
    // Find conversation ID first before sending a message
    const conversationsResponse = await spruceApi.get(`/v1/contacts/${patientId}/conversations`);
    if (!conversationsResponse.data || !conversationsResponse.data.conversations || !conversationsResponse.data.conversations.length) {
      // Create a new conversation if none exists
      console.log(`No existing conversations found for patient ${patientId}, creating a new one`);
      const newConversationResponse = await spruceApi.post('/v1/conversations', {
        contact_ids: [patientId],
        subject: 'New conversation'
      });
      const conversationId = newConversationResponse.data.id;
      
      // Now send the message to the newly created conversation
      const response = await spruceApi.post(`/v1/conversations/${conversationId}/messages`, {
        content: content,
        type: 'text'
      });
      return response;
    }
    
    // Use the first conversation found to send the message
    const conversationId = conversationsResponse.data.conversations[0].id;
    console.log(`Using existing conversation ID: ${conversationId} for patient ${patientId}`);
    const response = await spruceApi.post(`/v1/conversations/${conversationId}/messages`, {
      content: content,
      type: 'text'
    });
    
    // Extract the created message from response
    const createdMessage = response.data;
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        id: createdMessage.id || `msg-${Date.now()}`,
        patientId: patientId,
        content: content,
        timestamp: new Date().toISOString(),
        isFromPatient: false,
        sender: 'Doctor'
      }
    });
  } catch (error: any) {
    console.error('Error sending message via Spruce API:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});