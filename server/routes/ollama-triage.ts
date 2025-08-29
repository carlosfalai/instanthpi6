import { Router } from "express";
import axios from "axios";

const router = Router();

// Ollama server configuration
// Build a list of candidate endpoints to try in order of preference
function getOllamaCandidates() {
  const fromEnv = process.env.OLLAMA_URL ? [process.env.OLLAMA_URL] : [];
  // Prefer env, then localhost (developer laptop), then Cloudflare tunnel
  return [...fromEnv, "http://localhost:11434", "https://ollama.instanthpi.ca"];
}
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

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

  return {
    triage_level: triageLevel,
    urgency_score: urgencyScore,
    reasoning: reasoning || "Medical assessment completed based on provided symptoms.",
    recommended_action:
      recommendedAction || "Please consult with a healthcare provider for proper evaluation.",
    full_analysis: fullAnalysis,
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

  return {
    triage_level: level,
    urgency_score: score,
    reasoning: reasoningParts.join("; ") || "Rule-based triage assessment.",
    recommended_action: recommended,
    full_analysis:
      "AI service unavailable; provided rule-based triage using CTAS-inspired thresholds based on symptoms and severity.",
  };
}

// POST /api/ollama/triage - Process medical triage
router.post("/triage", async (req, res) => {
  try {
    const patientData: TriageRequest = req.body;

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

    // Try multiple candidates in order
    const candidates = getOllamaCandidates();
    let aiSucceeded = false;
    for (const base of candidates) {
      try {
        console.log("🤖 Trying Ollama:", base);
        const ollamaResponse = await axios.post(
          `${base}/api/generate`,
          {
            model: OLLAMA_MODEL,
            prompt: fullPrompt,
            stream: false,
            options: {
              temperature: 0.1,
              top_p: 0.9,
              max_tokens: 1000,
            },
          },
          {
            timeout: 30000,
            headers: { "Content-Type": "application/json" },
          }
        );
        const aiResponse =
          ollamaResponse.data?.response || ollamaResponse.data?.message?.content || "";
        if (typeof aiResponse === "string" && aiResponse.trim().length > 0) {
          console.log("🤖 Ollama response received:", aiResponse.substring(0, 160) + "…");
          triageResult = parseTriageResponse(aiResponse);
          aiSucceeded = true;
          break;
        }
      } catch (err: any) {
        console.warn(`⚠️ Ollama at ${base} failed:`, err?.message || err);
        continue;
      }
    }

    if (!aiSucceeded) {
      console.warn("⚠️ All Ollama endpoints failed. Using rule-based triage.");
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

// GET /api/ollama/status - Check Ollama server status
router.get("/status", async (_req, res) => {
  const candidates = getOllamaCandidates();
  for (const base of candidates) {
    try {
      const response = await axios.get(`${base}/api/tags`, { timeout: 5000 });
      const models = response.data.models || [];
      return res.json({
        status: "online",
        url: base,
        available_models: models.map((m: any) => m.name),
        current_model: OLLAMA_MODEL,
        model_available: models.some((m: any) => m.name === OLLAMA_MODEL),
      });
    } catch (e) {
      continue;
    }
  }
  return res.status(200).json({ status: "offline", url: candidates[candidates.length - 1] });
});

export default router;
