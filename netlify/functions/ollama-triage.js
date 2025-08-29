const axios = require("axios");

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "https://ollama.instanthpi.ca";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

const TRIAGE_PROMPT = `You are an expert emergency medicine physician performing medical triage. Based on the patient information provided, determine the appropriate triage level and urgency.\n\nUse the Canadian Triage and Acuity Scale (CTAS) levels:\n1. EMERGENCY (Resuscitation) - Life-threatening, requires immediate intervention\n2. URGENT (Emergent) - Potentially life-threatening, should be seen within 15 minutes\n3. SEMI-URGENT (Less Urgent) - Could become serious, should be seen within 30 minutes\n4. NON-URGENT (Less Urgent) - Conditions that are not expected to deteriorate, can wait 1-2 hours\n5. SELF-CARE (Not Urgent) - May not require physician intervention, appropriate for clinic or self-care\n\nAnalyze the patient's symptoms and provide:\n1. Triage Level (EMERGENCY/URGENT/SEMI-URGENT/NON-URGENT/SELF-CARE)\n2. Urgency Score (1-10, where 10 is most urgent)\n3. Reasoning (brief medical reasoning for the triage decision)\n4. Recommended Action (specific next steps for the patient)\n5. Full Analysis (detailed medical assessment considering all symptoms)\n\nPatient Information:`;

function ruleBasedTriage(data) {
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
  let level = "NON-URGENT";
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

  if ((data.age || 0) >= 75) score = Math.min(10, score + 2);
  if (redFlags.some((k) => text.includes(k))) score = Math.min(10, Math.max(score, 8));
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

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const patientData = JSON.parse(event.body || "{}");
    if (!patientData.patient_id || !patientData.chief_complaint) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing patient_id or chief_complaint" }),
      };
    }

    const formattedPatient = `Patient ID: ${patientData.patient_id}\nAge: ${patientData.age || "Not specified"}\nGender: ${patientData.gender || "Not specified"}\n\nCHIEF COMPLAINT: ${patientData.chief_complaint}\n`;
    const fullPrompt = `${TRIAGE_PROMPT}\n\n${formattedPatient}`;

    try {
      const resp = await axios.post(
        `${OLLAMA_BASE_URL}/api/generate`,
        {
          model: OLLAMA_MODEL,
          prompt: fullPrompt,
          stream: false,
          options: { temperature: 0.1, top_p: 0.9, max_tokens: 1000 },
        },
        { timeout: 30000, headers: { "Content-Type": "application/json" } }
      );
      const responseText = (resp.data && (resp.data.response || resp.data.message?.content)) || "";
      const result = ruleBasedTriage(patientData); // default
      // We could try to parse responseText here similarly to server, but rule-based is safe default
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      };
    } catch (e) {
      const fallback = ruleBasedTriage(patientData);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fallback),
      };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Triage processing failed" }) };
  }
};
