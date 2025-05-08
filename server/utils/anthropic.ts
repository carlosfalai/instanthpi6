import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client with API key
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const DEFAULT_MODEL = 'claude-3-7-sonnet-20250219';

// Helper function to safely extract text from Anthropic response
function getTextFromContentBlock(block: any): string {
  if (block.type === 'text' && typeof block.text === 'string') {
    return block.text;
  }
  return '';
}

/**
 * Generate a response using Claude
 * @param prompt The user prompt to send to Claude
 * @param options Additional options for the request
 * @returns The generated response text
 */
export async function generateText(prompt: string, options?: {
  model?: string,
  system?: string,
  maxTokens?: number,
  temperature?: number,
}) {
  try {
    const response = await anthropic.messages.create({
      model: options?.model || DEFAULT_MODEL,
      system: options?.system,
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    return getTextFromContentBlock(response.content[0]);
  } catch (error) {
    console.error('Error generating text with Claude:', error);
    throw error;
  }
}

/**
 * Generate a JSON response using Claude
 * @param prompt The user prompt to send to Claude
 * @param schema A system message explaining the expected JSON schema
 * @param options Additional options for the request
 * @returns The parsed JSON response
 */
export async function generateJson<T>(prompt: string, schema: string, options?: {
  model?: string,
  maxTokens?: number,
  temperature?: number,
}) {
  try {
    const systemMessage = `${schema}\nYou must respond with valid JSON only, with no other text or explanation.`;
    
    const response = await anthropic.messages.create({
      model: options?.model || DEFAULT_MODEL,
      system: systemMessage,
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = getTextFromContentBlock(response.content[0]);
    if (!textContent) {
      throw new Error("Failed to generate JSON response");
    }
    return JSON.parse(textContent) as T;
  } catch (error) {
    console.error('Error generating JSON with Claude:', error);
    throw error;
  }
}

/**
 * Analyze an image using Claude's multimodal capabilities
 * @param imageBase64 The base64-encoded image data
 * @param prompt The prompt describing what to analyze in the image
 * @param options Additional options for the request
 * @returns The analysis response
 */
export async function analyzeImage(imageBase64: string, prompt: string, options?: {
  model?: string,
  maxTokens?: number,
  temperature?: number,
}) {
  try {
    const response = await anthropic.messages.create({
      model: options?.model || DEFAULT_MODEL,
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature || 0.7,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64
            }
          }
        ]
      }]
    });

    return getTextFromContentBlock(response.content[0]);
  } catch (error) {
    console.error('Error analyzing image with Claude:', error);
    throw error;
  }
}

/**
 * Get sentiment analysis for a text
 * @param text The text to analyze
 * @param options Additional options for the request
 * @returns A sentiment analysis object with sentiment and confidence
 */
export async function analyzeSentiment(text: string, options?: {
  model?: string,
  maxTokens?: number,
  temperature?: number,
}): Promise<{ sentiment: string, confidence: number }> {
  try {
    const response = await anthropic.messages.create({
      model: options?.model || DEFAULT_MODEL,
      system: `You're a Sentiment Analysis AI. Analyze this text and output in JSON format with keys: "sentiment" (positive/negative/neutral) and "confidence" (number, 0 through 1).`,
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature || 0.7,
      messages: [
        { role: 'user', content: text }
      ],
    });

    const textContent = getTextFromContentBlock(response.content[0]);
    if (!textContent) {
      throw new Error("Failed to analyze sentiment");
    }
    const result = JSON.parse(textContent);
    return {
      sentiment: result.sentiment,
      confidence: Math.max(0, Math.min(1, result.confidence))
    };
  } catch (error) {
    console.error('Error analyzing sentiment with Claude:', error);
    throw error;
  }
}

/**
 * Summarize text using Claude
 * @param text The text to summarize
 * @param options Additional options for the request
 * @returns The summarized text
 */
