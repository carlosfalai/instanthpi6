import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const router = Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

// Ollama configuration
function getOllamaCandidates() {
  const fromEnv = process.env.OLLAMA_URL ? [process.env.OLLAMA_URL] : [];
  return [...fromEnv, "http://localhost:11434", "https://ollama.instanthpi.ca"];
}

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

interface UnifiedMedicalRequest {
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

// Format patient data for AI processing
function formatPatientDataForAI(data: UnifiedMedicalRequest): string {
  return `Patient ID: ${data.patient_id}
Gender: ${data.gender === "male" ? "Masculin" : data.gender === "female" ? "Féminin" : data.gender || "Non spécifié"}
Age: ${data.age || "Non spécifié"}
Chief Complaint: ${data.chief_complaint}
When did this problem start?: ${data.problem_start_date || "Non spécifié"}
Was there a specific trigger?: ${data.specific_trigger || "Aucun"}
Where is the symptom located?: ${data.symptom_location || "Non spécifié"}
How would you describe your symptom?: ${data.symptom_description || "Non spécifié"}
What makes the symptom worse?: ${data.symptom_aggravators || "Rien de particulier"}
What relieves the symptom?: ${data.symptom_relievers || "Rien de particulier"}
On a scale of 0 to 10, how severe is your symptom?: ${data.severity}
How has the symptom evolved over time?: ${data.symptom_progression || "Stable"}
Are you experiencing any of the following symptoms?: ${data.selected_symptoms?.join(", ") || "Aucun"}
Have you tried any treatments or remedies for this problem?: ${data.treatments_attempted || "Aucun"}
Were the treatments effective?: ${data.treatment_effectiveness || "Non applicable"}
Do you have any chronic conditions?: ${data.chronic_conditions || "Aucune"}
Do you have any known medication allergies?: ${data.medication_allergies || "Aucune"}
Are you pregnant or breastfeeding?: ${data.pregnancy_status || "Non"}
Is there anything else we should know?: ${data.additional_notes || "Non"}`;
}

// Build the comprehensive medical prompt
function buildUnifiedMedicalPrompt(data: UnifiedMedicalRequest): string {
  const patientData = formatPatientDataForAI(data);

  return `You are an expert medical AI assistant. Generate a comprehensive medical documentation package with BOTH triage assessment AND complete clinical documentation.

CRITICAL REQUIREMENTS:
1. Output must be valid JSON with two main sections: "triage" and "documentation"
2. Use French language for all medical documentation
3. Create natural, professional medical language - DO NOT copy patient input verbatim
4. Include comprehensive details for all sections

${patientData}

Generate a JSON response with this EXACT structure:

{
  "triage": {
    "level": "P1-P5 level (P1=most urgent)",
    "urgency_score": 1-10,
    "reasoning": "Medical reasoning for triage decision",
    "recommended_action": "Specific next steps"
  },
  "documentation": {
    "clinical_strategy": {
      "primary_diagnosis": {
        "name": "Diagnosis name",
        "probability": 0-100,
        "reasoning": "Why this is most likely"
      },
      "differential_diagnoses": [
        {
          "name": "Alternative diagnosis",
          "probability": 0-100,
          "criteria": "When to consider this"
        }
      ],
      "red_flags_present": ["Current red flag 1", "Current red flag 2"],
      "red_flags_to_watch": ["Future red flag 1", "Future red flag 2"]
    },
    "hpi": "Juste pour confirmer: [Natural French summary of patient presentation]. Est-ce que ce résumé est exact?",
    "soap_note": {
      "subjective": "Patient's reported symptoms in medical French",
      "objective": "Physical findings would include...",
      "assessment": "Clinical assessment",
      "plan": "Treatment plan overview"
    },
    "follow_up_questions": [
      "Question 1?",
      "Question 2?",
      "Question 3?",
      "Question 4?",
      "Question 5?",
      "Question 6?",
      "Question 7?",
      "Question 8?",
      "Question 9?",
      "Question 10?"
    ],
    "medications": {
      "primary_diagnosis_meds": [
        {
          "name": "Medication name",
          "dose": "Dosage",
          "route": "Route",
          "frequency": "Frequency",
          "duration": "Duration",
          "max": "Maximum dose",
          "rationale": "Clinical reasoning"
        }
      ],
      "differential_meds": {
        "diagnosis_name": [
          {
            "name": "Alternative medication",
            "dose": "Dosage",
            "route": "Route",
            "frequency": "Frequency",
            "duration": "Duration",
            "rationale": "Why this instead"
          }
        ]
      }
    },
    "laboratory_tests": {
      "primary_diagnosis_tests": ["Test 1", "Test 2"],
      "differential_tests": {
        "diagnosis_name": ["Alternative test 1", "Alternative test 2"]
      }
    },
    "imaging_requisitions": [
      {
        "type": "Imaging type",
        "clinical_details": "Complete patient presentation and indication",
        "indication": "Specific clinical indication",
        "urgency": "Routine/Urgent/STAT"
      }
    ],
    "specialist_referrals": [
      {
        "specialty": "Specialist type",
        "clinical_details": "Comprehensive referral letter with full patient presentation",
        "reason": "Specific reason for referral",
        "urgency": "Routine/Semi-urgent/Urgent"
      }
    ],
    "work_leave_declaration": {
      "start_date": "${new Date().toLocaleDateString("fr-CA")}",
      "end_date": "YYYY-MM-DD",
      "diagnosis": "Medical justification",
      "limitations": "Specific limitations during leave"
    },
    "work_modifications": {
      "weight_limit": "X kg",
      "restrictions": ["Restriction 1", "Restriction 2"],
      "accommodations": ["Accommodation 1", "Accommodation 2"],
      "duration": "X weeks"
    },
    "insurance_declaration": {
      "primary_diagnosis_code": "ICD-10 code",
      "primary_diagnosis_name": "Diagnosis name",
      "secondary_diagnosis_code": "ICD-10 code if applicable",
      "secondary_diagnosis_name": "Secondary diagnosis if applicable",
      "consultation_date": "${new Date().toLocaleDateString("fr-CA")}",
      "hospitalization_required": false,
      "surgery_required": false,
      "treatment_plan": "Brief treatment overview",
      "prognosis": "Expected outcome",
      "severity": "${data.severity}/10",
      "severity_description": "Mild/Moderate/Severe"
    }
  },
  "metadata": {
    "generated_at": "${new Date().toISOString()}",
    "language": "fr",
    "patient_age": ${data.age || "null"},
    "patient_gender": "${data.gender || "unknown"}"
  }
}

CRITICAL FORMATTING RULES:
1. Generate valid JSON that can be parsed
2. Use proper French medical terminology
3. Be comprehensive - include full clinical details
4. For referrals: Include complete patient presentation like "Femme de 56 ans, infection urinaire récurrente..."
5. For imaging: Include full clinical context
6. Transform patient input into professional medical language`;
}

// Parse AI response for structured data
function parseAIResponse(response: string): any {
  try {
    // Try to parse as JSON first
    return JSON.parse(response);
  } catch (error) {
    // If not valid JSON, try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error("Failed to parse extracted JSON:", parseError);
        throw new Error("AI response is not valid JSON");
      }
    }
    throw new Error("No valid JSON found in AI response");
  }
}

