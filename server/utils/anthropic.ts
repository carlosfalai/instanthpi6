import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const DEFAULT_MODEL = 'claude-3-7-sonnet-20250219';

// Example protocol to use as a template
const PROTOCOL_TEMPLATE = `🩺 Chronic Abdominal Pain
☐ Prepare message to the patient in their language (language considered to be the one used in the SMS-based secure messaging system to communicate with us)
☐ Prepare Spartan SOAP note (Make a super spartan note, no unnecessary details, no formatting, no fluff. Strict minimum like a real doctor would write. No stating 'Examen: Non réalisé'. Keep the plan to only essential interventions, ideally in one line.)
☐ This is a complex case: put all the details in the subjective part, so that we can find it in the final SOAP note.

Investigations and initial evaluation:
☐ Complete blood count (CBC)
☐ Comprehensive metabolic panel (CMP)
☐ Lipase and amylase
☐ Thyroid function tests (TSH, Free T4)
☐ Celiac disease panel
☐ Stool studies: occult blood, culture, ova & parasites, C. difficile toxin
☐ H. pylori testing
☐ Abdominal ultrasound
☐ Abdominal/pelvic CT with contrast
☐ Upper endoscopy (EGD) referral
☐ Colonoscopy referral if age >45 or concerning symptoms

Pain management (prescriptions for 30 days):
  ☐ Acetaminophen 500–1000 mg PO QID PRN x 30 days
  ☐ Dicyclomine 10 mg PO QID PRN for cramping x 30 days
  ☐ Omeprazole 20 mg PO daily x 30 days
  ☐ Hyoscyamine 0.125 mg SL QID PRN x 30 days

Treatment options:
  ☐ Low FODMAP diet trial for 4-6 weeks
  ☐ Fiber supplementation (psyllium 1 tsp daily)
  ☐ Probiotics daily
  ☐ Stress reduction techniques

☐ Referral to gastroenterology
☐ Referral to pain management if needed

☐ Counseling and hydration: Maintain food diary to identify trigger foods, practice regular meal timing, avoid large meals, maintain adequate hydration with 2-3 liters of water daily, implement stress reduction techniques like meditation or deep breathing exercises.

• Follow-up options: ☐ 1 week ☐ 2 weeks ☐ 3 weeks ☐ 1 month ☐ 2 months ☐ 3 months ☐ 6 months ☐ after results arrive at clinic, we will reach out to you`;

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
    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
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

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
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

/**
 * Generate a standard protocol for a specific diagnosis
 * @param diagnosisName The name of the diagnosis
 * @param diagnosisCategory The category of the diagnosis (acute, chronic, mental, etc.)
 * @param existingTreatments Array of existing treatments for this diagnosis
 * @param model Optional model identifier (defaults to latest Claude model)
 * @returns The generated standard protocol
 */
export async function generateStandardProtocol(
  diagnosisName: string,
  diagnosisCategory: string,
  existingTreatments: Array<{name: string, category: string}> = [],
  model: string = DEFAULT_MODEL
): Promise<string> {
  try {
    // Create a string with existing treatment options
    let treatmentsText = '';
    if (existingTreatments.length > 0) {
      treatmentsText = 'Existing treatment options for this diagnosis include:\n';
      
      // Group treatments by category
      const treatmentsByCategory: {[key: string]: string[]} = {};
      
      existingTreatments.forEach(treatment => {
        if (!treatmentsByCategory[treatment.category]) {
          treatmentsByCategory[treatment.category] = [];
        }
        treatmentsByCategory[treatment.category].push(treatment.name);
      });
      
      // Add treatments by category
      for (const [category, treatments] of Object.entries(treatmentsByCategory)) {
        treatmentsText += `- ${category.charAt(0).toUpperCase() + category.slice(1)}:\n`;
        treatments.forEach(treatment => {
          treatmentsText += `  - ${treatment}\n`;
        });
      }
    }
    
    const prompt = `I need you to create a detailed standard medical protocol for treating patients with ${diagnosisName}. 
This is a ${diagnosisCategory} condition.

${treatmentsText}

Use this example template as a reference and follow its format exactly, but adapt the content for ${diagnosisName}:

===TEMPLATE EXAMPLE===
${PROTOCOL_TEMPLATE}
===END TEMPLATE===

Please create a comprehensive protocol that starts with:
🩺 ${diagnosisName}

Include the standard header checklist items, and then create specific sections for:
1. Investigations and initial evaluation (relevant lab work, imaging, etc. for this condition)
2. Medication management with specific dosages and durations
3. Treatment options (procedures, therapies, lifestyle changes)
4. Potential referrals
5. Counseling and education points
6. Follow-up options

Be comprehensive and medically accurate. Include checkbox (☐) symbols before each item as shown in the template.`;

    const response = await anthropic.messages.create({
      max_tokens: 3000,
      model: model,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text;
  } catch (error: any) {
    console.error('Error generating standard protocol with Claude:', error);
    throw new Error(`Failed to generate standard protocol with Claude: ${error.message}`);
  }
}