const axios = require("axios");

// AI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { patientId, variables, customRequest } = JSON.parse(event.body);

    if (!patientId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Patient ID is required" }),
      };
    }

    console.log(`Processing medical transcription for patient: ${patientId}`);

    // First, get the enhanced HPI summary from triage process
    let enhancedHpiSummary = "";
    try {
      const triageResponse = await fetch(`${process.env.NETLIFY_URL || 'https://instanthpi.ca'}/api/triage-enhanced-output`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, variables })
      });
      
      if (triageResponse.ok) {
        const triageData = await triageResponse.json();
        enhancedHpiSummary = triageData.enhancedHpiSummary || "";
      }
    } catch (error) {
      console.warn('Could not get enhanced HPI from triage, using original data');
    }

    // Try to fetch Enhanced SOAP note (HPI + Q&A) if available
    let enhancedSoapNote = "";
    let doctorHpiSummary = "";
    try {
      // Check if patient_answers exist in variables (from patient form submission)
      if (variables.patient_answers && variables.hpi_summary) {
        const enhancedSoapResponse = await fetch(`${process.env.NETLIFY_URL || 'https://instanthpi.ca'}/api/generate-enhanced-soap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patientId,
            hpi_summary: variables.hpi_summary,
            patient_answers: variables.patient_answers,
            triage_result: variables.triage_result || {}
          })
        });
        
        if (enhancedSoapResponse.ok) {
          const enhancedSoapData = await enhancedSoapResponse.json();
          enhancedSoapNote = enhancedSoapData.enhanced_soap_note || "";
          doctorHpiSummary = enhancedSoapData.doctor_hpi_summary || "";
        }
      }
    } catch (error) {
      console.warn('Could not fetch Enhanced SOAP note, Stepwise Strategy will use available data');
    }

    // Detect case type from patient data
    const detectCaseType = (vars) => {
      const allText = `${vars.ChiefComplaint || ''} ${vars.Description || ''} ${vars.AssociatedSymptoms || ''}`.toLowerCase();
      if (allText.includes('vomissement') || allText.includes('diarrhée') || allText.includes('gastro')) return 'gastroenteritis';
      if (allText.includes('toux') || allText.includes('cough')) return 'cough';
      if (allText.includes('cystite') || allText.includes('dysurie')) return 'cystitis';
      if (allText.includes('itss') || allText.includes('dépistage')) return 'sti_screening';
      if (allText.includes('anxiété') || allText.includes('dépression')) return 'mental_health';
      if (allText.includes('urgence') || allText.includes('douleur thoracique')) return 'emergency';
      if (allText.includes('douleur abdominale') || allText.includes('biliaire')) return 'abdominal_pain';
      if (allText.includes('tendon') || allText.includes('achille')) return 'orthopedic';
      if (allText.includes('classe') || allText.includes('license')) return 'license_assessment';
      return null;
    };

    const caseType = detectCaseType(variables);

    // Fetch doctor's enabled templates for this case type
    let enabledTemplates = {};
    try {
      // Get physician_id from variables or use default
      const physicianId = variables.physician_id || variables.userId;
      if (physicianId) {
        const templatesResponse = await fetch(
          `${process.env.NETLIFY_URL || 'https://instanthpi.ca'}/api/medical-templates/${physicianId}?case_type=${caseType || ''}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          // Organize templates by category
          templatesData.templates?.forEach(template => {
            if (!enabledTemplates[template.template_category]) {
              enabledTemplates[template.template_category] = [];
            }
            enabledTemplates[template.template_category].push(template);
          });
        }
      }
    } catch (error) {
      console.warn('Could not fetch templates, using defaults');
    }

    // Build the prompt for medical transcription using actual patient data
    let prompt = `You are a medical AI assistant. Generate a comprehensive French medical transcription based on the ACTUAL PATIENT DATA provided below. Use the patient's specific symptoms, history, and responses to create personalized medical documentation.

PATIENT DATA TO ANALYZE:
Patient ID: ${patientId}
Gender: ${variables.Gender || "Non spécifié"}
Age: ${variables.Age || "Non spécifié"}
Chief Complaint: ${variables.ChiefComplaint || "Non spécifié"}
Symptom Onset: ${variables.SymptomOnset || "Non spécifié"}
Trigger: ${variables.Trigger || "Non spécifié"}
Location: ${variables.Location || "Non spécifié"}
Description: ${variables.Description || "Non spécifié"}
Aggravating Factors: ${variables.AggravatingFactors || "Non spécifié"}
Relieving Factors: ${variables.RelievingFactors || "Non spécifié"}
Severity: ${variables.Severity || "Non spécifié"}
Evolution: ${variables.Evolution || "Non spécifié"}
Associated Symptoms: ${variables.AssociatedSymptoms || "Non spécifié"}
Treatments Tried: ${variables.TreatmentsTried || "Non spécifié"}
Treatment Response: ${variables.TreatmentResponse || "Non spécifié"}
Chronic Conditions: ${variables.ChronicConditions || "Non spécifié"}
Medication Allergies: ${variables.MedicationAllergies || "Non spécifié"}
Pregnancy/Breastfeeding: ${variables.PregnancyBreastfeeding || "Non spécifié"}
Other Notes: ${variables.OtherNotes || "Non spécifié"}

${customRequest ? `\nCustom Request: ${customRequest}` : ""}

CRITICAL: Analyze the patient's ACTUAL symptoms and responses above to generate personalized medical sections. Base all recommendations on what the patient actually reported, not generic templates.

Return ONLY the content for each section, formatted as follows. Do NOT include any code, markdown, or formatting instructions:

HPI_CONFIRMATION_SUMMARY:
[Create a personalized HPI confirmation summary based on the patient's actual symptoms and history above]

FOLLOW_UP_QUESTIONS:
1. [Question 1 in French based on patient's specific symptoms]
2. [Question 2 in French based on patient's specific symptoms]
3. [Question 3 in French based on patient's specific symptoms]
4. [Question 4 in French based on patient's specific symptoms]
5. [Question 5 in French based on patient's specific symptoms]
6. [Question 6 in French based on patient's specific symptoms]
7. [Question 7 in French based on patient's specific symptoms]
8. [Question 8 in French based on patient's specific symptoms]
9. [Question 9 in French based on patient's specific symptoms]
10. [Question 10 in French based on patient's specific symptoms]

SUPER_SPARTAN_SAP_NOTE:
Generate a detailed SAP note in French based on the patient's ACTUAL symptoms:
S: [Use patient's actual demographics, symptoms, duration, severity, associated symptoms, medical history, medications, allergies, treatments tried from the data above]
A: [Create differential diagnoses based on patient's actual symptoms and history]
P: [Create treatment plan based on patient's actual condition and needs]

MEDICATIONS_READY_TO_USE:
Generate medication prescriptions in French based on the patient's ACTUAL condition:
[Create specific medications based on patient's symptoms, allergies, and medical history]

LAB_WORKS:
Generate lab work recommendations in French based on the patient's ACTUAL symptoms:
CODES:
[Create lab codes based on patient's specific symptoms and differential diagnoses]

Explication détaillée:
[Explain why each lab test is needed based on patient's actual symptoms and medical history]

IMAGERIE_MEDICALE:
Generate imaging recommendations in French based on the patient's ACTUAL symptoms:
[Create imaging studies based on patient's specific symptoms and clinical presentation]

REFERENCE_SPECIALISTES:
Generate specialist referrals in French based on the patient's ACTUAL condition:
[Create referrals based on patient's specific symptoms and medical needs]

WORK_LEAVE_CERTIFICATE:
[Generate work leave certificate based on patient's actual condition and symptoms]

WORKPLACE_MODIFICATIONS:
[Generate workplace modifications based on patient's actual condition and limitations]

INSURANCE_DOCUMENTATION:
[Generate insurance documentation based on patient's actual diagnosis and condition]

TELEMEDICINE_NEEDS_IN_PERSON:
[Generate telemedicine limitations based on patient's actual symptoms and needs]

PATIENT_MESSAGE:
[Generate patient message based on patient's actual condition and treatment plan]

STEPWISE_STRATEGY:
CRITICAL: Analyze the Enhanced SOAP note provided below. The Enhanced SOAP note combines HPI summary + patient Q&A answers and contains the complete clinical picture.

${enhancedSoapNote ? `Enhanced SOAP Note to Analyze:
${enhancedSoapNote}