export async function summarizeText(text: string, options?: {
  model?: string,
  maxTokens?: number,
  temperature?: number,
  wordLimit?: number,
}) {
  const wordLimit = options?.wordLimit || 250;
  const systemPrompt = `You are an expert summarizer. Create a clear, concise summary of the following text in ${wordLimit} words or less.`;

  try {
    const response = await anthropic.messages.create({
      model: options?.model || DEFAULT_MODEL,
      system: systemPrompt,
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature || 0.7,
      messages: [{ role: 'user', content: text }],
    });

    return getTextFromContentBlock(response.content[0]);
  } catch (error) {
    console.error('Error summarizing text with Claude:', error);
    throw error;
  }
}

/**
 * Generate medical documentation using Claude
 * @param patientData Data about the patient and their condition
 * @param options Additional options for the request
 * @returns The generated medical documentation
 */
export async function generateMedicalDocumentation(patientData: {
  symptoms: string,
  medicalHistory?: string,
  vitalSigns?: string,
  chiefComplaint: string,
  patientLanguage?: string,
}, options?: {
  model?: string,
  maxTokens?: number,
  temperature?: number,
  documentType?: 'soap' | 'hpi' | 'progress' | 'discharge',
}) {
  const documentType = options?.documentType || 'soap';
  let systemPrompt = `You are a medical documentation assistant. Create a detailed ${documentType.toUpperCase()} note based on the patient information provided.`;
  
  if (patientData.patientLanguage && patientData.patientLanguage.toLowerCase() === 'french') {
    systemPrompt += ' Please write the documentation in French.';
  }

  try {
    const response = await anthropic.messages.create({
      model: options?.model || DEFAULT_MODEL,
      system: systemPrompt,
      max_tokens: options?.maxTokens || 2048,
      temperature: options?.temperature || 0.3, // Lower temperature for medical documentation
      messages: [{ 
        role: 'user', 
        content: `Patient presents with: ${patientData.chiefComplaint}\n\nSymptoms: ${patientData.symptoms}\n\n${patientData.medicalHistory ? `Medical History: ${patientData.medicalHistory}\n\n` : ''}${patientData.vitalSigns ? `Vital Signs: ${patientData.vitalSigns}` : ''}`
      }],
    });

    return getTextFromContentBlock(response.content[0]);
  } catch (error) {
    console.error('Error generating medical documentation with Claude:', error);
    throw error;
  }
}

/**
 * Generate a treatment plan using Claude
 * @param diagnosis The diagnosis for which to generate a treatment plan
 * @param patientDetails Additional details about the patient
 * @param options Additional options for the request
 * @returns The generated treatment plan
 */
export async function generateTreatmentPlan(diagnosis: string, patientDetails: {
  age?: number,
  medicalHistory?: string,
  allergies?: string[],
  currentMedications?: string[],
  patientLanguage?: string,
}, options?: {
  model?: string,
  maxTokens?: number,
  temperature?: number,
}) {
  const systemPrompt = `You are a medical treatment plan generator. Create a comprehensive treatment plan for the given diagnosis considering the patient's details. ${patientDetails.patientLanguage?.toLowerCase() === 'french' ? 'Please write the treatment plan in French.' : ''}`;

  try {
    const response = await anthropic.messages.create({
      model: options?.model || DEFAULT_MODEL,
      system: systemPrompt,
      max_tokens: options?.maxTokens || 2048,
      temperature: options?.temperature || 0.3, // Lower temperature for medical advice
      messages: [{ 
        role: 'user', 
        content: `Diagnosis: ${diagnosis}\n\n${patientDetails.age ? `Patient Age: ${patientDetails.age}\n\n` : ''}${patientDetails.medicalHistory ? `Medical History: ${patientDetails.medicalHistory}\n\n` : ''}${patientDetails.allergies?.length ? `Allergies: ${patientDetails.allergies.join(', ')}\n\n` : ''}${patientDetails.currentMedications?.length ? `Current Medications: ${patientDetails.currentMedications.join(', ')}` : ''}`
      }],
    });

    return getTextFromContentBlock(response.content[0]);
  } catch (error) {
    console.error('Error generating treatment plan with Claude:', error);
    throw error;
  }
}

export default {
  generateText,
  generateJson,
  analyzeImage,
  analyzeSentiment,
  summarizeText,
  generateMedicalDocumentation,
  generateTreatmentPlan
};