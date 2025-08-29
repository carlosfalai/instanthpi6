import express from "express";
import axios from "axios";
import OpenAI from "openai";
import {
  mapFormDataToTemplateVariables,
  fillTemplate,
  HPI_CONFIRMATION_TEMPLATE,
} from "../utils/medicalTemplates";

// Initialize the router
const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// FormSite API configuration
const FORMSITE_API_KEY = process.env.FORMSITE_API_KEY;
const FORMSITE_FORM_ID = process.env.FORMSITE_FORM_ID || "defaultFormId";

// Create axios instance for FormSite API
const formsiteApi = axios.create({
  baseURL: "https://fs3.formsite.com/api/v2",
  headers: {
    Authorization: `Bearer ${FORMSITE_API_KEY}`,
    "Content-Type": "application/json",
  },
});

// Field ID for pseudonym in the FormSite form
const PSEUDONYM_FIELD_ID = "5"; // Patient ID/pseudonym field

/**
 * Find form submission by pseudonym
 * This endpoint will search for a form submission with a matching pseudonym
 * and return the processed AI content using our medical template
 */
router.get("/lookup/:pseudonym", async (req, res) => {
  try {
    const pseudonym = req.params.pseudonym;

    // Check if FormSite API key is available
    if (!FORMSITE_API_KEY) {
      return res.status(401).json({ message: "FormSite API key not configured" });
    }

    // Get all submissions from FormSite API
    const response = await formsiteApi.get(`/forms/${FORMSITE_FORM_ID}/results`);
    const formSubmissions = response.data.results || [];

    // Find submission with matching pseudonym
    const matchingSubmission = formSubmissions.find((submission: any) => {
      const items = submission.items || {};

      // Look for the pseudonym field in the submission
      // The pseudonym could be stored in different formats depending on the FormSite response structure

      // Check if items is an object with string keys
      for (const key in items) {
        if (typeof key === "string") {
          // Parse field ID from key (could be in format "5" or "items[0][id]:5")
          const fieldId = key.includes(":") ? key.split(":")[1] : key;

          // If this is the pseudonym field and its value matches
          if (fieldId === PSEUDONYM_FIELD_ID) {
            const itemValue = items[key];
            // Check if the value is a string or if it's an object with a value property
            const value =
              typeof itemValue === "object" && itemValue?.value ? itemValue.value : itemValue;
            return value === pseudonym;
          }
        }
      }

      // If we haven't found it using the direct approach, try looking for it in complex objects
      const allValues = JSON.stringify(items).toLowerCase();
      return allValues.includes(pseudonym.toLowerCase());
    });

    if (!matchingSubmission) {
      return res.status(404).json({
        success: false,
        message: "No submission found with the provided pseudonym",
      });
    }

    // Check if the submission has already been processed and stored
    if (matchingSubmission.aiProcessedContent) {
      return res.status(200).json({
        success: true,
        submission_id: matchingSubmission.id,
        aiProcessedContent: matchingSubmission.aiProcessedContent,
      });
    }

    // If the submission is not yet processed, process it
    let aiProcessedContent = null;

    try {
      // Get the detailed submission data
      const detailResponse = await formsiteApi.get(
        `/forms/${FORMSITE_FORM_ID}/results/${matchingSubmission.id}`
      );
      const formData = detailResponse.data.items || {};

      // Try first approach: Use our template system
      try {
        // Map form data to template variables
        const variables = mapFormDataToTemplateVariables(formData);

        // Fill the template with the variables
        aiProcessedContent = fillTemplate(HPI_CONFIRMATION_TEMPLATE, variables);
      } catch (templateError) {
        console.error(
          "Error using template system, falling back to OpenAI generation:",
          templateError
        );

        // Fall back to OpenAI generation if template processing fails
        const prompt = `
        You are a medical transcription AI. I need you to format patient form data into a structured medical document.
        
        Here's the patient form data:
        ${JSON.stringify(formData, null, 2)}
        
        Please format this information into the following sections:
        1. HPI Confirmation Summary - A paragraph confirming the patient's symptoms, history, and concerns
        2. SOAP Note - A concise clinical note with Subjective, Assessment, and Plan sections
        3. Plan (bullet points) - Specific treatment recommendations
        4. Telemedicine consultation notes (if applicable)
        5. Follow-up questions for the patient
        6. Diagnostic strategy & reasoning
        
        Use proper HTML formatting with <h3> tags for headings and appropriate paragraph and list tags.
        Structure the document in a professional medical format suitable for physician review.
        `;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
          messages: [
            {
              role: "system",
              content:
                "You are a medical transcription AI that produces structured HTML documents from patient data.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 2000,
        });

        aiProcessedContent = completion.choices[0].message.content || "";
      }

      // Ideally, we would store this processed content back in the database
      // For now we'll just return it in the response
    } catch (aiError) {
      console.error("Error processing submission with AI:", aiError);
      return res.status(500).json({
        success: false,
        message: "Error processing submission with AI",
        submission_id: matchingSubmission.id,
      });
    }

    // Return the processed content
    return res.status(200).json({
      success: true,
      submission_id: matchingSubmission.id,
      aiProcessedContent,
    });
  } catch (error) {
    console.error("Error looking up submission by pseudonym:", error);
    res.status(500).json({ success: false, message: "Failed to look up submission" });
  }
});

export default router;
