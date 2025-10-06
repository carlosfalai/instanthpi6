import { Router } from "express";
import { createUserAIClient } from "../utils/aiClient";

const router = Router();

// AI client will be created per user based on their configuration

// Medical triage prompt based on Canadian Triage Acuity Scale (CTAS)
const TRIAGE_PROMPT = `You are an expert emergency medicine physician performing medical triage. Based on the patient information provided, determine the appropriate triage level and urgency.

Use the Canadian Triage and Acuity Scale (CTAS) levels:
1. EMERGENCY (Resuscitation) - Life-threatening, requires immediate intervention
2. URGENT (Emergent) - Potentially life-threatening, should be seen within 15 minutes  
3. SEMI-URGENT (Less Urgent) - Could become serious, should be seen within 30 minutes
4. NON-URGENT (Less Urgent) - Conditions that are not expected to deteriorate, can wait 1-2 hours
5. SELF-CARE (Not Urgent) - May not require physician intervention, appropriate for clinic or self-care

Analyze the patient's symptoms and provide:
1. Triage Level (EMERGENCY/URGENT/SEMI-URGENT/NON-URGENT/SELF-CARE)
2. Urgency Score (1-10, where 10 is most urgent)
3. Reasoning (brief medical reasoning for the triage decision)
4. Recommended Action (specific next steps for the patient)
5. Full Analysis (detailed medical assessment considering all symptoms)
6. HPI Summary (French medical confirmation summary for patient)
7. Follow-up Questions (10 specific French medical questions based on the patient's condition)

For the HPI Summary, generate a natural French paragraph that starts with "Juste pour confirmer avec vous avant de continuer; vous êtes un(e) [gender] de [age] ans" and ends with "; Est-ce que ce résumé est exact ?". Use proper French medical terminology and translate all English terms to French.

For the Follow-up Questions, generate exactly 10 specific French medical questions that a doctor would ask based on the patient's symptoms and condition. Each question should be on a separate line, numbered 1-10.

Patient Information:`;

interface TriageRequest {
  patient_id: string;
  gender?: string;
  age?: number;
  chief_complaint: string;
  problem_start_date?: string;
  specific_trigger?: string;
  symptom_location?: string;
  symptom_description?: string;
  symptom_aggravators?: string;
  symptom_relievers?: string;
  severity: number;
  symptom_progression?: string;
  selected_symptoms: string[];
  treatments_attempted?: string;
  treatment_effectiveness?: string;
  chronic_conditions?: string;
  medication_allergies?: string;
  pregnancy_status?: string;
  additional_notes?: string;
}

// Format patient data for AI analysis
function formatPatientForTriage(data: TriageRequest): string {
  const symptoms =
    data.selected_symptoms.length > 0 ? data.selected_symptoms.join(", ") : "None specified";

  return `
Patient ID: ${data.patient_id}
Age: ${data.age || "Not specified"}
Gender: ${data.gender || "Not specified"}

CHIEF COMPLAINT: ${data.chief_complaint}

SYMPTOM DETAILS:
- Location: ${data.symptom_location || "Not specified"}
- Description: ${data.symptom_description || "Not specified"}
- Onset: ${data.problem_start_date || "Not specified"}
- Trigger: ${data.specific_trigger || "None identified"}
- Severity (0-10): ${data.severity}
- Progression: ${data.symptom_progression || "Not specified"}
- Aggravating factors: ${data.symptom_aggravators || "Not specified"}
- Relieving factors: ${data.symptom_relievers || "Not specified"}

ASSOCIATED SYMPTOMS: ${symptoms}

MEDICAL HISTORY:
- Chronic conditions: ${data.chronic_conditions || "None specified"}
- Medication allergies: ${data.medication_allergies || "None specified"}
- Pregnancy/Breastfeeding: ${data.pregnancy_status || "Not applicable"}

TREATMENTS TRIED:
- Attempted: ${data.treatments_attempted || "None specified"}
- Effectiveness: ${data.treatment_effectiveness || "Not specified"}

ADDITIONAL NOTES: ${data.additional_notes || "None"}
`;
}

