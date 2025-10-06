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
            model: "claude-3-5-sonnet-20241022",
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
    patientMessage: ""
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
    default:
      return '';
  }
}
