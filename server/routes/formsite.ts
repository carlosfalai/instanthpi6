import { Router } from 'express';
import axios from 'axios';
import { storage } from '../storage';
import OpenAI from 'openai';
import * as anthropicUtils from '../utils/anthropic';

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
      console.log('[DEBUG FORMSITE] API key is missing');
      return res.status(401).json({ message: 'FormSite API key not configured' });
    }
    console.log(`[DEBUG FORMSITE] Using API key: ${FORMSITE_API_KEY.substring(0, 5)}...`);
    
    // Get submissions from FormSite API
    console.log(`[DEBUG LIST] Making API call to list submissions`);
    const response = await formsiteApi.get(`/forms/${FORMSITE_FORM_ID}/results`);
    console.log(`[DEBUG LIST] Response status: ${response.status}`);
    console.log(`[DEBUG LIST] Response data keys:`, Object.keys(response.data));
    
    const formSubmissions = response.data.results || [];
    console.log(`[DEBUG LIST] Found ${formSubmissions.length} submissions`);
    
    // Process and return the submissions
    const processedSubmissions = formSubmissions.map((submission: any) => ({
      id: submission.id,
      reference: submission.reference || '',
      status: submission.status || 'submitted',
      date_submitted: submission.date_created || new Date().toISOString(),
      results: submission.items || {},
      processed: Boolean(submission.processed),
      aiProcessedContent: submission.aiProcessedContent || '',
      claudeContent: submission.claudeContent || ''
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
      aiProcessedContent: submission.aiProcessedContent || '',
      claudeContent: submission.claudeContent || ''
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
    const { modelType = 'both' } = req.body; // 'both', 'gpt', or 'claude'
    console.log(`[DEBUG] Processing submission with ID: ${submissionId}`);
    
    // Check if FormSite API key is available
    if (!FORMSITE_API_KEY) {
      console.log('[DEBUG] FormSite API key not configured');
      return res.status(401).json({ message: 'FormSite API key not configured' });
    }
    console.log('[DEBUG] FormSite API key is present');
    
    // Check if OpenAI API key is available (for backward compatibility)
    if (!process.env.OPENAI_API_KEY) {
      console.log('[DEBUG] OpenAI API key not configured');
      return res.status(401).json({ message: 'OpenAI API key not configured' });
    }
    console.log('[DEBUG] OpenAI API key is present');
    
    // Check if Anthropic API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('[DEBUG] Anthropic API key not configured');
      return res.status(401).json({ message: 'Anthropic API key not configured' });
    }
    console.log('[DEBUG] Anthropic API key is present');
    
    // Get submission from FormSite API (using list and filter approach)
    console.log(`[DEBUG PROCESS] Attempting to fetch submission ${submissionId} for processing via list`);
    
    // Get all submissions and find the one with matching ID
    const response = await formsiteApi.get(`/forms/${FORMSITE_FORM_ID}/results`);
    console.log(`[DEBUG PROCESS] Got list response with status: ${response.status}`);
    
    const allSubmissions = response.data.results || [];
    console.log(`[DEBUG PROCESS] Found ${allSubmissions.length} total submissions`);
    
    // Find the specific submission by ID
    const submission = allSubmissions.find((sub: any) => sub.id === submissionId);
    
    if (!submission) {
      console.log(`[DEBUG PROCESS] Submission with ID ${submissionId} not found in results`);
      return res.status(404).json({ message: 'Form submission not found', processed: false });
    }
    
    console.log(`[DEBUG PROCESS] Submission found with ID: ${submission.id}`);
    console.log(`[DEBUG PROCESS] Submission data keys: ${Object.keys(submission)}`);
    
    // Extract form data
    const formData = submission.items || {};
    
    // Initialize content variables
    let claudeContent = '';
    let openaiContent = '';
    
    // Process based on modelType
    console.log(`[DEBUG PROCESS] Processing form data with modelType: ${modelType}`);
    
    // Process with Claude if modelType is 'both' or 'claude'
    if (modelType === 'both' || modelType === 'claude') {
      console.log(`[DEBUG PROCESS] Processing with Claude 3.7 Sonnet`);
      try {
        // Define the prompt with the multilingual medical template format
        const claudeSystemPrompt = `You are a medical transcription AI that generates structured medical documentation based on patient form data. Format your response using HTML with a multilingual approach.`;
        
        const claudePrompt = `
Create a comprehensive medical report using this exact HTML template format:

<h2>Table of Contents</h2>
<ol>
  <li><a href="#section1">HPI Confirmation Summary</a></li>
  <li><a href="#section2">Super Spartan SAP Note</a></li>
  <li><a href="#section3">Follow-Up Questions</a></li>
  <li><a href="#section4">Plan – Bullet Points</a>
    <ol>
      <li><a href="#section4-1">Medications</a></li>
      <li><a href="#section4-2">Imaging</a></li>
      <li><a href="#section4-3">Labs</a></li>
      <li><a href="#section4-4">Referrals</a></li>
    </ol>
  </li>
  <li><a href="#section5">Spartan Clinical Strategy</a></li>
  <li><a href="#section6">Work Leave Declaration</a></li>
  <li><a href="#section7">Work Modification Recommendations</a></li>
  <li><a href="#section8">Insurance & Short-Term Disability Declaration</a></li>
</ol>

Each section should follow the format shown in the template, with both English and the patient's primary language (if identifiable from the data).

Based on this patient data:
${JSON.stringify(formData, null, 2)}

Generate appropriate content for all sections of the template. For the HPI Confirmation Summary, include both English and translated versions if possible.`;
        
        // Process with Claude using the new template format
        claudeContent = await anthropicUtils.processFormSubmission(formData, claudePrompt);
        console.log(`[DEBUG PROCESS] Successfully processed with Claude`);
      } catch (claudeError) {
        console.error('[DEBUG PROCESS] Error processing with Claude:', claudeError);
        claudeContent = '<p>Error processing with Claude AI</p>';
      }
    }
    
    // Process with GPT-4o if modelType is 'both' or 'gpt'
    if (modelType === 'both' || modelType === 'gpt') {
      console.log(`[DEBUG PROCESS] Processing with GPT-4o`);
      try {
        // Generate a complete medical report using the multilingual template
        const prompt = `
You are a medical transcription AI that generates structured medical documentation based on patient form data. Format your response using HTML with a multilingual approach.

Create a comprehensive medical report using this exact HTML template format:

<h2>Table of Contents</h2>
<ol>
  <li><a href="#section1">HPI Confirmation Summary</a></li>
  <li><a href="#section2">Super Spartan SAP Note</a></li>
  <li><a href="#section3">Follow-Up Questions</a></li>
  <li><a href="#section4">Plan – Bullet Points</a>
    <ol>
      <li><a href="#section4-1">Medications</a></li>
      <li><a href="#section4-2">Imaging</a></li>
      <li><a href="#section4-3">Labs</a></li>
      <li><a href="#section4-4">Referrals</a></li>
    </ol>
  </li>
  <li><a href="#section5">Spartan Clinical Strategy</a></li>
  <li><a href="#section6">Work Leave Declaration</a></li>
  <li><a href="#section7">Work Modification Recommendations</a></li>
  <li><a href="#section8">Insurance & Short-Term Disability Declaration</a></li>
</ol>

<h3><a name="section1">1. HPI Confirmation Summary</a></h3>
<p><strong>English (Physician Language):</strong><br>
Just to verify this with you beforehand, you are a {{Age}}-year-old {{Gender}} experiencing {{Description}} located in the {{Location}} that began on {{Onset}}. The symptom is rated {{Severity}} out of 10, worsens with {{Aggravating Factors}}, and is relieved by {{Relieving Factors}}. You also report {{Associated Symptoms}}. Relevant medical history: {{Chronic Conditions}}. No medication allergies reported.
</p>

<p><strong>Patient Language (if applicable):</strong><br>
Translated confirmation of the above.
</p>

<h3><a name="section2">2. Super Spartan SAP Note</a></h3>
<p><strong>S:</strong> {{Subjective findings in condensed clinical format}}</p>
<p><strong>A:</strong> {{Assessment with suspected diagnosis and differentials}}</p>
<p><strong>P:</strong> {{Plan overview}}</p>

Follow this template exactly to create a comprehensive medical report based on the following patient data:
${JSON.stringify(formData, null, 2)}
        `;
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "user", content: prompt }
          ],
          max_tokens: 1000
        });
        
        openaiContent = completion.choices[0].message.content || '';
        console.log(`[DEBUG PROCESS] Successfully processed with GPT-4o`);
      } catch (openaiError) {
        console.error('[DEBUG PROCESS] Error processing with GPT-4o:', openaiError);
        openaiContent = '<p>Error processing with GPT-4o</p>';
      }
    }
    
    // Return the processed content based on what was requested
    res.json({ 
      processed: true, 
      aiContent: openaiContent,
      claudeContent: claudeContent
    });
    
  } catch (error: any) {
    console.error('Error processing form submission with AI:', error);
    
    // Check for FormSite API errors
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ 
        message: 'Form submission not found',
        processed: false
      });
    }
    
    // For all other errors
    res.status(500).json({ 
      message: 'Failed to process form submission',
      error: error.message
    });
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
    
    // Instead of direct API call by ID, which isn't working, get all submissions and find by ID
    console.log(`[DEBUG GET] Attempting to fetch submission ${submissionId} via list and filter`);
    
    try {
      // Get all submissions and find the one with matching ID
      const response = await formsiteApi.get(`/forms/${FORMSITE_FORM_ID}/results`);
      console.log(`[DEBUG GET] Got all submissions response with status: ${response.status}`);
      
      const allSubmissions = response.data.results || [];
      console.log(`[DEBUG GET] Found ${allSubmissions.length} total submissions`);
      
      // Find the specific submission by ID
      const submission = allSubmissions.find((sub: any) => sub.id === submissionId);
      
      if (!submission) {
        console.log(`[DEBUG GET] Submission with ID ${submissionId} not found in results`);
        return res.status(404).json({ message: 'Form submission not found' });
      }
      
      console.log(`[DEBUG GET] Found submission with ID ${submissionId} in results`)
      
      console.log(`[DEBUG GET] Submission found with ID: ${submission.id}`);
      console.log(`[DEBUG GET] Submission data keys: ${Object.keys(submission)}`);
      
      // Process and return the submission
      const processedSubmission = {
        id: submission.id,
        reference: submission.reference || '',
        status: submission.status || 'submitted',
        date_submitted: submission.date_created || new Date().toISOString(),
        results: submission.items || {},
        processed: Boolean(submission.processed),
        aiProcessedContent: submission.aiProcessedContent || '',
        claudeContent: submission.claudeContent || ''
      };
      
      res.json(processedSubmission);
    } catch (apiError: any) {
      // Log detailed error information
      console.error('[DEBUG GET] API Error:', apiError.message);
      
      if (apiError.response) {
        console.error('[DEBUG GET] Response status:', apiError.response.status);
        console.error('[DEBUG GET] Response headers:', JSON.stringify(apiError.response.headers));
        console.error('[DEBUG GET] Response data:', apiError.response.data);
        
        // Check if this is a 404 error from the FormSite API
        if (apiError.response.status === 404) {
          return res.status(404).json({ message: 'Form submission not found' });
        }
      }
      
      // For other API errors, return an appropriate error response
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
    
    console.log(`[DEBUG WEBHOOK] Processing webhook for resultId: ${resultId}`);
    
    try {
      // Get all submissions and find the one with matching ID
      console.log(`[DEBUG WEBHOOK] Attempting to fetch submission ${resultId} via list`);
      const response = await formsiteApi.get(`/forms/${FORMSITE_FORM_ID}/results`);
      console.log(`[DEBUG WEBHOOK] Got list response with status: ${response.status}`);
      
      const allSubmissions = response.data.results || [];
      console.log(`[DEBUG WEBHOOK] Found ${allSubmissions.length} total submissions`);
      
      // Find the specific submission by ID
      const submission = allSubmissions.find((sub: any) => sub.id === resultId);
      
      if (!submission) {
        console.log(`[DEBUG WEBHOOK] Submission with ID ${resultId} not found in results`);
        return res.status(404).json({ message: 'Form submission not found' });
      }
      
      console.log(`[DEBUG WEBHOOK] Submission found with ID: ${submission.id}`);
      
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
      
      // Process form submission with Claude 3.7 Sonnet
      console.log(`[DEBUG WEBHOOK] Processing form data with Claude 3.7 Sonnet`);
      let claudeContent = '';
      try {
        claudeContent = await anthropicUtils.processFormSubmission(formData);
        console.log(`[DEBUG WEBHOOK] Successfully processed with Claude`);
      } catch (claudeError) {
        console.error('[DEBUG WEBHOOK] Error processing with Claude:', claudeError);
        claudeContent = 'Error processing with Claude AI';
      }
      
      // Store the processed content with the submission
      // Note: In a real implementation, you would update the FormSite submission or store this in your database
      console.log(`[DEBUG WEBHOOK] Successfully processed submission ${resultId}`);
      
      res.status(200).json({ 
        message: 'Webhook received and processed successfully',
        processed: true,
        aiContent: aiProcessedContent,
        claudeContent: claudeContent
      });
    } catch (aiError: any) {
      console.error('Error automatically processing new submission:', aiError.message);
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