// POST /api/unified-medical-processing - Process patient submission with triage and documentation
router.post("/process-patient-submission", async (req, res) => {
  try {
    const startTime = Date.now();
    const patientData: UnifiedMedicalRequest = req.body;

    // Validate required fields
    if (!patientData.patient_id || !patientData.chief_complaint) {
      return res.status(400).json({
        error: "Missing required fields: patient_id and chief_complaint",
      });
    }

    console.log("🏥 Processing unified medical submission for patient:", patientData.patient_id);

    // Check if consultation already exists
    const { data: existingConsultation } = await supabase
      .from("consultations")
      .select("id, initial_ai_processed_at")
      .eq("patient_id", patientData.patient_id)
      .single();

    let consultationId: string;

    if (existingConsultation) {
      consultationId = existingConsultation.id;

      // If already processed, return cached data
      if (existingConsultation.initial_ai_processed_at) {
        const { data: documentation } = await supabase
          .from("ai_medical_documentation")
          .select("*")
          .eq("consultation_id", consultationId)
          .single();

        if (documentation) {
          console.log("📋 Returning cached documentation for patient:", patientData.patient_id);
          return res.json({
            success: true,
            consultation_id: consultationId,
            triage: documentation.triage_data,
            documentation_id: documentation.id,
            from_cache: true,
          });
        }
      }
    } else {
      // Create new consultation
      const { data: newConsultation, error: consultationError } = await supabase
        .from("consultations")
        .insert({
          patient_id: patientData.patient_id,
          chief_complaint: patientData.chief_complaint,
          symptoms: patientData.symptom_description || "",
          duration: patientData.problem_start_date || "",
          severity: patientData.severity,
          location: patientData.symptom_location,
          trigger_event: patientData.specific_trigger,
          aggravating_factors: patientData.symptom_aggravators,
          relieving_factors: patientData.symptom_relievers,
          evolution: patientData.symptom_progression,
          associated_symptoms: patientData.selected_symptoms?.join(", "),
          treatments_tried: patientData.treatments_attempted,
          treatment_response: patientData.treatment_effectiveness,
          chronic_conditions: patientData.chronic_conditions,
          allergies: patientData.medication_allergies,
          pregnancy_breastfeeding: patientData.pregnancy_status,
          other_notes: patientData.additional_notes,
          form_data: patientData,
          status: "pending",
        })
        .select()
        .single();

      if (consultationError) {
        throw new Error(`Failed to create consultation: ${consultationError.message}`);
      }

      consultationId = newConsultation.id;
    }

    // Generate AI response
    const prompt = buildUnifiedMedicalPrompt(patientData);
    let aiResult: any = null;
    let aiProvider = "ollama";
    let aiSucceeded = false;

    // Try multiple Ollama endpoints
    const candidates = getOllamaCandidates();
    for (const base of candidates) {
      try {
        console.log("🤖 Trying Ollama at:", base);
        const ollamaResponse = await axios.post(
          `${base}/api/generate`,
          {
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false,
            options: {
              temperature: 0.3,
              top_p: 0.9,
              num_predict: 4096,
            },
          },
          {
            timeout: 60000, // 60 seconds for comprehensive generation
            headers: { "Content-Type": "application/json" },
          }
        );

        const aiResponse = ollamaResponse.data?.response || "";
        if (aiResponse) {
          console.log("✅ Ollama responded, parsing result...");
          aiResult = parseAIResponse(aiResponse);
          aiSucceeded = true;
          break;
        }
      } catch (err: any) {
        console.warn(`⚠️ Ollama at ${base} failed:`, err?.message || err);
        continue;
      }
    }

    if (!aiSucceeded || !aiResult) {
      throw new Error("All AI endpoints failed to generate documentation");
    }

    const processingTime = Date.now() - startTime;

    // Store AI-generated documentation
    const { data: documentation, error: docError } = await supabase
      .from("ai_medical_documentation")
      .insert({
        consultation_id: consultationId,
        patient_id: patientData.patient_id,
        clinical_strategy: aiResult.documentation.clinical_strategy,
        hpi: aiResult.documentation.hpi,
        soap_note: aiResult.documentation.soap_note,
        follow_up_questions: aiResult.documentation.follow_up_questions,
        medications: aiResult.documentation.medications,
        laboratory_tests: aiResult.documentation.laboratory_tests,
        imaging_requisitions: aiResult.documentation.imaging_requisitions,
        specialist_referrals: aiResult.documentation.specialist_referrals,
        work_leave_declaration: aiResult.documentation.work_leave_declaration,
        work_modifications: aiResult.documentation.work_modifications,
        insurance_declaration: aiResult.documentation.insurance_declaration,
        initial_generation_time_ms: processingTime,
        ai_provider: aiProvider,
        ai_model: OLLAMA_MODEL,
        language: "fr",
      })
      .select()
      .single();

    if (docError) {
      throw new Error(`Failed to store documentation: ${docError.message}`);
    }

    // Update consultation with triage data and processing timestamp
    await supabase
      .from("consultations")
      .update({
        triage_data: aiResult.triage,
        initial_ai_processed_at: new Date().toISOString(),
        status:
          aiResult.triage.level === "P1" || aiResult.triage.level === "P2" ? "urgent" : "pending",
      })
      .eq("id", consultationId);

    // Log AI processing
    await supabase.from("ai_processing_logs").insert({
      consultation_id: consultationId,
      patient_id: patientData.patient_id,
      command: "initial_documentation",
      input_data: patientData,
      output_data: aiResult,
      processing_stage: "initial",
      ai_provider: aiProvider,
      ai_model: OLLAMA_MODEL,
      processing_time_ms: processingTime,
    });

    console.log(`✅ Unified processing completed in ${processingTime}ms`);

    // Return triage result for immediate patient display
    res.json({
      success: true,
      consultation_id: consultationId,
      documentation_id: documentation.id,
      triage: aiResult.triage,
      processing_time_ms: processingTime,
      from_cache: false,
    });
  } catch (error: any) {
    console.error("❌ Unified processing error:", error);
    res.status(500).json({
      error: "Medical processing failed",
      message: error.message || "An error occurred during medical processing",
    });
  }
});

