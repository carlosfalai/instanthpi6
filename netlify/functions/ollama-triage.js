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

// Generate symptom-specific questions based on patient data
function generateSymptomSpecificQuestions(data) {
  const complaint = (data.chief_complaint || '').toLowerCase();
  const symptoms = (data.symptom_description || '').toLowerCase();
  const location = (data.symptom_location || '').toLowerCase();
  
  // Base questions that apply to most cases
  const baseQuestions = [
    "Avez-vous de la fièvre?",
    "Vos symptômes vous réveillent-ils la nuit?",
    "Avez-vous perdu l'appétit?",
    "Avez-vous des nausées ou des vomissements?",
    "Prenez-vous des médicaments actuellement?",
    "Avez-vous des antécédents familiaux pertinents?",
    "Vos symptômes s'aggravent-ils avec le mouvement?",
    "Avez-vous d'autres préoccupations médicales?"
  ];
  
  // Symptom-specific questions
  let specificQuestions = [];
  
  if (complaint.includes('chest') || complaint.includes('thoracique') || complaint.includes('cœur')) {
    specificQuestions = [
      "Avez-vous des difficultés respiratoires?",
      "La douleur irradie-t-elle vers le bras gauche?",
      "Avez-vous des palpitations?",
      "Avez-vous des sueurs froides?",
      "La douleur s'aggrave-t-elle avec l'effort?",
      "Avez-vous des antécédents de problèmes cardiaques?",
      "Prenez-vous des médicaments pour le cœur?",
      "Avez-vous des facteurs de risque cardiovasculaire?"
    ];
  } else if (complaint.includes('abdominal') || complaint.includes('ventre') || complaint.includes('estomac')) {
    specificQuestions = [
      "Avez-vous des nausées ou des vomissements?",
      "Avez-vous de la diarrhée ou de la constipation?",
      "La douleur est-elle constante ou intermittente?",
      "Avez-vous des ballonnements?",
      "Avez-vous des antécédents de problèmes digestifs?",
      "Avez-vous mangé quelque chose d'inhabituel récemment?",
      "La douleur s'améliore-t-elle avec la défécation?",
      "Avez-vous des saignements rectaux?"
    ];
  } else if (complaint.includes('head') || complaint.includes('tête') || complaint.includes('céphalée')) {
    specificQuestions = [
      "Avez-vous des troubles visuels?",
      "Avez-vous des nausées ou des vomissements?",
      "La douleur est-elle pulsatile?",
      "Avez-vous des antécédents de migraines?",
      "La douleur s'aggrave-t-elle avec la lumière?",
      "Avez-vous des troubles de l'équilibre?",
      "Avez-vous des troubles de la parole?",
      "Avez-vous des antécédents de traumatisme crânien?"
    ];
  } else {
    // Generic questions for other symptoms
    specificQuestions = [
      "Avez-vous des difficultés respiratoires?",
      "Avez-vous de la fièvre?",
      "La douleur s'aggrave-t-elle avec le mouvement?",
      "Avez-vous des antécédents de ce type de problème?",
      "Avez-vous des allergies connues?",
      "Prenez-vous des médicaments régulièrement?",
      "Avez-vous des antécédents familiaux de problèmes similaires?",
      "Y a-t-il eu un événement déclencheur récent?"
    ];
  }
  
  // Combine and return 10 questions
  return [...specificQuestions.slice(0, 8), ...baseQuestions.slice(0, 2)].slice(0, 10);
}

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

  // Generate HPI Summary using the exact template format provided
  const genderText = data.gender === 'Male' ? 'homme' : data.gender === 'Female' ? 'femme' : 'patient';
  const ageText = data.age ? `${data.age} ans` : 'âge non spécifié';
  
  // Translate English medical terms to French
  const translateToFrench = (text) => {
    if (!text) return '';
    return text
      .replace(/severe abdominal pain/gi, 'douleur abdominale sévère')
      .replace(/sharp, cramping pain/gi, 'douleur aiguë et crampes')
      .replace(/right lower abdomen/gi, 'abdomen inférieur droit')
      .replace(/chest pain/gi, 'douleur thoracique')
      .replace(/shortness of breath/gi, 'difficulté respiratoire')
      .replace(/nausea/gi, 'nausées')
      .replace(/vomiting/gi, 'vomissements')
      .replace(/fever/gi, 'fièvre')
      .replace(/headache/gi, 'mal de tête')
      .replace(/dizziness/gi, 'étourdissements')
      .replace(/fatigue/gi, 'fatigue')
      .replace(/weakness/gi, 'faiblesse')
      .replace(/numbness/gi, 'engourdissement')
      .replace(/tingling/gi, 'picotements')
      .replace(/swelling/gi, 'gonflement')
      .replace(/bleeding/gi, 'saignement')
      .replace(/bruising/gi, 'ecchymoses')
      .replace(/rash/gi, 'éruption cutanée')
      .replace(/itching/gi, 'démangeaisons')
      .replace(/burning/gi, 'sensation de brûlure')
      .replace(/stabbing/gi, 'douleur lancinante')
      .replace(/throbbing/gi, 'douleur pulsatile')
      .replace(/dull/gi, 'douleur sourde')
      .replace(/constant/gi, 'constante')
      .replace(/intermittent/gi, 'intermittente')
      .replace(/comes and goes/gi, 'va et vient')
      .replace(/getting worse/gi, 's\'aggrave')
      .replace(/getting better/gi, 's\'améliore')
      .replace(/none/gi, 'aucun')
      .replace(/none known/gi, 'aucune connue')
      .replace(/not applicable/gi, 'non applicable')
      .replace(/not pregnant/gi, 'pas enceinte')
      .replace(/pregnant/gi, 'enceinte')
      .replace(/breastfeeding/gi, 'allaitement');
  };

  const hpiSummary = `Juste pour confirmer avec vous avant de continuer; vous êtes ${genderText === 'patient' ? 'un patient' : genderText} de ${ageText} qui présente ${translateToFrench(data.chief_complaint)}. ${data.symptom_description ? `Vous décrivez ${translateToFrench(data.symptom_description)}. ` : ''}${data.symptom_location ? `La douleur est localisée ${translateToFrench(data.symptom_location)}. ` : ''}${data.severity ? `Vous évaluez l'intensité à ${data.severity}/10. ` : ''}${data.chronic_conditions ? `Vous mentionnez des antécédents de ${translateToFrench(data.chronic_conditions)}. ` : ''}${data.medication_allergies ? `Vous avez des allergies médicamenteuses: ${translateToFrench(data.medication_allergies)}. ` : ''}Est-ce que ce résumé est exact ?`;

  // Generate 10 follow-up questions based on symptoms (FALLBACK ONLY - AI should generate these)
  const followUpQuestions = generateSymptomSpecificQuestions(data);

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
