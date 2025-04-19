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
const FORMS = {
  URGENT_CARE: 'form1', // Replace with actual urgent care form ID
  STD_CHECKUP: 'form2'  // Replace with actual STD checkup form ID
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
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a medical assistant creating an HPI (History of Present Illness) confirmation summary based on patient-provided form data. Create a clear, concise summary that confirms the key details of the patient's condition."
        },
        {
          role: "user",
          content: `Please generate an HPI confirmation summary for a patient who submitted a ${formType} form. Here is the extracted data from their form submission:\n\n${JSON.stringify(processedData, null, 2)}`
        }
      ]
    });
    
    return response.choices[0].message.content || 'Unable to generate HPI confirmation summary';
  } catch (error) {
    console.error('Error generating HPI confirmation summary:', error);
    return 'Error generating HPI confirmation summary';
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