import axios from 'axios';

// Initialize Formsite API client
const formsiteClient = axios.create({
  baseURL: 'https://fs3.formsite.com/api/v2',
  headers: {
    'Authorization': `Bearer ${process.env.FORMSITE_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Define the form IDs for the two forms we're using
// Based on the Formsite URLs provided
const FORMS = {
  URGENT_CARE: 'zUW21K/cetzidycge', // General consultation form
  STD_CHECKUP: 'zUW21K/vybfr7pych'  // STD checkup form (ITSS)
};

/**
 * Find a form submission by pseudonym
 * @param pseudonym The pseudonym provided by the patient
 * @returns Form submission data if found
 */
export async function findSubmissionByPseudonym(pseudonym: string): Promise<{
  success: boolean;
  formType?: 'urgent_care' | 'std_checkup';
  formData?: any;
  message: string;
}> {
  try {
    // Check urgent care form first
    const urgentCareResult = await searchFormForPseudonym(FORMS.URGENT_CARE, pseudonym);
    if (urgentCareResult.success) {
      return {
        success: true,
        formType: 'urgent_care',
        formData: urgentCareResult.data,
        message: 'Found submission in urgent care form'
      };
    }
    
    // Check STD checkup form if not found in urgent care
    const stdCheckupResult = await searchFormForPseudonym(FORMS.STD_CHECKUP, pseudonym);
    if (stdCheckupResult.success) {
      return {
        success: true,
        formType: 'std_checkup',
        formData: stdCheckupResult.data,
        message: 'Found submission in STD checkup form'
      };
    }
    
    // Not found in either form
    return {
      success: false,
      message: 'No submission found with the provided pseudonym'
    };
  } catch (error) {
    console.error('Error searching for pseudonym:', error);
    return {
      success: false,
      message: 'Error searching for pseudonym in Formsite'
    };
  }
}

/**
 * Search a specific form for a pseudonym
 * @param formId The ID of the form to search
 * @param pseudonym The pseudonym to search for
 * @returns Search result
 */
async function searchFormForPseudonym(formId: string, pseudonym: string): Promise<{
  success: boolean;
  data?: any;
}> {
  try {
    // Get recent submissions for the form
    const response = await formsiteClient.get(`/forms/${formId}/results`, {
      params: {
        // Adjust these parameters based on Formsite's API documentation
        sort: 'date_desc',
        limit: 100 // Adjust as needed
      }
    });
    
    const submissions = response.data.results || [];
    
    // Find submission with matching pseudonym
    // Note: The actual field name may differ based on your form structure
    const matchingSubmission = submissions.find((submission: any) => {
      // This assumes there's a field in your form for pseudonym
      // The path may need adjustment based on your form structure
      const submissionPseudonym = submission.items?.find((item: any) => 
        item.id === 'pseudonym_field_id' // Replace with actual field ID
      )?.value;
      
      return submissionPseudonym === pseudonym;
    });
    
    if (matchingSubmission) {
      // Fetch complete submission data
      const detailResponse = await formsiteClient.get(`/forms/${formId}/results/${matchingSubmission.id}`);
      return {
        success: true,
        data: detailResponse.data
      };
    }
    
    return {
      success: false
    };
  } catch (error) {
    console.error(`Error searching form ${formId} for pseudonym:`, error);
    return {
      success: false
    };
  }
}

/**
 * Generate an HPI confirmation summary based on form data
 * @param formType The type of form
 * @param formData The form submission data
 * @returns HPI confirmation summary
 */
export async function generateHPIConfirmationSummary(
  formType: 'urgent_care' | 'std_checkup',
  formData: any
): Promise<string> {
  try {
    // Process form data to extract relevant information based on form type
    const processedData = processFormData(formType, formData);
    
    // Call OpenAI to generate the HPI summary
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Format variables from form data to match the expected template
    const variables = mapFormDataToTemplate(processedData, formType);
    
    // Create the prompt following the specified format
    const prompt = {
      role: "system",
      content: {
        task: "You are a medical transcription AI. Output is in French. Your role is to generate five clearly separated sections based strictly on the variable values provided. You must not create or guess any additional information.",
        instructions: {
          data_source: "Use only the following variables as your input data. Do not add any symptoms, background, or interpretation not directly found in these values.",
          variables: variables,
          output_structure: [
            {
              section: "HPI Confirmation Summary",
              description: "Generate a patient-friendly summary using only the variable content. Use natural language, but do not invent or assume any information not present in the inputs. Never ask their gender and age.",
              format: "Label as 'HPI Confirmation Summary' followed by a line of dashes, then the content as one paragraph."
            },
            {
              section: "Super Spartan SOAP Note",
              description: "Create a compact clinical SOAP note (Subjective, Assessment, Plan), using only the variables. Do not add clinical reasoning or diagnostic suggestions not directly supported by the provided data.",
              format: "Label as 'Super Spartan SOAP Note' followed by a line of dashes. Then list:\nS: ...\nA: ...\nP: ..."
            },
            {
              section: "Plan – Bullet Points",
              description: "Create a list of next steps using only relevant information based on the symptom, severity, and context. Include testing and realistic options, but do not speculate.",
              format: "Label as 'Plan – Bullet Points' followed by a line of dashes, then 3–6 bullet points."
            },
            {
              section: "In case this is a telemedicine consultation",
              description: "If applicable, include a short disclaimer explaining when in-person care is required. Only include this if symptoms suggest in-person assessment (e.g., pain, neurological signs, etc.).",
              format: "Label as 'In case this is a telemedicine consultation:' followed by a line of dashes, then 4–6 sentences explaining what features of the case require in-person diagnostics, which tests may be needed, and where the patient should go (clinic, urgent care, or ER)."
            },
            {
              section: "Follow-Up Questions",
              description: "Generate clear and conversational follow-up medical questions based on the patient's symptoms, chronic conditions, lifestyle, and treatments.",
              format: "Label as 'Follow-Up Questions' followed by a line of dashes. Group questions per issue if more than one is identified. Each question should be written as a bullet point. Avoid clinical jargon, keep the tone conversational and patient-centered."
            }
          ],
          key_points: [
            "All messages prepared for communication with patients should be given in 1 paragraph output, 5-6 phrases long, in a spartan style.",
            "Do not identify the pseudonym in the HPI confirmation summary, but write above that it's for him and end with a question, asking to verify if this paragraph is exact.",
            "If Gelomyrtol is prescribed, mention: 'Je vous prescris un traitement à base de Gelomyrtol, un produit naturel composé de thym, eucalyptus, menthe et myrte, qui agit comme antimucolytique et possède un léger effet anti-infectieux.'",
            "Avoid any formatting like bold, markdown, or indentation inside SOAP.",
            "Super Spartan SOAP Note must remain extremely concise.",
            "Plan – Bullet Points should include realistic clinical actions based only on the patient's data."
          ]
        }
      }
    };
    
    const userMessage = {
      role: "user",
      content: `Please generate an HPI confirmation summary for a patient who submitted a ${formType} form. I need only the first section (HPI Confirmation Summary) as a concise, single paragraph (5-6 phrases) that verifies the patient's information. End with a question asking if this information is accurate.`
    };
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [prompt, userMessage]
    });
    
    const fullResponse = response.choices[0].message.content || 'Unable to generate HPI confirmation summary';
    
    // Extract just the HPI Confirmation Summary paragraph for patient communication
    // Remove any line breaks to make it a single paragraph
    const hpiSummary = extractHPISummary(fullResponse);
    
    return hpiSummary;
  } catch (error) {
    console.error('Error generating HPI confirmation summary:', error);
    return 'Error generating HPI confirmation summary';
  }
}