Doctor HPI Summary:
${doctorHpiSummary || enhancedHpiSummary || 'N/A'}

` : `Enhanced SOAP Note not yet available. Use the patient data below to construct a preliminary analysis:
Patient Data: ${JSON.stringify(variables, null, 2)}
${enhancedHpiSummary ? `Enhanced HPI Summary: ${enhancedHpiSummary}` : ''}

`}

Generate a Stepwise Strategy discussion in Spartan Format by analyzing the Enhanced SOAP note (if available) with these exact subsections:
1. Symptoms: Summarize key symptoms and clinical presentation from the Enhanced SOAP note (HPI + patient Q&A answers)
2. Physical Red Flags: List concerning physical examination findings or red flags based on symptoms and clarifications in the Enhanced SOAP note
3. Labs: Specific lab tests to order with rationale based on the clinical presentation in the Enhanced SOAP note (e.g., "Order to rule out [condition]: CBC, CRP, ESR, etc.")
4. Imaging: Specific imaging studies needed with indications and timing based on the Enhanced SOAP note (e.g., "If X-rays inconclusive → Ultrasound or MRI")
5. Treatment: Stepwise treatment approach including medications, activity modifications, referrals, and conservative care timeline based on the patient's condition as described in the Enhanced SOAP note
6. Follow-Up: Monitoring schedule and follow-up timing with specific conditions for earlier return based on the triage level and clinical presentation in the Enhanced SOAP note

Format as structured text:
"1. Symptoms\n[relevant symptoms summary from Enhanced SOAP note]\n\n2. Physical Red Flags\n[concerning findings based on Enhanced SOAP note]\n\n3. Labs\n[lab tests with rationale based on Enhanced SOAP note]\n\n4. Imaging\n[imaging studies with indications based on Enhanced SOAP note]\n\n5. Treatment\n[treatment plan based on Enhanced SOAP note]\n\n6. Follow-Up\n[follow-up schedule based on Enhanced SOAP note]"

Use proper French medical terminology and ensure each section is comprehensive and personalized to this specific patient. Return ONLY the content, no code or formatting.`;

    let aiResponse = "";

    // Try OpenAI first
    if (OPENAI_API_KEY) {
      try {
        const openaiResponse = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a medical AI assistant specializing in French medical documentation and clinical transcription."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 4000
          },
          {
            headers: {
              "Authorization": `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );

        aiResponse = openaiResponse.data.choices[0].message.content;
        console.log("OpenAI response received");
      } catch (openaiError) {
        console.error("OpenAI error:", openaiError.response?.data || openaiError.message);
      }
    }

    // Try Anthropic as fallback
    if (!aiResponse && ANTHROPIC_API_KEY) {
      try {
        const anthropicResponse = await axios.post(
          "https://api.anthropic.com/v1/messages",
          {
            model: "claude-3-5-haiku-20241022",
            max_tokens: 4000,
            messages: [
              {
                role: "user",
                content: prompt
              }
            ]
          },
          {
            headers: {
              "x-api-key": ANTHROPIC_API_KEY,
              "Content-Type": "application/json",
              "anthropic-version": "2023-06-01"
            }
          }
        );

        aiResponse = anthropicResponse.data.content[0].text;
        console.log("Anthropic response received");
      } catch (anthropicError) {
        console.error("Anthropic error:", anthropicError.response?.data || anthropicError.message);
      }
    }

    if (!aiResponse) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "AI service unavailable",
          message: "Both OpenAI and Anthropic APIs are not responding"
        }),
      };
    }

    // Parse the AI response into sections
    const sections = parseMedicalSections(aiResponse);

    // If custom request, return custom response
    if (customRequest) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          customResponse: aiResponse
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(sections),
    };

  } catch (error) {
    console.error("Error in medical transcription:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message
      }),
    };
  }
};

function parseMedicalSections(text) {
  // Parse sections using the new format with colon delimiters
  const sections = {
    hpiConfirmationSummary: "",
    followUpQuestions: "",
    superSpartanSAP: "",
    medicationsReadyToUse: "",
    labWorks: "",
    imagerieMedicale: "",
    referenceSpecialistes: "",
    workLeaveCertificate: "",
    workplaceModifications: "",
    insuranceDocumentation: "",
    telemedicineNeedsInPerson: "",
    patientMessage: "",
    stepwiseStrategy: ""
  };

  // Split text into lines and process
  const lines = text.split('\n');
  let currentSection = '';
  let currentContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for section headers (format: SECTION_NAME:)
    if (line.endsWith(':') && line.includes('_')) {
      // Save previous section
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      
      // Start new section
      const sectionKey = line.replace(':', '').toLowerCase();
      currentSection = mapSectionKey(sectionKey);
      currentContent = [];
    } else if (currentSection && line) {
      // Add content to current section
      currentContent.push(line);
    }
  }

  // Add the last section
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  // If no sections were found, try to extract from the raw text
  if (Object.values(sections).every(section => !section.trim())) {
    // Fallback: return the raw text in the first section
    sections.hpiConfirmationSummary = text;
  }

  return sections;
}

function mapSectionKey(sectionKey) {
  switch (sectionKey) {
    case 'hpi_confirmation_summary':
      return 'hpiConfirmationSummary';
    case 'follow_up_questions':
      return 'followUpQuestions';
    case 'super_spartan_sap_note':
      return 'superSpartanSAP';
    case 'medications_ready_to_use':
      return 'medicationsReadyToUse';
    case 'lab_works':
      return 'labWorks';
    case 'imagerie_medicale':
      return 'imagerieMedicale';
    case 'reference_specialistes':
      return 'referenceSpecialistes';
    case 'work_leave_certificate':
      return 'workLeaveCertificate';
    case 'workplace_modifications':
      return 'workplaceModifications';
    case 'insurance_documentation':
      return 'insuranceDocumentation';
    case 'telemedicine_needs_in_person':
      return 'telemedicineNeedsInPerson';
    case 'patient_message':
      return 'patientMessage';
    case 'stepwise_strategy':
      return 'stepwiseStrategy';
    default:
      return '';
  }
}
