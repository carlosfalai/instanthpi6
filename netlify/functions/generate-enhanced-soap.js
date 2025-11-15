// Enhanced SOAP note generation - no database dependency needed
const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { patient_id, hpi_summary, patient_answers, triage_result } = JSON.parse(event.body || "{}");

    if (!patient_id || !hpi_summary || !patient_answers) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }

    // Generate enhanced SOAP note
    const enhancedSoapNote = generateEnhancedSoapNote(hpi_summary, patient_answers, triage_result);
    
    // Generate doctor HPI summary with patient clarifications
    const doctorHpiSummary = generateDoctorHpiSummary(hpi_summary, patient_answers);

    // Generate Stepwise Strategy by analyzing the Enhanced SOAP note
    const stepwiseStrategy = await generateStepwiseStrategy(enhancedSoapNote, doctorHpiSummary);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enhanced_soap_note: enhancedSoapNote,
        doctor_hpi_summary: doctorHpiSummary,
        stepwise_strategy: stepwiseStrategy
      })
    };

  } catch (error) {
    console.error('Error generating enhanced SOAP note:', error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};

function generateEnhancedSoapNote(hpiSummary, patientAnswers, triageResult) {
  const answersText = Object.entries(patientAnswers)
    .map(([index, answer]) => `Q${parseInt(index) + 1}: ${answer}`)
    .join('\n');

  return `RAPPORT MÉDICAL COMPLET - PATIENT ID: ${triageResult?.patient_id || 'N/A'}

=== HISTOIRE DE LA MALADIE ACTUELLE (HMA) ===
${hpiSummary}

=== CLARIFICATIONS DU PATIENT ===
${answersText}

=== ÉVALUATION DE TRIAGE ===
Niveau de priorité: ${triageResult?.triage_level || 'N/A'}
Score d'urgence: ${triageResult?.urgency_score || 'N/A'}/10
Raisonnement: ${triageResult?.reasoning || 'N/A'}
Action recommandée: ${triageResult?.recommended_action || 'N/A'}

=== PLAN DE SOINS PROPOSÉ ===
1. Évaluation médicale immédiate requise
2. Investigations complémentaires selon l'évaluation
3. Suivi médical approprié selon le niveau de triage
4. Éducation du patient sur les signes d'alarme

=== RECOMMANDATIONS POUR LE MÉDECIN ===
- Vérifier les signes vitaux
- Évaluer la douleur selon l'échelle numérique
- Considérer les antécédents médicaux mentionnés
- Planifier le suivi selon la priorité établie

=== INFORMATIONS DE CONTACT ===
Patient ID: ${triageResult?.patient_id || 'N/A'}
Date de génération: ${new Date().toLocaleDateString('fr-CA')}
Système InstantHPI - Rapport généré automatiquement`;
}

function generateDoctorHpiSummary(hpiSummary, patientAnswers) {
  const clarifications = Object.entries(patientAnswers)
    .filter(([_, answer]) => answer && answer.trim())
    .map(([index, answer]) => `Clarification ${parseInt(index) + 1}: ${answer}`)
    .join(' ');

  return `${hpiSummary} ${clarifications ? `Clarifications supplémentaires: ${clarifications}` : ''}`;
}

async function generateStepwiseStrategy(enhancedSoapNote, doctorHpiSummary) {
  const STEPWISE_STRATEGY_PROMPT = `You are an expert emergency medicine physician. Analyze the following Enhanced SOAP note that combines HPI summary and patient Q&A answers, then generate a Stepwise Strategy discussion in Spartan Format.

CRITICAL: Base your analysis ONLY on the Enhanced SOAP note provided below. Do not use generic templates - analyze the actual clinical presentation from the Enhanced SOAP note.

Enhanced SOAP Note to Analyze:
${enhancedSoapNote}

Doctor HPI Summary:
${doctorHpiSummary}

Generate a Stepwise Strategy with these exact 6 subsections in French:

1. Symptoms
Summarize the key symptoms and clinical presentation from the Enhanced SOAP note above.

2. Physical Red Flags
List concerning physical examination findings or red flags that raise suspicion for serious conditions, based on the symptoms and clarifications mentioned in the Enhanced SOAP note.

3. Labs
Specify lab tests to order with rationale based on the symptoms and clinical presentation in the Enhanced SOAP note. Format: "Order to rule out [condition]: CBC, CRP, ESR, etc."

4. Imaging
Specify imaging studies needed with indications and timing based on the Enhanced SOAP note. Format: "If X-rays inconclusive → Ultrasound or MRI"

5. Treatment
Provide a stepwise treatment approach including medications, activity modifications, referrals, and conservative care timeline based on the patient's condition as described in the Enhanced SOAP note.

6. Follow-Up
Specify monitoring schedule and follow-up timing with specific conditions for earlier return, based on the triage level and clinical presentation in the Enhanced SOAP note.

Format as structured text:
"1. Symptoms
[relevant symptoms summary from Enhanced SOAP note]

2. Physical Red Flags
[concerning findings based on Enhanced SOAP note]

3. Labs
[lab tests with rationale based on Enhanced SOAP note]

4. Imaging
[imaging studies with indications based on Enhanced SOAP note]

5. Treatment
[treatment plan based on Enhanced SOAP note]

6. Follow-Up
[follow-up schedule based on Enhanced SOAP note]"

Return ONLY the formatted text, no code or markdown.`;

  try {
    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert emergency medicine physician."
            },
            {
              role: "user",
              content: STEPWISE_STRATEGY_PROMPT
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        });

        return openaiResponse.choices[0].message.content.trim();
      } catch (openaiError) {
        console.log("OpenAI failed for stepwise strategy:", openaiError.message);
        
        // Try Anthropic as fallback
        if (process.env.ANTHROPIC_API_KEY) {
          try {
            const anthropicResponse = await anthropic.messages.create({
              model: "claude-3-5-haiku-20241022",
              max_tokens: 2000,
              temperature: 0.3,
              messages: [
                {
                  role: "user",
                  content: STEPWISE_STRATEGY_PROMPT
                }
              ]
            });

            return anthropicResponse.content[0].text.trim();
          } catch (anthropicError) {
            console.log("Anthropic failed for stepwise strategy:", anthropicError.message);
          }
        }
      }
    }

    // Fallback if AI fails
    return `1. Symptoms\nAnalysez les symptômes décrits dans le rapport SOAP amélioré ci-dessus.\n\n2. Physical Red Flags\nIdentifiez les signes d'alarme basés sur les symptômes rapportés.\n\n3. Labs\nTests de laboratoire indiqués selon la présentation clinique.\n\n4. Imaging\nÉtudes d'imagerie nécessaires selon les symptômes.\n\n5. Treatment\nPlan de traitement basé sur l'évaluation clinique.\n\n6. Follow-Up\nSuivi recommandé selon le niveau de triage et la condition.`;
  } catch (error) {
    console.error('Error generating stepwise strategy:', error);
    return `1. Symptoms\nAnalysez les symptômes du rapport SOAP amélioré.\n\n2. Physical Red Flags\nSignes d'alarme à surveiller.\n\n3. Labs\nTests de laboratoire indiqués.\n\n4. Imaging\nÉtudes d'imagerie nécessaires.\n\n5. Treatment\nPlan de traitement.\n\n6. Follow-Up\nSuivi recommandé.`;
  }
}