// Parse AI response to extract structured triage information
function parseTriageResponse(response: string) {
  const lines = response.split("\n").filter((line) => line.trim());

  let triageLevel = "NON-URGENT";
  let urgencyScore = 5;
  let reasoning = "";
  let recommendedAction = "";
  let fullAnalysis = response;
  let hpiSummary = "";
  let followUpQuestions: string[] = [];

  // Extract triage level
  const triageLine = lines.find(
    (line) =>
      line.toLowerCase().includes("triage") &&
      (line.includes("EMERGENCY") || line.includes("URGENT") || line.includes("SELF-CARE"))
  );

  if (triageLine) {
    if (triageLine.includes("EMERGENCY")) triageLevel = "EMERGENCY";
    else if (triageLine.includes("URGENT") && !triageLine.includes("NON-URGENT"))
      triageLevel = "URGENT";
    else if (triageLine.includes("SEMI-URGENT")) triageLevel = "SEMI-URGENT";
    else if (triageLine.includes("NON-URGENT")) triageLevel = "NON-URGENT";
    else if (triageLine.includes("SELF-CARE")) triageLevel = "SELF-CARE";
  }

  // Extract urgency score
  const scoreLine = lines.find(
    (line) => line.toLowerCase().includes("urgency score") || line.includes("/10")
  );
  if (scoreLine) {
    const scoreMatch = scoreLine.match(/(\d+)(?:\/10)?/);
    if (scoreMatch) {
      urgencyScore = parseInt(scoreMatch[1]);
    }
  }

  // Extract reasoning
  const reasoningStart = lines.findIndex((line) => line.toLowerCase().includes("reasoning"));
  const actionStart = lines.findIndex((line) => line.toLowerCase().includes("recommended action"));

  if (reasoningStart !== -1) {
    const endIndex = actionStart !== -1 ? actionStart : reasoningStart + 3;
    reasoning = lines
      .slice(reasoningStart + 1, endIndex)
      .join("\n")
      .trim();
  }

  // Extract recommended action
  if (actionStart !== -1) {
    const analysisStart = lines.findIndex((line) => line.toLowerCase().includes("full analysis"));
    const endIndex = analysisStart !== -1 ? analysisStart : actionStart + 3;
    recommendedAction = lines
      .slice(actionStart + 1, endIndex)
      .join("\n")
      .trim();
  }

  // Extract HPI Summary
  const hpiStart = lines.findIndex((line) => line.toLowerCase().includes("hpi summary"));
  if (hpiStart !== -1) {
    const analysisStart = lines.findIndex((line) => line.toLowerCase().includes("full analysis"));
    const endIndex = analysisStart !== -1 ? analysisStart : hpiStart + 5;
    hpiSummary = lines
      .slice(hpiStart + 1, endIndex)
      .join(" ")
      .trim();
  }

  return {
    triage_level: triageLevel,
    urgency_score: urgencyScore,
    reasoning: reasoning || "Medical assessment completed based on provided symptoms.",
    recommended_action:
      recommendedAction || "Please consult with a healthcare provider for proper evaluation.",
    full_analysis: fullAnalysis,
    hpi_summary: hpiSummary || "Résumé de consultation généré par l'IA",
  };
}