// GET /api/unified-medical-processing/doctor-notes/:patientId - Retrieve pre-generated documentation
router.get("/doctor-notes/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId } = req.query; // Doctor's user ID for preferences

    console.log("📋 Retrieving documentation for patient:", patientId);

    // Get the latest consultation and documentation
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select(
        `
        *,
        ai_medical_documentation (*)
      `
      )
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (consultationError || !consultation) {
      return res.status(404).json({
        error: "No consultation found for this patient",
      });
    }

    const documentation = consultation.ai_medical_documentation?.[0];

    if (!documentation) {
      return res.status(404).json({
        error: "No documentation available. Patient form may not have been processed yet.",
      });
    }

    // Get doctor's preferences if userId provided
    let preferences = null;
    if (userId) {
      const { data: prefs } = await supabase
        .from("doctor_documentation_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      preferences = prefs;
    }

    // Filter sections based on preferences
    const visibleSections: any = {};
    const additionalSectionsAvailable = [];

    // Core sections (check preferences)
    if (!preferences || preferences.show_clinical_strategy) {
      visibleSections.clinical_strategy = documentation.clinical_strategy;
    }
    if (!preferences || preferences.show_hpi) {
      visibleSections.hpi = documentation.hpi;
    }
    if (!preferences || preferences.show_soap) {
      visibleSections.soap_note = documentation.soap_note;
    }
    if (!preferences || preferences.show_follow_up_questions) {
      visibleSections.follow_up_questions = documentation.follow_up_questions;
    }
    if (!preferences || preferences.show_medications) {
      visibleSections.medications = documentation.medications;
    }
    if (!preferences || preferences.show_laboratory) {
      visibleSections.laboratory_tests = documentation.laboratory_tests;
    }
    if (!preferences || preferences.show_imaging) {
      visibleSections.imaging_requisitions = documentation.imaging_requisitions;
    }
    if (!preferences || preferences.show_referrals) {
      visibleSections.specialist_referrals = documentation.specialist_referrals;
    }
    if (preferences?.show_work_leave) {
      visibleSections.work_leave_declaration = documentation.work_leave_declaration;
    }
    if (preferences?.show_work_modifications) {
      visibleSections.work_modifications = documentation.work_modifications;
    }
    if (preferences?.show_insurance_declaration) {
      visibleSections.insurance_declaration = documentation.insurance_declaration;
    }

    // Check which additional sections are enabled but not yet generated
    if (preferences?.enable_preventive_care && !documentation.preventive_care_suggestions) {
      additionalSectionsAvailable.push("preventive_care");
    }
    if (preferences?.enable_patient_education && !documentation.patient_education_materials) {
      additionalSectionsAvailable.push("patient_education");
    }
    if (preferences?.enable_billing_optimization && !documentation.billing_optimization) {
      additionalSectionsAvailable.push("billing_optimization");
    }
    if (preferences?.enable_functional_medicine && !documentation.functional_medicine_approach) {
      additionalSectionsAvailable.push("functional_medicine");
    }
    if (preferences?.enable_mental_health_screening && !documentation.mental_health_screening) {
      additionalSectionsAvailable.push("mental_health_screening");
    }
    if (preferences?.enable_lifestyle_modifications && !documentation.lifestyle_modifications) {
      additionalSectionsAvailable.push("lifestyle_modifications");
    }
    if (preferences?.enable_alternative_treatments && !documentation.alternative_treatments) {
      additionalSectionsAvailable.push("alternative_treatments");
    }
    if (preferences?.enable_research_articles && !documentation.research_articles) {
      additionalSectionsAvailable.push("research_articles");
    }

    res.json({
      success: true,
      consultation_id: consultation.id,
      documentation_id: documentation.id,
      patient_id: patientId,
      chief_complaint: consultation.chief_complaint,
      severity: consultation.severity,
      created_at: consultation.created_at,
      documentation: visibleSections,
      additional_sections_available: additionalSectionsAvailable,
      complete_documentation_available: documentation.complete_ai_processed_at !== null,
      preferences: preferences
        ? {
            auto_expand_sections: preferences.auto_expand_sections,
            show_copy_buttons: preferences.show_copy_buttons,
            compact_view: preferences.compact_view,
          }
        : null,
    });
  } catch (error: any) {
    console.error("❌ Error retrieving documentation:", error);
    res.status(500).json({
      error: "Failed to retrieve documentation",
      message: error.message,
    });
  }
});