/**
 * Maps processed form data to the template variables expected by the OpenAI prompt
 */
function mapFormDataToTemplate(processedData: any, formType: 'urgent_care' | 'std_checkup'): any {
  // Initialize with empty strings for all expected fields
  const mappedVariables: Record<string, string> = {
    "Gender": "",
    "Age": "",
    "Chief Complaint": "",
    "Symptom Onset": "",
    "Trigger": "",
    "Location": "",
    "Description": "",
    "Aggravating Factors": "",
    "Relieving Factors": "",
    "Severity (0-10)": "",
    "Evolution": "",
    "Associated Symptoms": "",
    "Treatments Tried": "",
    "Treatment Response": "",
    "Chronic Conditions": "",
    "Medication Allergies": "",
    "Pregnancy/Breastfeeding": "",
    "Other Notes": ""
  };
  
  // Map the processed data fields to the expected template variables
  // This mapping would need to be adjusted based on the actual form field names
  if (formType === 'urgent_care') {
    mappedVariables["Chief Complaint"] = processedData.symptoms || "";
    mappedVariables["Symptom Onset"] = processedData.duration || "";
    mappedVariables["Severity (0-10)"] = processedData.severity || "";
    mappedVariables["Medication Allergies"] = processedData.allergies || "";
    mappedVariables["Treatments Tried"] = processedData.medications || "";
    // Add more mappings as needed
  } else { // std_checkup
    mappedVariables["Chief Complaint"] = processedData.symptoms || "";
    mappedVariables["Associated Symptoms"] = processedData.concerns || "";
    mappedVariables["Other Notes"] = `Last tested: ${processedData.lastTest || ""}, Protection used: ${processedData.protection || ""}`;
    // Add more mappings as needed
  }
  
  return mappedVariables;
}

