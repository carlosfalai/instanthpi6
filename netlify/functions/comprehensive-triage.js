const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const COMPREHENSIVE_TRIAGE_PROMPT = `You are an expert emergency medicine physician performing comprehensive medical triage and documentation. Based on the patient information provided, generate a complete medical report with all 12 sections.

Use the Canadian Triage and Acuity Scale (CTAS) levels:
1. EMERGENCY (Resuscitation) - Life-threatening, requires immediate intervention
2. URGENT (Emergent) - Potentially life-threatening, should be seen within 15 minutes
3. SEMI-URGENT (Less Urgent) - Could become serious, should be seen within 30 minutes
4. NON-URGENT (Less Urgent) - Conditions that are not expected to deteriorate, can wait 1-2 hours
5. SELF-CARE (Not Urgent) - May not require physician intervention, appropriate for clinic or self-care

CRITICAL: Generate ALL 12 comprehensive medical sections in French:

1. HPI_SUMMARY: "Juste pour confirmer avec vous avant de continuer; vous êtes [gender] de [age] qui présente [chief_complaint]. [detailed_symptoms]. [location]. [severity]. [chronic_conditions]. [medication_allergies]. Est-ce que ce résumé est exact ?"

2. FOLLOW_UP_QUESTIONS: 10 specific questions based on patient's actual symptoms

3. SAP_NOTE: Super Spartan SAP format with S: (Subjective), A: (Assessment), P: (Plan)

4. MEDICATIONS: Array of specific medications with dosages, quantities, and instructions

5. LAB_WORK: List of specific lab tests needed

6. IMAGING: Array of imaging studies with indications and timing

7. REFERRALS: Array of specialist referrals with specific indications and timing

8. WORK_LEAVE: Work leave certificate with dates and duration

9. WORKPLACE_MODIFICATIONS: Specific workplace restrictions and accommodations

10. INSURANCE_DOCUMENTATION: Complete insurance documentation with ICD codes

11. TELEMEDICINE_LIMITATIONS: Explanation of telemedicine limitations and need for in-person evaluation

12. EMERGENCY_REFERRAL: Emergency department referral with triage level

Return JSON with these exact fields:
- triage_level: (EMERGENCY/URGENT/SEMI-URGENT/NON-URGENT/SELF-CARE)
- urgency_score: (1-10)
- reasoning: (brief medical reasoning)
- recommended_action: (specific next steps)
- hpi_summary: (EXACT French template format above)
- follow_up_questions: (array of 10 specific questions)
- sap_note: (Super Spartan SAP format)
- medications: (array of medication objects with name, dosage, quantity, instructions)
- lab_work: (array of lab tests)
- imaging: (array of imaging objects with name, indication, timing)
- referrals: (array of referral objects with specialty, indication, timing)
- work_leave: (work leave certificate text)
- workplace_modifications: (workplace restrictions text)
- insurance_documentation: (insurance documentation text)
- telemedicine_limitations: (telemedicine limitations text)
- emergency_referral: (emergency referral text)

Patient Information:`;

exports.handler = async (event) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const patientData = JSON.parse(event.body);
    console.log('Processing comprehensive triage for patient:', patientData.patient_id);

    let aiResponse = null;

    // Try OpenAI first
    try {
      const openaiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: COMPREHENSIVE_TRIAGE_PROMPT
          },
          {
            role: "user",
            content: `Patient Information: ${JSON.stringify(patientData)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });

      aiResponse = openaiResponse.choices[0].message.content;
      console.log("OpenAI response received");
      console.log("OpenAI Full Response:", JSON.stringify(openaiResponse, null, 2));
    } catch (openaiError) {
      console.log("OpenAI failed:", openaiError.message);
      
      // Try Anthropic as fallback
      try {
        const anthropicResponse = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4000,
          temperature: 0.3,
          messages: [
            {
              role: "user",
              content: `${COMPREHENSIVE_TRIAGE_PROMPT}\n\nPatient Information: ${JSON.stringify(patientData)}`
            }
          ]
        });

        aiResponse = anthropicResponse.content[0].text;
        console.log("Anthropic response received");
      } catch (anthropicError) {
        console.log("Anthropic failed:", anthropicError.message);
      }
    }

    // If AI worked, try to parse it
    if (aiResponse) {
      try {
        const parsed = JSON.parse(aiResponse);
        console.log("AI generated comprehensive response:", parsed);
        return {
          statusCode: 200,
          headers,
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
              headers,
              body: JSON.stringify(extracted),
            };
          } catch (extractError) {
            console.log("Failed to extract JSON, using fallback");
          }
        }
      }
    }

    // Fallback to basic triage if AI fails
    console.log("AI failed, using basic fallback");
    const fallback = {
      triage_level: "SEMI-URGENT",
      urgency_score: 5,
      reasoning: "AI service unavailable",
      recommended_action: "Consultation médicale recommandée",
      hpi_summary: `Juste pour confirmer avec vous avant de continuer; vous êtes ${patientData.gender === 'Male' ? 'un homme' : patientData.gender === 'Female' ? 'une femme' : 'un patient'} de ${patientData.age || 'âge non spécifié'} ans qui présente ${patientData.chief_complaint || 'symptômes'}. ${patientData.symptom_description ? `Vous décrivez ${patientData.symptom_description}. ` : ''}${patientData.symptom_location ? `La douleur est localisée ${patientData.symptom_location}. ` : ''}${patientData.severity ? `Vous évaluez l'intensité à ${patientData.severity}/10. ` : ''}Est-ce que ce résumé est exact ?`,
      follow_up_questions: [
        "Avez-vous de la fièvre?",
        "Vos symptômes vous réveillent-ils la nuit?",
        "Avez-vous perdu l'appétit?",
        "Avez-vous des nausées ou des vomissements?",
        "Prenez-vous des médicaments actuellement?",
        "Avez-vous des antécédents familiaux pertinents?",
        "Vos symptômes s'aggravent-ils avec le mouvement?",
        "Avez-vous d'autres préoccupations médicales?",
        "Avez-vous des allergies connues?",
        "Y a-t-il eu un événement déclencheur récent?"
      ],
      sap_note: "S: Patient avec symptômes nécessitant évaluation. A: Évaluation médicale requise. P: Consultation médicale recommandée.",
      medications: [],
      lab_work: [],
      imaging: [],
      referrals: [],
      work_leave: "Évaluation médicale requise pour déterminer l'arrêt de travail.",
      workplace_modifications: "À déterminer après évaluation médicale.",
      insurance_documentation: "Diagnostic à confirmer après évaluation médicale.",
      telemedicine_limitations: "Cette consultation présente des limites et nécessite une évaluation en personne.",
      emergency_referral: "Évaluation médicale recommandée selon l'urgence des symptômes."
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallback),
    };

  } catch (error) {
    console.error('Error in comprehensive triage:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