// POST /api/unified-medical-processing/complete-documentation - Generate additional documentation sections
router.post("/complete-documentation", async (req, res) => {
  try {
    const startTime = Date.now();
    const { documentation_id, sections_requested, user_id } = req.body;

    if (!documentation_id || !sections_requested || sections_requested.length === 0) {
      return res.status(400).json({
        error: "Missing required fields: documentation_id and sections_requested",
      });
    }

    console.log("🔄 Generating additional documentation sections:", sections_requested);

    // Get existing documentation and consultation
    const { data: documentation, error: docError } = await supabase
      .from("ai_medical_documentation")
      .select(
        `
        *,
        consultations (*)
      `
      )
      .eq("id", documentation_id)
      .single();

    if (docError || !documentation) {
      return res.status(404).json({
        error: "Documentation not found",
      });
    }

    const consultation = documentation.consultations;

    // Build prompt for additional sections
    const additionalPrompt = `Based on the following patient consultation, generate additional medical documentation sections.

Patient Information:
${JSON.stringify(consultation.form_data, null, 2)}

Existing Clinical Assessment:
${JSON.stringify(documentation.clinical_strategy, null, 2)}

Generate the following additional sections in French:

{
  ${
    sections_requested.includes("preventive_care")
      ? `"preventive_care_suggestions": {
    "vaccinations": ["Vaccine 1 with rationale", "Vaccine 2 with rationale"],
    "screenings": ["Screening test 1 with timing", "Screening test 2 with timing"],
    "counseling": ["Counseling topic 1", "Counseling topic 2"],
    "follow_up_schedule": "Recommended follow-up timeline"
  },`
      : ""
  }
  ${
    sections_requested.includes("patient_education")
      ? `"patient_education_materials": {
    "condition_information": "Educational content about the condition",
    "self_care_instructions": ["Instruction 1", "Instruction 2"],
    "warning_signs": ["When to seek immediate care"],
    "resources": ["Resource 1", "Resource 2"]
  },`
      : ""
  }
  ${
    sections_requested.includes("billing_optimization")
      ? `"billing_optimization": {
    "suggested_billing_codes": ["Code 1 with description", "Code 2 with description"],
    "documentation_requirements": ["Required documentation 1", "Required documentation 2"],
    "time_based_billing": "Estimated time and complexity",
    "additional_billable_services": ["Service 1", "Service 2"]
  },`
      : ""
  }
  ${
    sections_requested.includes("functional_medicine")
      ? `"functional_medicine_approach": {
    "root_cause_analysis": "Potential underlying causes",
    "nutritional_recommendations": ["Recommendation 1", "Recommendation 2"],
    "supplement_suggestions": ["Supplement 1 with dosage", "Supplement 2 with dosage"],
    "lifestyle_interventions": ["Intervention 1", "Intervention 2"]
  },`
      : ""
  }
  ${
    sections_requested.includes("mental_health_screening")
      ? `"mental_health_screening": {
    "screening_tools": ["PHQ-9 indicated", "GAD-7 if anxiety present"],
    "risk_assessment": "Current mental health risk level",
    "interventions": ["Suggested intervention 1", "Suggested intervention 2"],
    "referral_consideration": "Mental health referral if indicated"
  },`
      : ""
  }
  ${
    sections_requested.includes("lifestyle_modifications")
      ? `"lifestyle_modifications": {
    "exercise_recommendations": "Specific exercise program",
    "dietary_changes": ["Diet change 1", "Diet change 2"],
    "sleep_hygiene": "Sleep improvement strategies",
    "stress_management": "Stress reduction techniques"
  },`
      : ""
  }
  ${
    sections_requested.includes("alternative_treatments")
      ? `"alternative_treatments": {
    "complementary_therapies": ["Therapy 1 with evidence", "Therapy 2 with evidence"],
    "mind_body_approaches": ["Approach 1", "Approach 2"],
    "traditional_medicine": "Culturally relevant options if applicable",
    "safety_considerations": "Interaction warnings"
  },`
      : ""
  }
  ${
    sections_requested.includes("research_articles")
      ? `"research_articles": {
    "recent_studies": ["Study 1 summary and relevance", "Study 2 summary and relevance"],
    "treatment_guidelines": "Latest guideline recommendations",
    "evidence_level": "Quality of evidence for current treatment",
    "clinical_trials": "Relevant ongoing trials if applicable"
  }`
      : ""
  }
}`;

    // Generate additional sections via AI
    let aiResult: any = null;
    const candidates = getOllamaCandidates();

    for (const base of candidates) {
      try {
        console.log("🤖 Requesting additional sections from Ollama at:", base);
        const ollamaResponse = await axios.post(
          `${base}/api/generate`,
          {
            model: OLLAMA_MODEL,
            prompt: additionalPrompt,
            stream: false,
            options: {
              temperature: 0.3,
              top_p: 0.9,
              num_predict: 2048,
            },
          },
          {
            timeout: 45000,
            headers: { "Content-Type": "application/json" },
          }
        );

        const aiResponse = ollamaResponse.data?.response || "";
        if (aiResponse) {
          aiResult = parseAIResponse(aiResponse);
          break;
        }
      } catch (err: any) {
        console.warn(`⚠️ Ollama at ${base} failed:`, err?.message);
        continue;
      }
    }

    if (!aiResult) {
      throw new Error("Failed to generate additional documentation sections");
    }

    const processingTime = Date.now() - startTime;

    // Update documentation with new sections
    const updates: any = {
      complete_generation_time_ms: processingTime,
      complete_ai_processed_at: new Date().toISOString(),
    };

    // Add each generated section to the update
    Object.keys(aiResult).forEach((key) => {
      updates[key] = aiResult[key];
    });

    const { error: updateError } = await supabase
      .from("ai_medical_documentation")
      .update(updates)
      .eq("id", documentation_id);

    if (updateError) {
      throw new Error(`Failed to update documentation: ${updateError.message}`);
    }

    // Update consultation timestamp
    await supabase
      .from("consultations")
      .update({
        complete_ai_processed_at: new Date().toISOString(),
      })
      .eq("id", documentation.consultation_id);

    // Log the additional AI processing
    await supabase.from("ai_processing_logs").insert({
      consultation_id: documentation.consultation_id,
      patient_id: documentation.patient_id,
      command: "complete_documentation",
      input_data: { sections_requested },
      output_data: aiResult,
      processing_stage: "complete",
      ai_provider: "ollama",
      ai_model: OLLAMA_MODEL,
      processing_time_ms: processingTime,
    });

    console.log(`✅ Additional documentation generated in ${processingTime}ms`);

    res.json({
      success: true,
      sections_generated: Object.keys(aiResult),
      processing_time_ms: processingTime,
      additional_documentation: aiResult,
    });
  } catch (error: any) {
    console.error("❌ Error generating additional documentation:", error);
    res.status(500).json({
      error: "Failed to generate additional documentation",
      message: error.message,
    });
  }
});

export default router;
