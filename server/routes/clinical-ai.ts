import express from "express";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import axios from "axios";

const router = express.Router();

// Ollama Configuration (ONLY AI provider - FREE!)
const OLLAMA_CONFIG = {
  URL: process.env.OLLAMA_URL || "https://ollama.instanthpi.ca",
  MODEL: process.env.OLLAMA_MODEL || "llama3.1:8b",
};

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

// Generate clinical report from consultation data
router.post("/generate-report", async (req, res) => {
  try {
    const { patientId, physicianPreferences } = req.body;

    // Fetch consultation data
    const { data: consultation, error } = await supabase
      .from("consultations")
      .select("*")
      .eq("patient_id", patientId)
      .single();

    if (error || !consultation) {
      return res.status(404).json({ error: "Consultation not found" });
    }

    // Build prompt from consultation data
    const prompt = buildPromptFromConsultation(consultation);

    // Generate HTML report with physician preferences
    const htmlReport = await generateClinicalReport(prompt, physicianPreferences);

    // Store the generated report
    await supabase.from("ai_processing_logs").insert({
      consultation_id: consultation.id,
      command: "generate_report",
      input_data: consultation,
      output_data: { html: htmlReport },
      processing_time_ms: Date.now(),
    });

    res.json({
      success: true,
      html: htmlReport,
      consultation: consultation,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Build prompt from consultation data
function buildPromptFromConsultation(consultation: any): string {
  const formData = consultation.form_data || {};

  return `Please write your generated Patient ID here: ${consultation.patient_id}
Gender: ${formData.gender === "male" ? "Masculin" : formData.gender === "female" ? "Féminin" : formData.gender}
Age: ${formData.age}
What brings you to the clinic today?: ${consultation.chief_complaint}
When did this problem start (dd/mm/yyyy)?: ${consultation.duration || formData.symptomOnset}
Was there a specific trigger?: ${consultation.trigger || formData.trigger}
Where is the symptom located?: ${consultation.location || formData.location}
How would you describe your symptom?: ${consultation.symptoms || formData.description}
What makes the symptom worse?: ${consultation.aggravating_factors || formData.aggravatingFactors}
What relieves the symptom?: ${consultation.relieving_factors || formData.relievingFactors}
On a scale of 0 to 10, how severe is your symptom?: ${consultation.severity}
How has the symptom evolved over time?: ${consultation.evolution || formData.evolution}
Are you experiencing any of the following symptoms?: ${consultation.associated_symptoms || formData.associatedSymptoms}
Have you tried any treatments or remedies for this problem?: ${consultation.treatments_tried || formData.treatmentsTried}
Were the treatments effective?: ${consultation.treatment_response || formData.treatmentResponse}
Do you have any chronic conditions?: ${consultation.chronic_conditions || formData.chronicConditions}
Do you have any known medication allergies?: ${consultation.allergies || formData.medicationAllergies}
Are you pregnant or breastfeeding?: ${consultation.pregnancy_breastfeeding || formData.pregnancyBreastfeeding}
Is there anything else we should know about your current condition?: ${consultation.other_notes || formData.otherNotes}`;
}

// Generate clinical report using OpenAI
async function generateClinicalReport(prompt: string, preferences: any): Promise<string> {
  const systemPrompt = buildSystemPrompt(preferences);
  const fullPrompt = prompt + buildUserInstructions(preferences);

  try {
    console.log(`Using Ollama at ${OLLAMA_CONFIG.URL} with model ${OLLAMA_CONFIG.MODEL}`);

    const ollamaResponse = await axios.post(
      `${OLLAMA_CONFIG.URL}/api/generate`,
      {
        model: OLLAMA_CONFIG.MODEL,
        prompt: `${systemPrompt}\n\n${fullPrompt}`,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 4096,
        },
      },
      {
        timeout: 60000, // 60 second timeout for large model
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (ollamaResponse.data?.response) {
      console.log("Successfully generated report with Ollama");
      return formatResponseAsHTML(ollamaResponse.data.response, preferences);
    } else {
      throw new Error("No response from Ollama");
    }
  } catch (error: any) {
    console.error("Ollama error:", error.message);
    throw new Error(
      `AI generation failed: ${error.message}. Make sure Ollama is running on your laptop.`
    );
  }
}

// Build system prompt based on preferences
function buildSystemPrompt(preferences: any): string {
  const language = preferences?.language || "fr";

  if (language === "fr") {
    return `You are a medical AI assistant that generates HTML medical reports. You MUST output ONLY valid HTML code, starting with <!DOCTYPE html> and ending with </html>. 

CRITICAL: Your entire response must be a complete HTML document. Do not output markdown, plain text, or any other format.

MOST IMPORTANT RULES FOR LANGUAGE:
1. Create NATURAL, FLOWING FRENCH SENTENCES - do not just copy-paste patient input
2. Transform patient raw data into proper medical French language
3. Use proper capitalization (only capitalize proper nouns, start of sentences)
4. Create coherent, professional medical summaries
5. Referrals must be COMPREHENSIVE with complete clinical details

CRITICAL SUBTITLE FORMAT - MOST IMPORTANT:
- MUST show: "Age ans · Gender · DIAGNOSIS_NAME Percentage%"
- Example: "56 ans · Femme · Infection urinaire 85%"
- Example: "46 ans · Homme · Épisode dépressif 80%"
- The diagnosis name MUST appear before the percentage

Generate a complete medical report using the comprehensive HTML template with all sections.`;
  } else {
    return `You are a medical AI assistant that generates HTML medical reports in English. Output ONLY valid HTML code.

Generate professional medical documentation with:
1. Natural, flowing medical English
2. Proper medical terminology
3. Comprehensive clinical details
4. Complete differential diagnosis approach

SUBTITLE FORMAT: "Age years · Gender · DIAGNOSIS_NAME Percentage%"
Example: "56 years · Female · Urinary Tract Infection 85%"`;
  }
}

// Build user instructions based on preferences
function buildUserInstructions(preferences: any): string {
  const sections = [];

  if (preferences?.showClinicalStrategy !== false) {
    sections.push("Include Clinical Strategy section with differential diagnosis");
  }
  if (preferences?.showHPI !== false) {
    sections.push("Include HPI confirmation summary");
  }
  if (preferences?.showSOAP !== false) {
    sections.push("Include SOAP note");
  }
  if (preferences?.showFollowUpQuestions !== false) {
    sections.push("Include 10 follow-up questions");
  }
  if (preferences?.showMedications !== false) {
    sections.push("Include medications organized by diagnosis");
  }
  if (preferences?.showLaboratory !== false) {
    sections.push("Include laboratory tests");
  }
  if (preferences?.showImaging !== false) {
    sections.push("Include imaging requisitions");
  }
  if (preferences?.showReferrals !== false) {
    sections.push("Include specialist referrals");
  }
  if (preferences?.showWorkLeave !== false) {
    sections.push("Include work leave declaration");
  }
  if (preferences?.showWorkModifications !== false) {
    sections.push("Include work modification recommendations");
  }
  if (preferences?.showInsuranceDeclaration !== false) {
    sections.push("Include insurance declaration");
  }

  return `

GENERATE THE FOLLOWING SECTIONS:
${sections.join("\n")}

${preferences?.includeRationale ? "Include clinical rationale for treatments" : "Omit rationale"}
${preferences?.includeDifferentialDiagnosis ? "Include detailed differential diagnosis" : "Simple diagnosis only"}
${preferences?.includeRedFlags ? "Include red flags to watch" : "Omit red flags"}
${preferences?.medicationWarnings ? "Include medication warnings" : "Omit warnings"}

Use ${preferences?.medicalTerminology === "simplified" ? "simplified" : "standard"} medical terminology.
Today's date: ${new Date().toLocaleDateString("fr-CA")}`;
}

// Apply physician preferences to hide sections
function applyPhysicianPreferences(html: string, preferences: any): string {
  if (!preferences) return html;

  // Hide sections based on preferences
  const sectionsToHide = [];

  if (!preferences.showClinicalStrategy) {
    sectionsToHide.push("1. Stratégie Clinique");
  }
  if (!preferences.showHPI) {
    sectionsToHide.push("2. Histoire de la Maladie");
  }
  if (!preferences.showSOAP) {
    sectionsToHide.push("3. Super Spartan SOAP");
  }
  if (!preferences.showFollowUpQuestions) {
    sectionsToHide.push("4. Questions de Suivi");
  }
  if (!preferences.showWorkLeave) {
    sectionsToHide.push("6. Déclaration d'Arrêt");
  }
  if (!preferences.showWorkModifications) {
    sectionsToHide.push("7. Recommandations de Modification");
  }
  if (!preferences.showInsuranceDeclaration) {
    sectionsToHide.push("8. Déclaration d'Assurance");
  }

  // Use regex to hide sections
  let modifiedHtml = html;
  sectionsToHide.forEach((section) => {
    const regex = new RegExp(`<h3[^>]*>${section}[^<]*</h3>[\\s\\S]*?(?=<h3|<hr|</body>)`, "gi");
    modifiedHtml = modifiedHtml.replace(regex, "");
  });

  return modifiedHtml;
}

// Process custom AI command
router.post("/process-command", async (req, res) => {
  try {
    const { command, consultation, template } = req.body;

    let prompt = "";

    if (template === "referral_pt") {
      prompt = `Generate a comprehensive physiotherapy referral in French for: ${JSON.stringify(consultation)}`;
    } else if (template === "referral_ot") {
      prompt = `Generate a comprehensive occupational therapy referral in French for: ${JSON.stringify(consultation)}`;
    } else if (template === "referral_social") {
      prompt = `Generate a comprehensive social work referral in French for: ${JSON.stringify(consultation)}`;
    } else if (template === "imaging") {
      prompt = `Generate a comprehensive imaging requisition in French for: ${JSON.stringify(consultation)}`;
    } else {
      prompt = command;
    }

    const response = await generateAIResponse(prompt);

    res.json({ output: response });
  } catch (error) {
    console.error("Error processing command:", error);
    res.status(500).json({ error: "Failed to process command" });
  }
});

// Format response as HTML
function formatResponseAsHTML(text: string, preferences: any): string {
  // Basic HTML template
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Clinical Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #666; }
    h3 { color: #999; }
    .section { margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="section">
    ${text.replace(/\n/g, "<br>")}
  </div>
</body>
</html>`;

  return applyPhysicianPreferences(html, preferences);
}

// Generate AI response for custom commands
async function generateAIResponse(prompt: string): Promise<string> {
  try {
    // Use Ollama for AI responses
    const response = await axios.post(
      `${OLLAMA_CONFIG.URL}/api/generate`,
      {
        model: OLLAMA_CONFIG.MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 2048,
        },
      },
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.response || "Unable to generate response";
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

export default router;