// Simple rule-based fallback triage when AI service is unavailable
function ruleBasedTriage(data: TriageRequest) {
  const text = [
    data.chief_complaint,
    data.symptom_description,
    data.symptom_location,
    data.specific_trigger,
    (data.selected_symptoms || []).join(" "),
    data.additional_notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = Math.max(1, Math.min(10, Number(data.severity) || 5));
  let level: "EMERGENCY" | "URGENT" | "SEMI-URGENT" | "NON-URGENT" | "SELF-CARE" = "NON-URGENT";
  const redFlags = [
    "chest pain",
    "shortness of breath",
    "severe bleeding",
    "faint",
    "fainting",
    "stroke",
    "weakness on one side",
    "seizure",
    "confusion",
  ];

  const amberFlags = [
    "fever",
    "vomit",
    "vomiting",
    "severe",
    "pregnant",
    "bleeding",
    "abdominal pain",
    "palpitations",
    "worsening",
  ];

  // Escalate for elderly patients
  if ((data.age || 0) >= 75) score = Math.min(10, score + 2);

  // Escalate for key red flags
  if (redFlags.some((k) => text.includes(k))) score = Math.min(10, Math.max(score, 8));
  // Moderate escalation for amber flags
  if (amberFlags.some((k) => text.includes(k))) score = Math.max(score, 6);

  if (score >= 9) level = "EMERGENCY";
  else if (score >= 7) level = "URGENT";
  else if (score >= 5) level = "SEMI-URGENT";
  else if (score >= 3) level = "NON-URGENT";
  else level = "SELF-CARE";

  const reasoningParts = [
    `Severity reported: ${data.severity}/10`,
    data.age ? `Age considered: ${data.age}` : undefined,
    redFlags.some((k) => text.includes(k)) ? "Red flag symptoms detected" : undefined,
    amberFlags.some((k) => text.includes(k)) ? "Concerning symptoms noted" : undefined,
  ].filter(Boolean);

  const recommended =
    level === "EMERGENCY"
      ? "Call emergency services or go to the nearest emergency department immediately."
      : level === "URGENT"
        ? "Seek urgent medical care within 15 minutes (emergency clinic or urgent care)."
        : level === "SEMI-URGENT"
          ? "Arrange a medical evaluation within 30–60 minutes."
          : level === "NON-URGENT"
            ? "Schedule a primary care visit within 1–2 days."
            : "Self-care measures may be appropriate; monitor symptoms and seek care if worsening.";

  // AI should generate all content - no hardcoded fallbacks
  return {
    triage_level: level,
    urgency_score: score,
    reasoning: reasoningParts.join("; ") || "Rule-based triage assessment.",
    recommended_action: recommended,
    full_analysis: "AI service unavailable - please try again",
    hpi_summary: "AI service unavailable - please try again",
  };
}

// POST /api/ollama/triage - Process medical triage
router.post("/triage", async (req, res) => {
  try {
    const patientData: TriageRequest = req.body;
    
    // Get user ID from request (you may need to implement authentication middleware)
    // For now, we'll use a default user ID or get it from the request
    const userId = req.body.userId || 1; // Default to user 1, should be replaced with actual auth

    // Validate required fields
    if (!patientData.patient_id || !patientData.chief_complaint) {
      return res.status(400).json({
        error: "Missing required fields: patient_id and chief_complaint",
      });
    }

    // Format patient data for AI analysis
    const formattedPatient = formatPatientForTriage(patientData);
    const fullPrompt = TRIAGE_PROMPT + "\n\n" + formattedPatient;

    console.log("🏥 Processing triage for patient:", patientData.patient_id);

    let triageResult: ReturnType<typeof parseTriageResponse> | ReturnType<typeof ruleBasedTriage>;

    // Use user-specific AI client for triage analysis
    try {
      console.log("🤖 Using user-specific AI client for triage analysis");
      const aiClient = await createUserAIClient(userId);
      
      if (!aiClient) {
        throw new Error("No AI client available for user");
      }

      const systemPrompt = "You are an expert emergency medicine physician performing medical triage using the Canadian Triage and Acuity Scale (CTAS). Provide structured responses for triage level, urgency score, reasoning, recommended action, full analysis, HPI summary, and follow-up questions.";
      
      const aiResponse = await aiClient.generateCompletion([
        {
          role: "user",
          content: fullPrompt
        }
      ], systemPrompt);

      if (aiResponse.trim().length > 0) {
        console.log(`🤖 ${aiClient.provider} response received:`, aiResponse.substring(0, 160) + "…");
        triageResult = parseTriageResponse(aiResponse);
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (err: any) {
      console.warn("⚠️ AI client failed:", err?.message || err);
      console.warn("⚠️ Using rule-based triage fallback.");
      triageResult = ruleBasedTriage(patientData);
    }

    console.log("✅ Triage completed:", {
      patient: patientData.patient_id,
      level: triageResult.triage_level,
      score: triageResult.urgency_score,
    });

    // Return structured triage results
    res.json(triageResult);
  } catch (error: any) {
    console.error("❌ Triage processing error:", error.message);

    res.status(500).json({
      error: "Triage processing failed",
      message: "An error occurred during medical triage analysis",
    });
  }
});

// GET /api/ollama/status - Check AI API status for user
router.get("/status", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string) || 1; // Default to user 1
    
    const aiClient = await createUserAIClient(userId);
    
    if (!aiClient) {
      return res.status(200).json({ 
        status: "offline", 
        error: "No AI configuration found for user"
      });
    }

    // Test the AI client with a simple request
    await aiClient.generateCompletion([
      { role: "user", content: "test" }
    ], "You are a helpful assistant. Respond with 'OK' to confirm the connection.");
    
    return res.json({
      status: "online",
      provider: aiClient.provider,
      model: aiClient.model,
    });
  } catch (error: any) {
    return res.status(200).json({ 
      status: "offline", 
      error: error?.message || "API unavailable"
    });
  }
});

export default router;
