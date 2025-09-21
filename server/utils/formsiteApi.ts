import axios from "axios";
import { db } from "../db";
import { formsiteIntegrations } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Create a Formsite API client for a specific user
 * @param userId The ID of the user to create the client for
 * @returns A configured axios client for the user's Formsite account
 */
export async function createFormsiteClient(userId: number) {
  try {
    // Get the user's Formsite integration settings
    const [integration] = await db
      .select()
      .from(formsiteIntegrations)
      .where(eq(formsiteIntegrations.userId, userId));

    if (!integration) {
      throw new Error("No Formsite integration found for this user");
    }

    return axios.create({
      baseURL: integration.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${integration.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error creating Formsite client:", error);

    // Fall back to the global configuration
    return axios.create({
      baseURL: "https://fs3.formsite.com/api/v2",
      headers: {
        Authorization: `Bearer ${process.env.FORMSITE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
  }
}

/**
 * Get the form IDs for a specific user
 * @param userId The ID of the user to get form IDs for
 * @returns An object with form IDs for different form types
 */
export async function getUserFormIds(userId: number) {
  try {
    // Get the user's Formsite integration settings
    const [integration] = await db
      .select()
      .from(formsiteIntegrations)
      .where(eq(formsiteIntegrations.userId, userId));

    if (!integration) {
      // Return default form IDs
      return {
        URGENT_CARE: "zUW21K/cetzidycge", // Default general consultation form
        STD_CHECKUP: "zUW21K/vybfr7pych", // Default STD checkup form (ITSS)
      };
    }

    // Parse the user's form configuration
    const formConfig = (integration.formsConfiguration as Record<string, any>) || {};

    // Return the user's configured form IDs, or fall back to defaults
    return {
      URGENT_CARE: formConfig.urgent_care?.formId || "zUW21K/cetzidycge",
      STD_CHECKUP: formConfig.std_checkup?.formId || "zUW21K/vybfr7pych",
    };
  } catch (error) {
    console.error("Error getting user form IDs:", error);

    // Return default form IDs
    return {
      URGENT_CARE: "zUW21K/cetzidycge", // Default general consultation form
      STD_CHECKUP: "zUW21K/vybfr7pych", // Default STD checkup form (ITSS)
    };
  }
}

/**
 * Find a form submission by pseudonym
 * @param pseudonym The pseudonym provided by the patient
 * @returns Form submission data if found
 */
export async function findSubmissionByPseudonym(pseudonym: string): Promise<{
  success: boolean;
  formType?: "urgent_care" | "std_checkup";
  formData?: any;
  message: string;
}> {
  try {
    // Get form IDs (default values)
    const FORMS = {
      URGENT_CARE: "zUW21K/cetzidycge",
      STD_CHECKUP: "zUW21K/vybfr7pych",
    };

    // Check urgent care form first
    const urgentCareResult = await searchFormForPseudonym(FORMS.URGENT_CARE, pseudonym);
    if (urgentCareResult.success) {
      return {
        success: true,
        formType: "urgent_care",
        formData: urgentCareResult.data,
        message: "Found submission in urgent care form",
      };
    }

    // Check STD checkup form if not found in urgent care
    const stdCheckupResult = await searchFormForPseudonym(FORMS.STD_CHECKUP, pseudonym);
    if (stdCheckupResult.success) {
      return {
        success: true,
        formType: "std_checkup",
        formData: stdCheckupResult.data,
        message: "Found submission in STD checkup form",
      };
    }

    // Not found in either form
    return {
      success: false,
      message: "No submission found with the provided pseudonym",
    };
  } catch (error) {
    console.error("Error searching for pseudonym:", error);
    return {
      success: false,
      message: "Error searching for pseudonym in Formsite",
    };
  }
}

/**
 * Search a specific form for a pseudonym
 * @param formId The ID of the form to search
 * @param pseudonym The pseudonym to search for
 * @returns Search result
 */
async function searchFormForPseudonym(
  formId: string,
  pseudonym: string
): Promise<{
  success: boolean;
  data?: any;
}> {
  try {
    // Create Formsite client (use default user 1 for now)
    const formsiteClient = await createFormsiteClient(1);

    // Get recent submissions for the form
    const response = await formsiteClient.get(`/forms/${formId}/results`, {
      params: {
        // Adjust these parameters based on Formsite's API documentation
        sort: "date_desc",
        limit: 100, // Adjust as needed
      },
    });

    const submissions = response.data.results || [];

    // Find submission with matching pseudonym
    // Note: The actual field name may differ based on your form structure
    const matchingSubmission = submissions.find((submission: any) => {
      // This assumes there's a field in your form for pseudonym
      // The path may need adjustment based on your form structure
      const submissionPseudonym = submission.items?.find(
        (item: any) => item.id === "pseudonym_field_id" // Replace with actual field ID
      )?.value;

      return submissionPseudonym === pseudonym;
    });

    if (matchingSubmission) {
      // Create Formsite client (use default user 1 for now)
      const formsiteClient = await createFormsiteClient(1);

      // Fetch complete submission data
      const detailResponse = await formsiteClient.get(
        `/forms/${formId}/results/${matchingSubmission.id}`
      );
      return {
        success: true,
        data: detailResponse.data,
      };
    }

    return {
      success: false,
    };
  } catch (error) {
    console.error(`Error searching form ${formId} for pseudonym:`, error);
    return {
      success: false,
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
  formType: "urgent_care" | "std_checkup",
  formData: any
): Promise<string> {
  try {
    // Process form data to extract relevant information based on form type
    const processedData = processFormData(formType, formData);

    // Call OpenAI to generate the HPI summary
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Format variables from form data to match the expected template
    const variables = mapFormDataToTemplate(processedData, formType);

    // Create the system prompt for natural French medical language
    const systemPrompt = `You are a medical transcription AI. Generate a natural French HPI confirmation summary that a doctor would say to a patient.

Format requirements:
- Start exactly with: "Juste pour confirmer avec vous avant de continuer; vous êtes un(e) [gender] de [age] ans"
- Continue as a single flowing paragraph with medical details
- Use natural French medical language like: "présentant", "depuis", "localisés", "décrite comme", "aggravée par", "soulagée par", "accompagnée de", "vos antécédents incluent", "allergique à"
- End exactly with: "; Est-ce que ce résumé est exact ?"
- NO bullet points, NO line breaks, NO lists
- One continuous paragraph that flows naturally

Example format:
"Juste pour confirmer avec vous avant de continuer; vous êtes un homme de 45 ans présentant depuis ce matin une douleur thoracique aiguë, localisée côté gauche, aggravée par la respiration profonde, soulagée par le repos, accompagnée de douleur thoracique et essoufflement; vos antécédents incluent hypertension; allergique à aucune; Est-ce que ce résumé est exact ?"

Patient data: ${JSON.stringify(variables, null, 2)}`;

    const userMessage = `Generate the HPI confirmation summary using the exact format specified in the system prompt.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const fullResponse =
      response.choices[0].message.content || "Unable to generate HPI confirmation summary";

    // Extract just the HPI Confirmation Summary paragraph for patient communication
    // Remove any line breaks to make it a single paragraph
    const hpiSummary = extractHPISummary(fullResponse);

    return hpiSummary;
  } catch (error) {
    console.error("Error generating HPI confirmation summary:", error);
    return "Error generating HPI confirmation summary";
  }
}

/**
 * Maps processed form data to the template variables expected by the OpenAI prompt
 */
function mapFormDataToTemplate(processedData: any, formType: "urgent_care" | "std_checkup"): any {
  // Initialize with empty strings for all expected fields
  const mappedVariables: Record<string, string> = {
    Gender: "",
    Age: "",
    "Chief Complaint": "",
    "Symptom Onset": "",
    Trigger: "",
    Location: "",
    Description: "",
    "Aggravating Factors": "",
    "Relieving Factors": "",
    "Severity (0-10)": "",
    Evolution: "",
    "Associated Symptoms": "",
    "Treatments Tried": "",
    "Treatment Response": "",
    "Chronic Conditions": "",
    "Medication Allergies": "",
    "Pregnancy/Breastfeeding": "",
    "Other Notes": "",
  };

  // Map the processed data fields to the expected template variables
  // This mapping would need to be adjusted based on the actual form field names
  if (formType === "urgent_care") {
    mappedVariables["Chief Complaint"] = processedData.symptoms || "";
    mappedVariables["Symptom Onset"] = processedData.duration || "";
    mappedVariables["Severity (0-10)"] = processedData.severity || "";
    mappedVariables["Medication Allergies"] = processedData.allergies || "";
    mappedVariables["Treatments Tried"] = processedData.medications || "";
    // Add more mappings as needed
  } else {
    // std_checkup
    mappedVariables["Chief Complaint"] = processedData.symptoms || "";
    mappedVariables["Associated Symptoms"] = processedData.concerns || "";
    mappedVariables["Other Notes"] =
      `Last tested: ${processedData.lastTest || ""}, Protection used: ${processedData.protection || ""}`;
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
    hpiContent = hpiContent.replace(/\n/g, " ");

    // If the HPI content is empty, return the full response
    return hpiContent || fullResponse;
  } catch (error) {
    console.error("Error extracting HPI summary:", error);
    return fullResponse; // Return the full response if extraction fails
  }
}

/**
 * Process form data to extract relevant information
 * @param formType The type of form
 * @param formData The form submission data
 * @returns Processed data with relevant information
 */
function processFormData(formType: "urgent_care" | "std_checkup", formData: any): any {
  // This function would extract the relevant fields from the form data
  // The actual implementation depends on the structure of your forms

  // Example (would need to be adapted to your actual form structure):
  if (formType === "urgent_care") {
    return {
      symptoms: extractFieldValue(formData, "symptoms_field_id"),
      duration: extractFieldValue(formData, "duration_field_id"),
      severity: extractFieldValue(formData, "severity_field_id"),
      temperature: extractFieldValue(formData, "temperature_field_id"),
      allergies: extractFieldValue(formData, "allergies_field_id"),
      medications: extractFieldValue(formData, "medications_field_id"),
    };
  } else {
    return {
      symptoms: extractFieldValue(formData, "symptoms_field_id"),
      lastTest: extractFieldValue(formData, "last_test_field_id"),
      sexualHistory: extractFieldValue(formData, "sexual_history_field_id"),
      protection: extractFieldValue(formData, "protection_field_id"),
      concerns: extractFieldValue(formData, "concerns_field_id"),
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