/**
 * Extracts just the HPI Confirmation Summary from the full OpenAI response
 */
function extractHPISummary(fullResponse: string): string {
  try {
    // Try to extract just the HPI Confirmation Summary section
    const hpiStartIndex = fullResponse.indexOf("HPI Confirmation Summary");
    if (hpiStartIndex === -1) return fullResponse; // Return full response if section not found
    
    // Find the start of the content after the section header and dashes
    let contentStartIndex = fullResponse.indexOf("\n", hpiStartIndex);
    if (contentStartIndex === -1) return fullResponse;
    
    // Skip the dashes line
    contentStartIndex = fullResponse.indexOf("\n", contentStartIndex + 1);
    if (contentStartIndex === -1) return fullResponse;
    contentStartIndex++;
    
    // Find the end of the HPI section (start of next section or end of text)
    let contentEndIndex = fullResponse.indexOf("\n\n", contentStartIndex);
    if (contentEndIndex === -1) contentEndIndex = fullResponse.length;
    
    // Extract the content
    let hpiContent = fullResponse.substring(contentStartIndex, contentEndIndex).trim();
    
    // Replace any line breaks with spaces to ensure it's a single paragraph
    hpiContent = hpiContent.replace(/\n/g, ' ');
    
    // If the HPI content is empty, return the full response
    return hpiContent || fullResponse;
  } catch (error) {
    console.error('Error extracting HPI summary:', error);
    return fullResponse; // Return the full response if extraction fails
  }
}

/**
 * Process form data to extract relevant information
 * @param formType The type of form
 * @param formData The form submission data
 * @returns Processed data with relevant information
 */
function processFormData(formType: 'urgent_care' | 'std_checkup', formData: any): any {
  // This function would extract the relevant fields from the form data
  // The actual implementation depends on the structure of your forms
  
  // Example (would need to be adapted to your actual form structure):
  if (formType === 'urgent_care') {
    return {
      symptoms: extractFieldValue(formData, 'symptoms_field_id'),
      duration: extractFieldValue(formData, 'duration_field_id'),
      severity: extractFieldValue(formData, 'severity_field_id'),
      temperature: extractFieldValue(formData, 'temperature_field_id'),
      allergies: extractFieldValue(formData, 'allergies_field_id'),
      medications: extractFieldValue(formData, 'medications_field_id'),
    };
  } else {
    return {
      symptoms: extractFieldValue(formData, 'symptoms_field_id'),
      lastTest: extractFieldValue(formData, 'last_test_field_id'),
      sexualHistory: extractFieldValue(formData, 'sexual_history_field_id'),
      protection: extractFieldValue(formData, 'protection_field_id'),
      concerns: extractFieldValue(formData, 'concerns_field_id'),
    };
  }
}

/**
 * Extract a field value from form data
 * @param formData The form submission data
 * @param fieldId The ID of the field to extract
 * @returns The field value or undefined if not found
 */
function extractFieldValue(formData: any, fieldId: string): any {
  // This function would extract a specific field value from the form data
  // The actual implementation depends on the structure of your forms
  
  // Example (would need to be adapted to your actual form structure):
  const item = formData.items?.find((item: any) => item.id === fieldId);
  return item?.value;
}