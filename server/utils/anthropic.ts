import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const DEFAULT_MODEL = 'claude-3-7-sonnet-20250219';

/**
 * Generate text based on a prompt using Claude AI
 * @param prompt The prompt to generate text from
 * @param model Optional model identifier (defaults to latest Claude model)
 * @param maxTokens Optional max tokens to generate (defaults to 1024)
 * @returns The generated text
 */
export async function generateText(
  prompt: string,
  model: string = DEFAULT_MODEL,
  maxTokens: number = 1024
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      max_tokens: maxTokens,
      model: model,
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract and return the content from the first message part
    if (response.content[0].type === 'text') {
      return response.content[0].text;
    }
    return 'No text content returned from Claude AI.';
  } catch (error: any) {
    console.error('Error generating text with Claude:', error);
    throw new Error(`Failed to generate text with Claude: ${error.message}`);
  }
}

/**
 * Summarize a text using Claude AI
 * @param text The text to summarize
 * @param wordLimit Optional word limit for the summary
 * @param model Optional model identifier (defaults to latest Claude model)
 * @returns The summarized text
 */
export async function summarizeText(
  text: string,
  wordLimit: number = 250,
  model: string = DEFAULT_MODEL
): Promise<string> {
  try {
    const prompt = `Please summarize the following text in about ${wordLimit} words:\n\n${text}`;
    
    const response = await anthropic.messages.create({
      max_tokens: 1024,
      model: model,
      messages: [{ role: 'user', content: prompt }],
    });

    if (response.content[0].type === 'text') {
      return response.content[0].text;
    }
    return 'No text content returned from Claude AI.';
  } catch (error: any) {
    console.error('Error summarizing text with Claude:', error);
    throw new Error(`Failed to summarize text with Claude: ${error.message}`);
  }
}

/**
 * Analyze the sentiment of a text using Claude AI
 * @param text The text to analyze
 * @param model Optional model identifier (defaults to latest Claude model)
 * @returns Object with sentiment and confidence values
 */
export async function analyzeSentiment(
  text: string,
  model: string = DEFAULT_MODEL
): Promise<{ sentiment: string; confidence: number }> {
  try {
    const response = await anthropic.messages.create({
      model: model,
      system: `You're a Customer Insights AI. Analyze this feedback and output in JSON format with keys: "sentiment" (positive/negative/neutral) and "confidence" (number between 0 and 1).`,
      max_tokens: 1024,
      messages: [{ role: 'user', content: text }],
    });

    const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : '{"sentiment": "neutral", "confidence": 0.5}';
    
    try {
      const result = JSON.parse(jsonString);
      return {
        sentiment: result.sentiment,
        confidence: Math.max(0, Math.min(1, result.confidence)),
      };
    } catch (jsonError) {
      console.error('Error parsing sentiment JSON response:', jsonError);
      return { sentiment: 'neutral', confidence: 0.5 };
    }
  } catch (error) {
    console.error('Error analyzing sentiment with Claude:', error);
    throw new Error(`Failed to analyze sentiment with Claude: ${error.message}`);
  }
}

/**
 * Analyze an image using Claude Vision capabilities
 * @param imageBase64 Base64-encoded image data
 * @param prompt The prompt to use for image analysis
 * @param model Optional model identifier (defaults to latest Claude model)
 * @returns The analysis text
 */
export async function analyzeImage(
  imageBase64: string,
  prompt: string,
  model: string = DEFAULT_MODEL
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt || 'Analyze this image in detail and describe its key elements, context, and any notable aspects.'
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

    return response.content[0].text;
  } catch (error) {
    console.error('Error analyzing image with Claude:', error);
    throw new Error(`Failed to analyze image with Claude: ${error.message}`);
  }
}

/**
 * Generate medical documentation based on patient data
 * @param patientData Patient data including symptoms, chief complaint, etc.
 * @param options Options like document type (SOAP, etc.)
 * @param model Optional model identifier (defaults to latest Claude model)
 * @returns The generated medical documentation
 */
export async function generateMedicalDocumentation(
  patientData: any,
  options: any = { documentType: 'soap' },
  model: string = DEFAULT_MODEL
): Promise<string> {
  try {
    let prompt = `Please create a ${options.documentType.toUpperCase()} note for a patient with the following information:\n\n`;
    
    if (patientData.chiefComplaint) {
      prompt += `Chief Complaint: ${patientData.chiefComplaint}\n`;
    }
    
    if (patientData.symptoms) {
      prompt += `Symptoms: ${patientData.symptoms}\n`;
    }
    
    if (patientData.medicalHistory) {
      prompt += `Medical History: ${patientData.medicalHistory}\n`;
    }
    
    if (patientData.medications) {
      prompt += `Current Medications: ${patientData.medications}\n`;
    }
    
    if (patientData.allergies) {
      prompt += `Allergies: ${patientData.allergies}\n`;
    }
    
    if (patientData.vitals) {
      prompt += `Vitals: ${patientData.vitals}\n`;
    }
    
    prompt += `\nPlease format the note professionally and include all relevant sections for a ${options.documentType.toUpperCase()} note.`;
    
    const response = await anthropic.messages.create({
      max_tokens: 2048,
      model: model,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Error generating medical documentation with Claude:', error);
    throw new Error(`Failed to generate medical documentation with Claude: ${error.message}`);
  }
}

/**
 * Generate a treatment plan based on a diagnosis
 * @param diagnosis The patient's diagnosis
 * @param patientDetails Optional additional patient details
 * @param model Optional model identifier (defaults to latest Claude model)
 * @returns The generated treatment plan
 */
export async function generateTreatmentPlan(
  diagnosis: string,
  patientDetails: any = {},
  model: string = DEFAULT_MODEL
): Promise<string> {
  try {
    let prompt = `Please create a comprehensive treatment plan for a patient with the following diagnosis: ${diagnosis}\n\n`;
    
    if (patientDetails.age) {
      prompt += `Patient Age: ${patientDetails.age}\n`;
    }
    
    if (patientDetails.sex) {
      prompt += `Patient Sex: ${patientDetails.sex}\n`;
    }
    
    if (patientDetails.medicalHistory) {
      prompt += `Medical History: ${patientDetails.medicalHistory}\n`;
    }
    
    if (patientDetails.medications) {
      prompt += `Current Medications: ${patientDetails.medications}\n`;
    }
    
    if (patientDetails.allergies) {
      prompt += `Allergies: ${patientDetails.allergies}\n`;
    }
    
    prompt += `\nPlease include the following in the treatment plan:
1. Medication recommendations (with dosages if appropriate)
2. Lifestyle modifications
3. Follow-up care instructions
4. Potential referrals to specialists if needed
5. Patient education points
6. Warning signs that would require immediate medical attention`;
    
    const response = await anthropic.messages.create({
      max_tokens: 2048,
      model: model,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Error generating treatment plan with Claude:', error);
    throw new Error(`Failed to generate treatment plan with Claude: ${error.message}`);
  }
}