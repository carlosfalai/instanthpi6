// Real AI API integration - no more fake Ollama
const { OpenAI } = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TRIAGE_PROMPT = `You are an expert emergency medicine physician performing medical triage. Based on the patient information provided, determine the appropriate triage level and urgency.

Use the Canadian Triage and Acuity Scale (CTAS) levels:
1. EMERGENCY (Resuscitation) - Life-threatening, requires immediate intervention
2. URGENT (Emergent) - Potentially life-threatening, should be seen within 15 minutes
3. SEMI-URGENT (Less Urgent) - Could become serious, should be seen within 30 minutes
4. NON-URGENT (Less Urgent) - Conditions that are not expected to deteriorate, can wait 1-2 hours
5. SELF-CARE (Not Urgent) - May not require physician intervention, appropriate for clinic or self-care

CRITICAL: You must generate the EXACT French template format for the HPI summary:

Template: "Juste pour confirmer avec vous avant de continuer; vous êtes [gender] de [age] qui présente [chief_complaint]. [symptom_description]. [symptom_location]. [severity]. [chronic_conditions]. [medication_allergies]. Est-ce que ce résumé est exact ?"

You must also generate 10 SPECIFIC follow-up questions based on the patient's actual symptoms, not generic questions.

Return JSON with these exact fields:
- triage_level: (EMERGENCY/URGENT/SEMI-URGENT/NON-URGENT/SELF-CARE)
- urgency_score: (1-10)
- reasoning: (brief medical reasoning)
- recommended_action: (specific next steps)
- hpi_summary: (EXACT French template format above)
- follow_up_questions: (array of 10 specific questions based on symptoms)

Patient Information:`;

// AI should generate all questions - no hardcoded fallbacks

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

  // AI should generate all content - no hardcoded fallbacks
  const hpiSummary = "AI service unavailable - please try again";
  const followUpQuestions = ["AI service unavailable - please try again"];

  return {
    triage_level: level,
    urgency_score: score,
    reasoning: reasoningParts.join("; ") || "Rule-based triage assessment.",
    recommended_action: recommended,
    full_analysis:
      "AI service unavailable; provided rule-based triage using CTAS-inspired thresholds based on symptoms and severity.",
    hpi_summary: hpiSummary,
    follow_up_questions: followUpQuestions,
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
      // Try OpenAI first, then Anthropic, then fallback to rules
      let aiResponse = null;
      
      try {
        const openaiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert emergency medicine physician. Analyze patient data and provide triage assessment in JSON format with: triage_level, urgency_score, reasoning, recommended_action, hpi_summary, follow_up_questions"
            },
            {
              role: "user", 
              content: fullPrompt
            }
          ],
          temperature: 0.1,
          max_tokens: 1000
        });
        aiResponse = openaiResponse.choices[0].message.content;
      } catch (openaiError) {
        console.log("OpenAI failed, trying Anthropic:", openaiError.message);
        
        try {
          const anthropicResponse = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            messages: [
              {
                role: "user",
                content: fullPrompt
              }
            ]
          });
          aiResponse = anthropicResponse.content[0].text;
        } catch (anthropicError) {
          console.log("Anthropic failed:", anthropicError.message);
        }
      }
      
      // If AI worked, try to parse it, otherwise use rule-based
      if (aiResponse) {
        try {
          const parsed = JSON.parse(aiResponse);
          console.log("AI generated response:", parsed);
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed),
          };
        } catch (parseError) {
          console.log("AI response not JSON, trying to extract content:", aiResponse);
          // Try to extract JSON from the response if it's wrapped in markdown
          const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const extracted = JSON.parse(jsonMatch[1] || jsonMatch[0]);
              console.log("Extracted AI response:", extracted);
              return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(extracted),
              };
            } catch (extractError) {
              console.log("Failed to extract JSON, using rule-based");
            }
          }
        }
      }
      
      // Fallback to rule-based
      console.log("Using rule-based fallback");
      const result = ruleBasedTriage(patientData);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      };
    } catch (e) {
      console.log("All AI failed, using rule-based:", e.message);
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
