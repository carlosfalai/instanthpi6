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

    // Build the prompt for medical transcription
    let prompt = `You are a medical AI assistant. Generate a comprehensive French medical transcription based on the following patient information:

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

Please generate the following sections in French:

1. HPI Confirmation Summary
2. 10 Follow-up Questions
3. Super Spartan SAP Note
4. Medications Ready to Use
5. Lab Works
6. Imagerie Médicale
7. Référence aux Spécialistes
8. Work Leave Certificate
9. Workplace Modifications
10. Insurance Documentation
11. Télémédecine Needs In-Person
12. Patient Message

Format each section clearly with appropriate medical terminology.`;

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
  // Simple parsing logic to extract sections
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

  // Try to extract sections based on common patterns
  const lines = text.split('\n');
  let currentSection = '';
  let currentContent = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('hpi') || lowerLine.includes('confirmation')) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'hpiConfirmationSummary';
      currentContent = [line];
    } else if (lowerLine.includes('follow') || lowerLine.includes('questions')) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'followUpQuestions';
      currentContent = [line];
    } else if (lowerLine.includes('sap') || lowerLine.includes('spartan')) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'superSpartanSAP';
      currentContent = [line];
    } else if (lowerLine.includes('medication') || lowerLine.includes('médicament')) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'medicationsReadyToUse';
      currentContent = [line];
    } else if (lowerLine.includes('lab') || lowerLine.includes('laboratoire')) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'labWorks';
      currentContent = [line];
    } else if (lowerLine.includes('imagerie') || lowerLine.includes('imaging')) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'imagerieMedicale';
      currentContent = [line];
    } else if (lowerLine.includes('référence') || lowerLine.includes('specialist')) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'referenceSpecialistes';
      currentContent = [line];
    } else if (lowerLine.includes('work leave') || lowerLine.includes('arrêt')) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'workLeaveCertificate';
      currentContent = [line];
    } else if (lowerLine.includes('workplace') || lowerLine.includes('modification')) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'workplaceModifications';
      currentContent = [line];
    } else if (lowerLine.includes('insurance') || lowerLine.includes('assurance')) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'insuranceDocumentation';
      currentContent = [line];
    } else if (lowerLine.includes('télémédecine') || lowerLine.includes('telemedicine')) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'telemedicineNeedsInPerson';
      currentContent = [line];
    } else if (lowerLine.includes('patient message') || lowerLine.includes('message patient')) {
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = 'patientMessage';
      currentContent = [line];
    } else {
      currentContent.push(line);
    }
  }

  // Add the last section
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return sections;
}
