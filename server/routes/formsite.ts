import { Router } from 'express';
import axios from 'axios';
import { storage } from '../storage';
import OpenAI from 'openai';

// Initialize OpenAI API
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// FormSite API configuration
const FORMSITE_API_KEY = process.env.FORMSITE_API_KEY;
const FORMSITE_BASE_URL = 'https://fs7.formsite.com/api/v2';
const FORMSITE_DIRECTORY = 'zUW21K';
const FORMSITE_FORM_ID = 'dkf2uu9hft';

// FormSite API client
const formsiteApi = axios.create({
  baseURL: `${FORMSITE_BASE_URL}/${FORMSITE_DIRECTORY}`,
  headers: {
    'Authorization': `Bearer ${FORMSITE_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

export const router = Router();

// Fetch all form submissions
router.get('/submissions', async (req, res) => {
  try {
    // Check if FormSite API key is available
    if (!FORMSITE_API_KEY) {
      return res.status(401).json({ message: 'FormSite API key not configured' });
    }
    
    // Get submissions from FormSite API
    const response = await formsiteApi.get(`/forms/${FORMSITE_FORM_ID}/results`);
    const formSubmissions = response.data.results || [];
    
    // Process and return the submissions
    const processedSubmissions = formSubmissions.map((submission: any) => ({
      id: submission.id,
      reference: submission.reference || '',
      status: submission.status || 'submitted',
      date_submitted: submission.date_created || new Date().toISOString(),
      results: submission.items || {},
      processed: Boolean(submission.processed),
      aiProcessedContent: submission.aiProcessedContent || ''
    }));
    
    res.json(processedSubmissions);
  } catch (error) {
    console.error('Error fetching FormSite submissions:', error);
    res.status(500).json({ message: 'Failed to fetch form submissions' });
  }
});

// Search form submissions - IMPORTANT: This must be placed BEFORE the :id route
router.get('/submissions/search', async (req, res) => {
  try {
    const query = req.query.q as string || '';
    
    // Check if FormSite API key is available
    if (!FORMSITE_API_KEY) {
      return res.status(401).json({ message: 'FormSite API key not configured' });
    }
    
    // Get all submissions from FormSite API
    const response = await formsiteApi.get(`/forms/${FORMSITE_FORM_ID}/results`);
    const formSubmissions = response.data.results || [];
    
    // Filter submissions based on the search query
    const filteredSubmissions = formSubmissions.filter((submission: any) => {
      const items = submission.items || {};
      
      // Convert all values to strings for searching
      const values = Object.values(items).map(value => {
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return String(value);
      }).join(' ').toLowerCase();
      
      return values.includes(query.toLowerCase());
    });
    
    // Process and return the filtered submissions
    const processedSubmissions = filteredSubmissions.map((submission: any) => ({
      id: submission.id,
      reference: submission.reference || '',
      status: submission.status || 'submitted',
      date_submitted: submission.date_created || new Date().toISOString(),
      results: submission.items || {},
      processed: Boolean(submission.processed),
      aiProcessedContent: submission.aiProcessedContent || ''
    }));
    
    // Always return an array, even if no results were found
    res.json(processedSubmissions);
  } catch (error) {
    console.error('Error searching FormSite submissions:', error);
    // Even on error, return an empty array to maintain consistent response format
    res.status(200).json([]);
  }
});

// Process a form submission with AI
router.post('/submissions/:id/process', async (req, res) => {
  try {
    const submissionId = req.params.id;
    console.log(`[DEBUG] Processing submission with ID: ${submissionId}`);
    
    // Check if FormSite API key is available
    if (!FORMSITE_API_KEY) {
      console.log('[DEBUG] FormSite API key not configured');
      return res.status(401).json({ message: 'FormSite API key not configured' });
    }
    console.log('[DEBUG] FormSite API key is present');
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('[DEBUG] OpenAI API key not configured');
      return res.status(401).json({ message: 'OpenAI API key not configured' });
    }
    console.log('[DEBUG] OpenAI API key is present');
    
    try {
      // Get submission from FormSite API
      const response = await formsiteApi.get(`/forms/${FORMSITE_FORM_ID}/results/${submissionId}`);
      const submission = response.data;
      
      if (!submission) {
        return res.status(404).json({ message: 'Form submission not found' });
      }
      
      // Extract form data
      const formData = submission.items || {};
      
      // Generate HPI Confirmation Summary using OpenAI
      const prompt = `
      <role>system</role>
      <task>You are a medical transcription AI. Output is in HTML format for History of Present Illness (HPI) confirmation summaries.</task>
      <format>
      <h3>HPI Confirmation Summary</h3>
      <p>Just to confirm what you've told me about your current medical concerns:</p>
      <ul>
        <li>Key issues extracted from patient input</li>
        <li>Include onset, duration, severity, etc.</li>
        <li>Include any relevant past medical history mentioned</li>
      </ul>
      <p>Is this correct? [Yes] [No, there are corrections needed]</p>
      </format>
      
      <example>
      <patient_input>
      I've been having chest pain for about 3 days now. It's mostly on the left side and gets worse when I take a deep breath. Started after I was moving some heavy boxes. I have asthma but this feels different. My dad had a heart attack when he was 62, I'm 58 now.
      </patient_input>
      <hpi_confirmation>
      <h3>HPI Confirmation Summary</h3>
      <p>Just to confirm what you've told me about your current medical concerns:</p>
      <ul>
        <li>You've been experiencing chest pain for approximately 3 days</li>
        <li>The pain is predominantly on the left side</li>
        <li>Pain worsens with deep breathing</li>
        <li>Symptoms began after moving heavy boxes</li>
        <li>You have a history of asthma but feel this is different</li>
        <li>Family history includes father with heart attack at age 62</li>
        <li>You are currently 58 years old</li>
      </ul>
      <p>Is this correct? [Yes] [No, there are corrections needed]</p>
      </hpi_confirmation>
      </example>
      
      Now, generate an HPI confirmation summary based on the following patient form submission data:
      ${JSON.stringify(formData, null, 2)}
      `;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 1000
      });
      
      const aiProcessedContent = completion.choices[0].message.content || '';
      
      // Return the processed content
      res.json({ 
        processed: true, 
        aiContent: aiProcessedContent 
      });
    } catch (apiError: any) {
      // If FormSite API returns a 404 for this submission
      if (apiError.response && apiError.response.status === 404) {
        return res.status(404).json({ 
          message: 'Form submission not found',
          processed: false
        });
      }
      
      // For other API errors
      console.error('FormSite API error during processing:', apiError.message);
      return res.status(500).json({
        message: 'Error connecting to FormSite API during processing',
        error: apiError.message
      });
    }
  } catch (error) {
    console.error('Error processing form submission with AI:', error);
    res.status(500).json({ message: 'Failed to process form submission' });
  }
});

// Fetch a single form submission by ID - This must be AFTER more specific routes
router.get('/submissions/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    
    // Check if FormSite API key is available
    if (!FORMSITE_API_KEY) {
      return res.status(401).json({ message: 'FormSite API key not configured' });
    }
    
    try {
      // Get submission from FormSite API
      const response = await formsiteApi.get(`/forms/${FORMSITE_FORM_ID}/results/${submissionId}`);
      const submission = response.data;
      
      if (!submission) {
        return res.status(404).json({ message: 'Form submission not found' });
      }
      
      // Process and return the submission
      const processedSubmission = {
        id: submission.id,
        reference: submission.reference || '',
        status: submission.status || 'submitted',
        date_submitted: submission.date_created || new Date().toISOString(),
        results: submission.items || {},
        processed: Boolean(submission.processed),
        aiProcessedContent: submission.aiProcessedContent || ''
      };
      
      res.json(processedSubmission);
    } catch (apiError: any) {
      // Check if this is a 404 error from the FormSite API
      if (apiError.response && apiError.response.status === 404) {
        return res.status(404).json({ message: 'Form submission not found' });
      }
      
      // For other API errors, return an appropriate error response
      console.error('FormSite API error:', apiError.message);
      return res.status(500).json({ 
        message: 'Error connecting to FormSite API', 
        error: apiError.message 
      });
    }
  } catch (error) {
    console.error('Error fetching FormSite submission:', error);
    res.status(500).json({ message: 'Failed to fetch form submission' });
  }
});

// Setup webhook for form submissions
router.post('/webhook', async (req, res) => {
  try {
    const { formReference, resultId } = req.body;
    
    // Verify this is a FormSite webhook by checking the form reference
    if (formReference !== FORMSITE_FORM_ID) {
      return res.status(400).json({ message: 'Invalid form reference' });
    }
    
    // Automatically process the new submission with AI
    try {
      // Get submission from FormSite API
      const response = await formsiteApi.get(`/forms/${FORMSITE_FORM_ID}/results/${resultId}`);
      const submission = response.data;
      
      if (!submission) {
        return res.status(404).json({ message: 'Form submission not found' });
      }
      
      // Extract form data
      const formData = submission.items || {};
      
      // Generate HPI Confirmation Summary using OpenAI
      const prompt = `
      <role>system</role>
      <task>You are a medical transcription AI. Output is in HTML format for History of Present Illness (HPI) confirmation summaries.</task>
      <format>
      <h3>HPI Confirmation Summary</h3>
      <p>Just to confirm what you've told me about your current medical concerns:</p>
      <ul>
        <li>Key issues extracted from patient input</li>
        <li>Include onset, duration, severity, etc.</li>
        <li>Include any relevant past medical history mentioned</li>
      </ul>
      <p>Is this correct? [Yes] [No, there are corrections needed]</p>
      </format>
      
      Now, generate an HPI confirmation summary based on the following patient form submission data:
      ${JSON.stringify(formData, null, 2)}
      `;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 1000
      });
      
      const aiProcessedContent = completion.choices[0].message.content || '';
      
      // Store the processed content with the submission
      // Note: In a real implementation, you would update the FormSite submission or store this in your database
      console.log('Automatically processed new form submission:', {
        id: resultId,
        aiContent: aiProcessedContent
      });
      
      res.status(200).json({ 
        message: 'Webhook received and processed successfully',
        processed: true
      });
    } catch (aiError) {
      console.error('Error automatically processing new submission:', aiError);
      res.status(200).json({ 
        message: 'Webhook received, but failed to process automatically',
        processed: false
      });
    }
  } catch (error) {
    console.error('Error handling FormSite webhook:', error);
    res.status(500).json({ message: 'Failed to process webhook' });
  }
});

export default router;