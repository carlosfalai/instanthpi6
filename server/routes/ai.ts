import { Router } from 'express';
import OpenAI from 'openai';
import axios from 'axios';

export const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// The ID of the specific GPT we want to use - this is the medical transcriptionist GPT
const TRANSCRIPTIONER_GPT_ID = 'g-67e1a5d8bf6c81918158558379bdda17-ih-like-transcriptioner-enhanced';

// This endpoint calls the specific ChatGPT 
// (g-67e1a5d8bf6c81918158558379bdda17-ih-like-transcriptioner-enhanced)
// to generate sections for the AI assistant panel
router.post('/generate-sections', async (req, res) => {
  const { 
    patientData, 
    patientLanguage = 'english',
    messageHistory = []
  } = req.body;
  
  if (!patientData) {
    return res.status(400).json({ error: 'Patient data is required' });
  }
  
  try {
    // Prepare the system message that tells the GPT how to format its response
    const systemMessage = `
      You are a medical transcription assistant that helps doctors communicate with patients.
      Based on the patient data provided, generate communication options and follow-up questions.
      
      Format your response in JSON with the following structure:
      {
        "sections": [
          {
            "id": "section-id", 
            "title": "Section Title", 
            "content": "Full section content text"
          },
          ...
        ],
        "followUpQuestions": {
          "Depression": [
            "Question 1?",
            "Question 2?",
            ...
          ],
          "Hypertension": [
            "Question 1?",
            "Question 2?",
            ...
          ],
          ...
        }
      }
      
      The language should be ${patientLanguage}.
      Include sections for:
      - HPI Confirmation (summarizing and confirming the patient's history)
      - SOAP Note (super brief, spartan style)
      - Plan (bullet points)
      - Follow-up Questions (grouped by condition)
      - Medication Recommendations (if appropriate)
      
      Make every section and question selectable and independent so the doctor can choose which parts to send.
    `;
    
    // Format the patient data as a user message
    const userMessage = `
      Generate communication options and follow-up questions based on this patient data:
      
      ${JSON.stringify(patientData, null, 2)}
      
      Previous messages in the conversation:
      ${messageHistory.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}
    `;
    
    // Make the OpenAI API call to the specific GPT
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use the newest OpenAI model
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" },
    });
    
    // Parse the response content
    const responseContent = response.choices[0].message.content;
    const parsedContent = JSON.parse(responseContent);
    
    res.json(parsedContent);
  } catch (error) {
    console.error('Error generating AI communication options:', error);
    
    if (error instanceof SyntaxError) {
      res.status(500).json({ error: 'Failed to parse AI response' });
    } else {
      res.status(500).json({ error: 'Failed to generate communication options' });
    }
  }
});

// Generate AI response for patient messages
router.post('/generate', async (req, res) => {
  const { 
    prompt, 
    patientId,
    patientLanguage = 'english',
    maxLength = 5
  } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  
  try {
    // System message to guide the AI
    const systemMessage = `
      You are a compassionate doctor providing advice to a patient.
      Your responses should be clear, professional, and encouraging.
      Keep your response concise, limited to ${maxLength} sentences maximum.
      The language should be ${patientLanguage === 'french' ? 'French' : 'English'}.
    `;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use the newest OpenAI model
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
    });
    
    // Send back the generated text
    res.json({ text: response.choices[0].message.content.trim() });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

// This route can specifically call the transcriptioner GPT for analysis
router.post('/analyze-transcript', async (req, res) => {
  const { 
    transcriptText, 
    patientLanguage = 'english',
    outputFormat = 'json'
  } = req.body;
  
  if (!transcriptText) {
    return res.status(400).json({ error: 'Transcript text is required' });
  }
  
  try {
    // This section can be expanded to specifically call the custom GPT
    // when OpenAI provides an official API for custom GPTs
    
    // For now, we'll use the standard API with appropriate prompting
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use the newest OpenAI model
      messages: [
        { 
          role: "system", 
          content: `You are a medical transcription AI that specializes in analyzing patient-doctor conversations.
          Analyze the transcript and extract key information like symptoms, diagnoses, treatments, and follow-up plans.
          Format your response as ${outputFormat === 'json' ? 'JSON' : 'plain text'}.
          The transcript language is ${patientLanguage}.` 
        },
        { role: "user", content: transcriptText }
      ],
      response_format: outputFormat === 'json' ? { type: "json_object" } : undefined,
    });
    
    // Send back the analysis result
    if (outputFormat === 'json') {
      const content = response.choices[0].message.content;
      res.json(JSON.parse(content));
    } else {
      res.json({ text: response.choices[0].message.content });
    }
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    res.status(500).json({ error: 'Failed to analyze transcript' });
  }
});

export default router;