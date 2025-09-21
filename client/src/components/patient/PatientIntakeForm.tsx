import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

export function PatientIntakeForm() {
  const [deIdentifiedId, setDeIdentifiedId] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [problemStartDate, setProblemStartDate] = useState("");
  const [specificTrigger, setSpecificTrigger] = useState("");
  const [symptomLocation, setSymptomLocation] = useState("");
  const [symptomDescription, setSymptomDescription] = useState("");
  const [symptomAggravators, setSymptomAggravators] = useState("");
  const [symptomRelievers, setSymptomRelievers] = useState("");
  const [severity, setSeverity] = useState("5");
  const [symptomProgression, setSymptomProgression] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [treatmentsAttempted, setTreatmentsAttempted] = useState("");
  const [treatmentEffectiveness, setTreatmentEffectiveness] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");
  const [medicationAllergies, setMedicationAllergies] = useState("");
  const [pregnancyStatus, setPregnancyStatus] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Organized symptom list by body systems (French translations from image)
  const symptomsBySystem = {
    Systemic: ["Fever", "Chills", "Night sweats", "Fatigue", "Weight loss", "Weight gain"],
    Gastrointestinal: [
      "Nausea",
      "Vomiting",
      "Diarrhea",
      "Constipation",
      "Abdominal pain",
      "Heartburn",
      "Difficulty swallowing",
      "Change in appetite",
      "Blood in stool",
    ],
    Genitourinary: [
      "Painful urination",
      "Frequent urination",
      "Urgent urination",
      "Blood in urine",
      "Difficulty urinating",
    ],
    Respiratory: [
      "Shortness of breath",
      "Cough",
      "Wheezing",
      "Chest tightness",
      "Sputum production",
    ],
    Cardiovascular: ["Chest pain", "Heart palpitations", "Swelling in legs", "High blood pressure"],
    Neurological: [
      "Headache",
      "Dizziness",
      "Fainting",
      "Seizures",
      "Memory problems",
      "Confusion",
      "Numbness/tingling",
      "Weakness",
      "Vision changes",
      "Hearing changes",
    ],
    Dermatological: ["Rash", "Itching", "Unusual moles", "Hair loss", "Nail changes"],
    Musculoskeletal: ["Joint pain", "Muscle pain", "Back pain", "Neck pain", "Stiffness"],
    Psychological: [
      "Depression",
      "Anxiety",
      "Difficulty falling asleep",
      "Frequent waking",
      "Early morning awakening",
      "Mood changes",
    ],
  };

  // Generate de-identified ID (Letter-Number pattern, 10 characters total)
  const generateDeIdentifiedId = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";

    let code = "";
    for (let i = 0; i < 5; i++) {
      // Add one random capital letter
      const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
      code += randomLetter;

      // Add one random digit
      const randomDigit = numbers.charAt(Math.floor(Math.random() * numbers.length));
      code += randomDigit;
    }

    setDeIdentifiedId(code);
    return code;
  };

  const handleSymptomChange = (symptom: string, checked: boolean) => {
    if (checked) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    } else {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    }
  };

  const [triageResult, setTriageResult] = useState<any>(null);

  // Fill test data for quick testing - 10 different random patients
  const fillTestData = () => {
    // Generate test ID
    const testId = generateDeIdentifiedId();

    // Array of 10 different patient scenarios
    const testPatients = [
      {
        gender: "male",
        age: "45",
        reasonForVisit: "Sharp chest pain that started this morning, feeling short of breath",
        problemStartDate: "This morning around 8 AM",
        specificTrigger: "Started after climbing stairs to my office",
        symptomLocation: "Left side of chest, radiating to left arm",
        symptomDescription: "Sharp, stabbing pain that comes in waves. Gets worse when I take deep breaths. Also feeling lightheaded and nauseous.",
        symptomAggravators: "Deep breathing, movement, lying flat",
        symptomRelievers: "Sitting upright, staying still",
        severity: "8",
        symptomProgression: "getting_worse",
        selectedSymptoms: ["Chest pain", "Shortness of breath", "Nausea", "Dizziness", "Heart palpitations"],
        treatmentsAttempted: "Took 2 Tylenol about an hour ago, tried resting",
        treatmentEffectiveness: "Tylenol didn't help much, resting helped a little but pain persists",
        chronicConditions: "High blood pressure, family history of heart disease",
        medicationAllergies: "Penicillin - causes rash",
        pregnancyStatus: "not_applicable",
        additionalNotes: "I'm worried this might be a heart attack. My father had one at age 50. I've been under a lot of stress at work lately."
      },
      {
        gender: "female",
        age: "32",
        reasonForVisit: "Severe headache with visual disturbances",
        problemStartDate: "Started yesterday evening",
        specificTrigger: "After working on computer for 8 hours",
        symptomLocation: "Frontal and temporal regions, both sides",
        symptomDescription: "Throbbing pain with flashing lights and blind spots in vision",
        symptomAggravators: "Bright lights, noise, movement",
        symptomRelievers: "Dark room, cold compress, lying down",
        severity: "7",
        symptomProgression: "getting_worse",
        selectedSymptoms: ["Headache", "Visual disturbances", "Nausea", "Light sensitivity", "Neck stiffness"],
        treatmentsAttempted: "Ibuprofen, caffeine, rest in dark room",
        treatmentEffectiveness: "Ibuprofen helped slightly, but symptoms persist",
        chronicConditions: "Migraine history, anxiety",
        medicationAllergies: "None known",
        pregnancyStatus: "not_pregnant",
        additionalNotes: "I get migraines monthly but this one is different - the visual symptoms are new and more severe."
      },
      {
        gender: "male",
        age: "67",
        reasonForVisit: "Difficulty breathing and chest tightness",
        problemStartDate: "Started 3 days ago",
        specificTrigger: "Worsened after walking up hill",
        symptomLocation: "Chest, both sides",
        symptomDescription: "Feeling like I can't get enough air, chest feels heavy and tight",
        symptomAggravators: "Physical exertion, lying flat, cold air",
        symptomRelievers: "Sitting up, warm environment, rest",
        severity: "6",
        symptomProgression: "getting_worse",
        selectedSymptoms: ["Shortness of breath", "Chest tightness", "Cough", "Fatigue", "Swollen ankles"],
        treatmentsAttempted: "Inhaler, rest, elevated head while sleeping",
        treatmentEffectiveness: "Inhaler helps temporarily but symptoms return",
        chronicConditions: "COPD, hypertension, diabetes",
        medicationAllergies: "Sulfa drugs - causes rash",
        pregnancyStatus: "not_applicable",
        additionalNotes: "I've been using my inhaler more frequently. My ankles have been swollen for the past week."
      },
      {
        gender: "female",
        age: "28",
        reasonForVisit: "Severe abdominal pain and nausea",
        problemStartDate: "Started 6 hours ago",
        specificTrigger: "After eating spicy food",
        symptomLocation: "Right lower abdomen",
        symptomDescription: "Sharp, cramping pain that comes and goes, getting more constant",
        symptomAggravators: "Movement, deep breathing, pressure on abdomen",
        symptomRelievers: "Lying still, heat pack",
        severity: "8",
        symptomProgression: "getting_worse",
        selectedSymptoms: ["Abdominal pain", "Nausea", "Vomiting", "Fever", "Loss of appetite"],
        treatmentsAttempted: "Pepto-Bismol, heating pad, rest",
        treatmentEffectiveness: "Nothing has helped, pain is getting worse",
        chronicConditions: "None",
        medicationAllergies: "None known",
        pregnancyStatus: "not_pregnant",
        additionalNotes: "I've been vomiting and can't keep food down. The pain started around my belly button and moved to the right side."
      },
      {
        gender: "male",
        age: "54",
        reasonForVisit: "Back pain with leg numbness",
        problemStartDate: "Started 2 weeks ago",
        specificTrigger: "After lifting heavy boxes at work",
        symptomLocation: "Lower back, radiating to right leg",
        symptomDescription: "Sharp pain in lower back with tingling and numbness down right leg",
        symptomAggravators: "Sitting, standing, walking, bending",
        symptomRelievers: "Lying down, heat, gentle stretching",
        severity: "7",
        symptomProgression: "staying_same",
        selectedSymptoms: ["Back pain", "Leg numbness", "Leg weakness", "Difficulty walking", "Muscle spasms"],
        treatmentsAttempted: "Ibuprofen, heat therapy, rest, chiropractor",
        treatmentEffectiveness: "Temporary relief with heat and rest, but pain returns",
        chronicConditions: "Previous back injury, arthritis",
        medicationAllergies: "Codeine - causes nausea",
        pregnancyStatus: "not_applicable",
        additionalNotes: "I can't work because of the pain. The numbness in my leg is getting worse and I'm having trouble walking."
      },
      {
        gender: "female",
        age: "41",
        reasonForVisit: "Dizziness and balance problems",
        problemStartDate: "Started this morning",
        specificTrigger: "When getting out of bed",
        symptomLocation: "Head, general feeling",
        symptomDescription: "Feeling like the room is spinning, unsteady on my feet",
        symptomAggravators: "Moving head, standing up, walking",
        symptomRelievers: "Sitting still, closing eyes",
        severity: "6",
        symptomProgression: "getting_worse",
        selectedSymptoms: ["Dizziness", "Balance problems", "Nausea", "Headache", "Ear ringing"],
        treatmentsAttempted: "Rest, staying hydrated, avoiding sudden movements",
        treatmentEffectiveness: "Rest helps temporarily but symptoms return with movement",
        chronicConditions: "Meniere's disease, anxiety",
        medicationAllergies: "None known",
        pregnancyStatus: "not_pregnant",
        additionalNotes: "I have a history of Meniere's disease but this episode is more severe than usual. I'm having trouble walking without holding onto things."
      },
      {
        gender: "male",
        age: "39",
        reasonForVisit: "Skin rash with itching",
        problemStartDate: "Started 4 days ago",
        specificTrigger: "After using new laundry detergent",
        symptomLocation: "Arms, chest, and back",
        symptomDescription: "Red, raised bumps that are very itchy, some areas are oozing",
        symptomAggravators: "Heat, sweating, scratching",
        symptomRelievers: "Cool water, antihistamine cream",
        severity: "5",
        symptomProgression: "getting_worse",
        selectedSymptoms: ["Skin rash", "Itching", "Redness", "Swelling", "Blisters"],
        treatmentsAttempted: "Hydrocortisone cream, antihistamines, oatmeal bath",
        treatmentEffectiveness: "Cream helps with itching temporarily but rash is spreading",
        chronicConditions: "Eczema, seasonal allergies",
        medicationAllergies: "None known",
        pregnancyStatus: "not_applicable",
        additionalNotes: "I switched to a new laundry detergent and the rash appeared a few days later. It's spreading to new areas."
      },
      {
        gender: "female",
        age: "35",
        reasonForVisit: "Severe fatigue and joint pain",
        problemStartDate: "Started 1 week ago",
        specificTrigger: "After viral infection",
        symptomLocation: "Multiple joints, whole body",
        symptomDescription: "Extreme tiredness with pain in wrists, knees, and shoulders",
        symptomAggravators: "Movement, cold weather, stress",
        symptomRelievers: "Rest, warm baths, gentle massage",
        severity: "6",
        symptomProgression: "getting_worse",
        selectedSymptoms: ["Fatigue", "Joint pain", "Muscle aches", "Fever", "Swollen lymph nodes"],
        treatmentsAttempted: "Rest, ibuprofen, warm baths",
        treatmentEffectiveness: "Rest helps but pain and fatigue persist",
        chronicConditions: "None",
        medicationAllergies: "None known",
        pregnancyStatus: "not_pregnant",
        additionalNotes: "I had a cold last week and these symptoms started after I thought I was getting better. I can barely get out of bed."
      },
      {
        gender: "male",
        age: "61",
        reasonForVisit: "Memory problems and confusion",
        problemStartDate: "Started 2 weeks ago",
        specificTrigger: "Noticed by family members",
        symptomLocation: "Mental/cognitive",
        symptomDescription: "Forgetting recent events, getting lost in familiar places, difficulty finding words",
        symptomAggravators: "Stress, fatigue, unfamiliar situations",
        symptomRelievers: "Routine, familiar environment, rest",
        severity: "7",
        symptomProgression: "getting_worse",
        selectedSymptoms: ["Memory problems", "Confusion", "Difficulty concentrating", "Mood changes", "Sleep problems"],
        treatmentsAttempted: "Memory exercises, maintaining routine, family support",
        treatmentEffectiveness: "Routine helps but symptoms are worsening",
        chronicConditions: "Hypertension, diabetes, family history of dementia",
        medicationAllergies: "None known",
        pregnancyStatus: "not_applicable",
        additionalNotes: "My family is concerned about my memory. I've been getting lost driving to familiar places and forgetting conversations we just had."
      },
      {
        gender: "female",
        age: "26",
        reasonForVisit: "Anxiety and panic attacks",
        problemStartDate: "Started 3 weeks ago",
        specificTrigger: "Work stress and upcoming presentation",
        symptomLocation: "Chest, whole body",
        symptomDescription: "Feeling of impending doom, rapid heartbeat, sweating, trembling",
        symptomAggravators: "Stress, crowds, public speaking",
        symptomRelievers: "Deep breathing, quiet environment, distraction",
        severity: "7",
        symptomProgression: "getting_worse",
        selectedSymptoms: ["Anxiety", "Panic attacks", "Rapid heartbeat", "Sweating", "Trembling"],
        treatmentsAttempted: "Deep breathing exercises, meditation, avoiding triggers",
        treatmentEffectiveness: "Breathing helps during attacks but they're becoming more frequent",
        chronicConditions: "None",
        medicationAllergies: "None known",
        pregnancyStatus: "not_pregnant",
        additionalNotes: "I have a big presentation at work next week and I'm having panic attacks daily. I can't sleep and I'm afraid to leave the house."
      }
    ];

    // Randomly select one of the 10 patients
    const randomIndex = Math.floor(Math.random() * testPatients.length);
    const selectedPatient = testPatients[randomIndex];

    // Fill form with selected patient data
    setGender(selectedPatient.gender);
    setAge(selectedPatient.age);
    setReasonForVisit(selectedPatient.reasonForVisit);
    setProblemStartDate(selectedPatient.problemStartDate);
    setSpecificTrigger(selectedPatient.specificTrigger);
    setSymptomLocation(selectedPatient.symptomLocation);
    setSymptomDescription(selectedPatient.symptomDescription);
    setSymptomAggravators(selectedPatient.symptomAggravators);
    setSymptomRelievers(selectedPatient.symptomRelievers);
    setSeverity(selectedPatient.severity);
    setSymptomProgression(selectedPatient.symptomProgression);
    setSelectedSymptoms(selectedPatient.selectedSymptoms);
    setTreatmentsAttempted(selectedPatient.treatmentsAttempted);
    setTreatmentEffectiveness(selectedPatient.treatmentEffectiveness);
    setChronicConditions(selectedPatient.chronicConditions);
    setMedicationAllergies(selectedPatient.medicationAllergies);
    setPregnancyStatus(selectedPatient.pregnancyStatus);
    setAdditionalNotes(selectedPatient.additionalNotes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate ID if not already generated
      const patientId = deIdentifiedId || generateDeIdentifiedId();

      // Prepare triage data for Ollama AI analysis
      const triageData = {
        patient_id: patientId,
        gender,
        age: parseInt(age) || null,
        chief_complaint: reasonForVisit,
        problem_start_date: problemStartDate,
        specific_trigger: specificTrigger,
        symptom_location: symptomLocation,
        symptom_description: symptomDescription,
        symptom_aggravators: symptomAggravators,
        symptom_relievers: symptomRelievers,
        severity: parseInt(severity),
        symptom_progression: symptomProgression,
        selected_symptoms: selectedSymptoms,
        treatments_attempted: treatmentsAttempted,
        treatment_effectiveness: treatmentEffectiveness,
        chronic_conditions: chronicConditions,
        medication_allergies: medicationAllergies,
        pregnancy_status: pregnancyStatus,
        additional_notes: additionalNotes,
      };

      // Send to Ollama for instant triage processing
      const triageResponse = await fetch("/api/ollama/triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(triageData),
      });

      if (!triageResponse.ok) {
        throw new Error("Triage processing failed");
      }

      const triageResult = await triageResponse.json();

      // Show results immediately (do not block on persistence)
      setTriageResult(triageResult);
      setSubmitted(true);

      // Fire-and-forget: Precompute full triage (P1–P5 HTML) on server to avoid repeated AI calls
      (async () => {
        try {
          const body = {
            patientId,
            age: triageData.age,
            gender: triageData.gender,
            chiefComplaint: triageData.chief_complaint,
            onset: triageData.problem_start_date,
            trigger: triageData.specific_trigger,
            location: triageData.symptom_location,
            quality: triageData.symptom_description,
            aggravatingFactors: triageData.symptom_aggravators,
            relievingFactors: triageData.symptom_relievers,
            severity: triageData.severity,
            timePattern: triageData.symptom_progression,
            associatedSymptoms: (triageData.selected_symptoms || []).join(", "),
            treatmentsTried: triageData.treatments_attempted,
            treatmentResponse: triageData.treatment_effectiveness,
            chronicConditions: triageData.chronic_conditions,
            allergies: triageData.medication_allergies,
            pregnancyBreastfeeding: triageData.pregnancy_status,
            otherNotes: triageData.additional_notes,
          };
          fetch("/api/generate-triage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }).catch(() => {});
        } catch {}
      })();

      // Try to store consultation in Supabase in the background (non-blocking)
      (async () => {
        try {
          // Detect placeholder env and skip
          const url = (import.meta.env.VITE_SUPABASE_URL || "").toString();
          if (!url || url.includes("your-project-id")) {
            console.warn("Skipping Supabase save: VITE_SUPABASE_URL not configured");
            return;
          }

          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 4000); // 4s safety timeout

          // Ensure patient_id is uppercase and properly formatted
          // Map form data to existing database schema
          const consultationData = {
            patient_id: patientId.toUpperCase(), // Ensure uppercase
            chief_complaint: triageData.chief_complaint || "Patient consultation",
            symptoms: triageData.selected_symptoms?.join(", ") || "",
            duration: triageData.problem_start_date || "Unknown",
            severity: triageData.severity || 5,
            current_medications: triageData.treatments_attempted || "",
            allergies: triageData.medication_allergies || "",
            status: "pending", // Use 'pending' instead of 'triaged' to match schema
            // Map to existing database fields
            location: triageData.symptom_location || "",
            trigger: triageData.specific_trigger || "",
            aggravating_factors: triageData.symptom_aggravators || "",
            relieving_factors: triageData.symptom_relievers || "",
            evolution: triageData.symptom_progression || "",
            associated_symptoms: triageData.symptom_description || "",
            treatments_tried: triageData.treatments_attempted || "",
            treatment_response: triageData.treatment_effectiveness || "",
            chronic_conditions: triageData.chronic_conditions || "",
            pregnancy_breastfeeding: triageData.pregnancy_status || "",
            other_notes: triageData.additional_notes || "",
            // Store AI analysis in form_data as JSON
            form_data: {
              triage_level: triageResult.triage_level,
              triage_reasoning: triageResult.reasoning,
              recommended_action: triageResult.recommended_action,
              urgency_score: triageResult.urgency_score,
              ai_analysis: triageResult.full_analysis,
              gender: triageData.gender,
              age: triageData.age,
              problem_start_date: triageData.problem_start_date,
              symptom_description: triageData.symptom_description,
              selected_symptoms: triageData.selected_symptoms
            }
          };

          console.log("Saving consultation with patient_id:", consultationData.patient_id);

          const { data, error } = await supabase
            .from("consultations")
            .insert(consultationData)
            .select();

          clearTimeout(timer);
          if (error) {
            console.warn("Supabase save failed (continuing without persistence):", error.message);
          } else {
            console.log("Consultation saved successfully:", data);
          }
        } catch (e: any) {
          console.warn("Supabase not reachable or timed out (continuing):", e?.message || e);
        }
      })();
    } catch (error: any) {
      console.error("Error submitting consultation:", error);
      alert("Error processing your consultation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    // Parse triage level to match your P1-P5 system
    const level = String(triageResult?.triage_level || "").toUpperCase();

    // Convert to P1-P5 format from your system
    const priorityLevel = (() => {
      switch (level) {
        case "EMERGENCY":
        case "URGENT":
          return "P1";
        case "SEMI-URGENT":
          return "P2";
        case "NON-URGENT":
          return "P3";
        case "SELF-CARE":
          return "P4";
        default:
          return "P3";
      }
    })();

    // Care locations from your system
    const careLocations = {
      P1: "911 (Transport en ambulance requis)",
      P2: "Urgence hospitalière (Transport personnel ou ambulance)",
      P3: "Urgence hospitalière ou urgence mineure",
      P4: "Clinique sans rendez-vous",
      P5: "Clinique avec rendez-vous ou télémédecine",
    };

    const priorityColors = {
      P1: "bg-red-600 text-white",
      P2: "bg-orange-600 text-white",
      P3: "bg-yellow-600 text-black",
      P4: "bg-green-600 text-white",
      P5: "bg-blue-600 text-white",
    };

    // Use HPI summary from triage result or fallback
    const hpiSummary = triageResult?.hpi_summary || "Résumé de consultation généré par l'IA";

    // Generate 10 follow-up questions based on symptoms
    const followUpQuestions = triageResult?.follow_up_questions || [
      "Avez-vous des douleurs thoraciques ou des difficultés respiratoires?",
      "Avez-vous eu de la fièvre dans les dernières 24 heures?",
      "Vos symptômes vous réveillent-ils la nuit?",
      "Avez-vous voyagé récemment?",
      "Prenez-vous des médicaments actuellement?",
      "Avez-vous des antécédents familiaux pertinents?",
      "Votre appétit a-t-il changé?",
      "Avez-vous perdu du poids récemment?",
      "Avez-vous eu des étourdissements ou des pertes de conscience?",
      "Y a-t-il quelque chose d'autre que vous aimeriez mentionner?",
    ];

    return (
      <div className="max-w-4xl mx-auto p-8 print:p-0">
        {/* Main document - printable format */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 print:shadow-none print:border-0 print:p-4">
          {/* Print-only compact header */}
          <div className="hidden print:block text-center mb-3">
            <h2 className="text-lg font-bold">Document de Préparation - {deIdentifiedId}</h2>
          </div>

          {/* Screen version */}
          <div className="print:hidden">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                🏥 Document de Préparation aux Soins
              </h2>
              <p className="text-gray-600">Votre évaluation médicale a été complétée</p>
            </div>

            {/* Patient ID */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
              <p className="text-sm font-medium text-indigo-700 mb-2">
                Identifiant Patient Dé-identifié:
              </p>
              <div className="text-3xl font-mono font-bold text-indigo-600 bg-white p-4 rounded-lg text-center border border-indigo-200">
                {deIdentifiedId}
              </div>
              <p className="text-sm text-indigo-600 mt-2">
                <strong>Conservez cet ID</strong> - Fournissez-le à votre professionnel de santé
              </p>
            </div>

            {/* Priority Level Badge */}
            <div className="text-center mb-6">
              <div
                className={`inline-block px-8 py-4 rounded-lg text-2xl font-bold ${priorityColors[priorityLevel]}`}
              >
                {priorityLevel}
              </div>
              <p className="mt-2 text-lg font-medium">
                Où consulter: {careLocations[priorityLevel]}
              </p>
            </div>
          </div>

          {/* HPI Confirmation Section for Patient */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6 print:bg-white print:border print:border-gray-400 print:p-3 print:mb-3 print:break-inside-avoid">
            <h3 className="font-bold text-lg text-blue-900 mb-4 print:text-sm print:mb-2">
              📋 Résumé de votre consultation - À CONFIRMER
            </h3>
            <div className="bg-white p-4 rounded border border-blue-200 mb-4 print:p-2 print:mb-2 print:text-xs">
              <p className="text-sm leading-relaxed whitespace-pre-line print:text-xs print:leading-tight">
                {hpiSummary}
              </p>
            </div>

            <div className="print:block">
              <p className="font-semibold text-blue-900 mb-3 print:text-xs print:mb-1">
                Cette information est-elle correcte?
              </p>
              <div className="flex gap-8 mb-4 print:gap-4 print:mb-2">
                <label className="flex items-center gap-3 print:gap-1">
                  <input
                    type="checkbox"
                    className="w-5 h-5 print:w-4 print:h-4 print:border-2 print:border-black"
                  />
                  <span className="text-lg font-medium print:text-xs">✓ OUI</span>
                </label>
                <label className="flex items-center gap-3 print:gap-1">
                  <input
                    type="checkbox"
                    className="w-5 h-5 print:w-4 print:h-4 print:border-2 print:border-black"
                  />
                  <span className="text-lg font-medium print:text-xs">✗ NON</span>
                </label>
              </div>

              <div className="mt-4 print:mt-2">
                <p className="font-semibold text-blue-900 mb-2 print:text-xs print:mb-1">
                  Corrections:
                </p>
                <div className="border-2 border-gray-400 rounded p-2 bg-white print:bg-white print:p-1">
                  <div className="h-20 print:h-8">
                    <div className="border-b border-gray-300 h-6 print:h-4"></div>
                    <div className="border-b border-gray-300 h-6 print:hidden"></div>
                    <div className="border-b border-gray-300 h-6 print:hidden"></div>
                    <div className="h-6 print:h-4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 10 Follow-up Questions Section */}
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-6 print:bg-white print:border print:border-gray-400 print:p-3 print:mb-2 print:break-inside-avoid">
            <h3 className="font-bold text-lg text-green-900 mb-4 print:text-sm print:mb-2">
              📝 Questions importantes
            </h3>
            <p className="text-sm text-green-800 mb-4 print:hidden">
              Veuillez répondre à ces questions. Vos réponses aideront le médecin.
            </p>

            <div className="space-y-4 print:space-y-1">
              {followUpQuestions.slice(0, 10).map((question, index) => (
                <div key={index} className="print:break-inside-avoid">
                  <p className="font-medium text-sm mb-2 print:text-xs print:mb-0 print:leading-tight">
                    {index + 1}. {question}
                  </p>
                  <div className="border-2 border-gray-400 rounded p-2 bg-white print:bg-white print:border print:p-0 print:mb-1">
                    <div className="h-12 print:h-5">
                      <div className="border-b border-gray-300 h-6 print:h-5 print:border-0 print:border-b print:border-gray-400"></div>
                      <div className="h-6 print:hidden"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hide these sections in print */}
          <div className="print:hidden">
            {/* Priority Levels Explanation */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-yellow-800 mb-3">
                Explication des niveaux de priorité:
              </h4>
              <div className="text-yellow-800 text-sm space-y-1">
                <p>
                  <strong>P1 (Urgence vitale):</strong> 911 (Transport en ambulance requis)
                </p>
                <p>
                  <strong>P2 (Urgence grave):</strong> Urgence hospitalière (Transport personnel ou
                  ambulance)
                </p>
                <p>
                  <strong>P3 (Urgence modérée):</strong> Urgence hospitalière ou urgence mineure
                </p>
                <p>
                  <strong>P4 (Non urgent):</strong> Clinique sans rendez-vous
                </p>
                <p>
                  <strong>P5 (Consultation régulière):</strong> Clinique avec rendez-vous ou
                  télémédecine
                </p>
              </div>
            </div>

            {/* Warning Signals */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-red-800 mb-3">
                ⚠️ Signaux d'alarme - Consultez immédiatement si:
              </h4>
              <ul className="text-red-800 text-sm space-y-1 ml-4">
                <li>• Aggravation soudaine des symptômes</li>
                <li>• Nouvelle difficulté à respirer</li>
                <li>• Douleur thoracique</li>
                <li>• Confusion ou changement de l'état mental</li>
                <li>• Saignement important</li>
                <li>• Perte de conscience</li>
              </ul>
            </div>

            {/* Instructions for Patient */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg text-amber-900 mb-3">📌 INSTRUCTIONS IMPORTANTES</h3>
              <ol className="list-decimal list-inside space-y-2 text-amber-800">
                <li className="font-medium">Imprimez ce document maintenant</li>
                <li className="font-medium">Confirmez votre résumé médical (cochez OUI ou NON)</li>
                <li className="font-medium">Répondez aux 10 questions À LA MAIN</li>
                <li className="font-medium">Apportez ce document complété à l'urgence</li>
                <li className="font-medium">Remettez-le à l'infirmière de triage</li>
              </ol>
              <div className="mt-4 p-3 bg-white border border-amber-400 rounded">
                <p className="text-sm font-semibold text-amber-900">
                  ⚠️ Ce document facilite votre prise en charge mais ne remplace PAS l'évaluation
                  médicale. En cas d'urgence, appelez le 911.
                </p>
              </div>
            </div>
          </div>

          {/* Print-only simple instructions */}
          <div className="hidden print:block print:mt-2 print:p-2 print:border print:border-gray-400 print:text-xs">
            <p className="font-bold">Instructions: </p>
            <p>1. Confirmez le résumé (cochez OUI ou NON)</p>
            <p>2. Répondez aux questions à la main</p>
            <p>3. Remettez ce document à l'infirmière de triage</p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 print:hidden">
            <Button
              onClick={() => {
                setSubmitted(false);
                setTriageResult(null);
                // Reset all form fields
                setDeIdentifiedId("");
                setGender("");
                setAge("");
                setReasonForVisit("");
                setProblemStartDate("");
                setSpecificTrigger("");
                setSymptomLocation("");
                setSymptomDescription("");
                setSymptomAggravators("");
                setSymptomRelievers("");
                setSeverity("5");
                setSymptomProgression("");
                setSelectedSymptoms([]);
                setTreatmentsAttempted("");
                setTreatmentEffectiveness("");
                setChronicConditions("");
                setMedicationAllergies("");
                setPregnancyStatus("");
                setAdditionalNotes("");
              }}
              variant="outline"
              className="flex-1"
            >
              Nouvelle Consultation
            </Button>

            <Button
              onClick={() => window.print()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-3"
            >
              🖨️ IMPRIMER MAINTENANT
            </Button>
          </div>

          {/* Print-only footer */}
          <div className="hidden print:block print:mt-2 print:text-xs print:text-gray-600">
            <p>
              Date: {new Date().toLocaleDateString("fr-CA")} - ID: {deIdentifiedId}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="space-y-8 bg-white rounded-xl shadow-sm border border-gray-200 p-8"
      >
        {/* Test Data Button - Development Only */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">🧪 Testing Mode</h3>
              <p className="text-xs text-yellow-700 mt-1">
                Click to populate the form with realistic test data for quick Llama 3.1 8B testing
              </p>
            </div>
            <Button
              type="button"
              onClick={fillTestData}
              variant="outline"
              size="sm"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              🚀 Fill Test Data
            </Button>
          </div>
        </div>

        {/* Patient Identification */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">Patient Information</h2>
          </div>

          {/* De-Identified ID Generator */}
          <div className="space-y-3">
            <Label htmlFor="patientId" className="text-sm font-medium text-gray-700">
              De-Identified Patient ID
            </Label>
            <div className="flex gap-3">
              <Input
                id="patientId"
                type="text"
                value={deIdentifiedId}
                readOnly
                placeholder="Click generate to create ID"
                className="flex-1 font-mono text-lg bg-gray-50"
              />
              <Button
                type="button"
                onClick={generateDeIdentifiedId}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700"
              >
                Generate De-Identified Name
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              This unique ID will be used to maintain your privacy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gender */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Gender</Label>
              <RadioGroup
                value={gender}
                onValueChange={setGender}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Age */}
            <div className="space-y-3">
              <Label htmlFor="age" className="text-sm font-medium text-gray-700">
                Age
              </Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age"
                min="0"
                max="120"
              />
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">Medical History</h2>
          </div>

          {/* Reason for visit */}
          <div className="space-y-3">
            <Label htmlFor="reasonForVisit" className="text-sm font-medium text-gray-700">
              Reason for clinic visit <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reasonForVisit"
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              required
              placeholder="What brings you to the clinic today?"
              rows={3}
            />
          </div>

          {/* Problem start date */}
          <div className="space-y-3">
            <Label htmlFor="problemStartDate" className="text-sm font-medium text-gray-700">
              When did this problem start?
            </Label>
            <Input
              id="problemStartDate"
              type="text"
              value={problemStartDate}
              onChange={(e) => setProblemStartDate(e.target.value)}
              placeholder="e.g., 3 days ago, last week, 2 months ago"
            />
          </div>

          {/* Specific trigger */}
          <div className="space-y-3">
            <Label htmlFor="specificTrigger" className="text-sm font-medium text-gray-700">
              Was there a specific trigger or event?
            </Label>
            <Input
              id="specificTrigger"
              type="text"
              value={specificTrigger}
              onChange={(e) => setSpecificTrigger(e.target.value)}
              placeholder="e.g., injury, stress, food, activity"
            />
          </div>

          {/* Symptom location */}
          <div className="space-y-3">
            <Label htmlFor="symptomLocation" className="text-sm font-medium text-gray-700">
              Where is the problem located?
            </Label>
            <Input
              id="symptomLocation"
              type="text"
              value={symptomLocation}
              onChange={(e) => setSymptomLocation(e.target.value)}
              placeholder="e.g., chest, abdomen, head, back"
            />
          </div>

          {/* Symptom description */}
          <div className="space-y-3">
            <Label htmlFor="symptomDescription" className="text-sm font-medium text-gray-700">
              Describe your symptoms in detail
            </Label>
            <Textarea
              id="symptomDescription"
              value={symptomDescription}
              onChange={(e) => setSymptomDescription(e.target.value)}
              placeholder="Please describe your symptoms, how they feel, when they occur..."
              rows={4}
            />
          </div>

          {/* Symptom aggravators */}
          <div className="space-y-3">
            <Label htmlFor="symptomAggravators" className="text-sm font-medium text-gray-700">
              What makes the symptoms worse?
            </Label>
            <Input
              id="symptomAggravators"
              type="text"
              value={symptomAggravators}
              onChange={(e) => setSymptomAggravators(e.target.value)}
              placeholder="e.g., movement, eating, stress, lying down"
            />
          </div>

          {/* Symptom relievers */}
          <div className="space-y-3">
            <Label htmlFor="symptomRelievers" className="text-sm font-medium text-gray-700">
              What makes the symptoms better?
            </Label>
            <Input
              id="symptomRelievers"
              type="text"
              value={symptomRelievers}
              onChange={(e) => setSymptomRelievers(e.target.value)}
              placeholder="e.g., rest, medication, heat, cold"
            />
          </div>

          {/* Severity scale */}
          <div className="space-y-3">
            <Label htmlFor="severity" className="text-sm font-medium text-gray-700">
              Symptom severity (0-10 scale)
            </Label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">0</span>
              <input
                id="severity"
                type="range"
                min="0"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-sm text-gray-500">10</span>
              <div className="bg-blue-600 text-white px-3 py-1 rounded-md font-bold min-w-[3rem] text-center">
                {severity}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>No symptoms</span>
              <span>Moderate</span>
              <span>Worst possible</span>
            </div>
          </div>

          {/* Symptom progression */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              How have your symptoms changed?
            </Label>
            <RadioGroup
              value={symptomProgression}
              onValueChange={setSymptomProgression}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="getting_better" id="getting_better" />
                <Label htmlFor="getting_better">Getting better</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="staying_same" id="staying_same" />
                <Label htmlFor="staying_same">Staying the same</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="getting_worse" id="getting_worse" />
                <Label htmlFor="getting_worse">Getting worse</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="comes_and_goes" id="comes_and_goes" />
                <Label htmlFor="comes_and_goes">Comes and goes</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Symptom Checklist */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">Symptom Checklist</h2>
            <p className="text-sm text-gray-600 mt-1">
              Check all symptoms you are currently experiencing:
            </p>
          </div>

          <div className="space-y-4">
            {Object.entries(symptomsBySystem).map(([systemName, symptoms]) => (
              <div key={systemName} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {symptoms.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={symptom}
                        checked={selectedSymptoms.includes(symptom)}
                        onCheckedChange={(checked) =>
                          handleSymptomChange(symptom, checked as boolean)
                        }
                      />
                      <Label htmlFor={symptom} className="text-sm text-gray-700 cursor-pointer">
                        {symptom}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Treatment History */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">Treatment History</h2>
          </div>

          {/* Treatments attempted */}
          <div className="space-y-3">
            <Label htmlFor="treatmentsAttempted" className="text-sm font-medium text-gray-700">
              What treatments have you tried?
            </Label>
            <Textarea
              id="treatmentsAttempted"
              value={treatmentsAttempted}
              onChange={(e) => setTreatmentsAttempted(e.target.value)}
              placeholder="List any treatments, medications, or home remedies you have tried..."
              rows={3}
            />
          </div>

          {/* Treatment effectiveness */}
          <div className="space-y-3">
            <Label htmlFor="treatmentEffectiveness" className="text-sm font-medium text-gray-700">
              How effective were these treatments?
            </Label>
            <Textarea
              id="treatmentEffectiveness"
              value={treatmentEffectiveness}
              onChange={(e) => setTreatmentEffectiveness(e.target.value)}
              placeholder="Describe how well the treatments worked..."
              rows={2}
            />
          </div>

          {/* Chronic conditions */}
          <div className="space-y-3">
            <Label htmlFor="chronicConditions" className="text-sm font-medium text-gray-700">
              Do you have any chronic conditions or ongoing health problems?
            </Label>
            <Textarea
              id="chronicConditions"
              value={chronicConditions}
              onChange={(e) => setChronicConditions(e.target.value)}
              placeholder="e.g., diabetes, high blood pressure, asthma..."
              rows={2}
            />
          </div>

          {/* Medication allergies */}
          <div className="space-y-3">
            <Label htmlFor="medicationAllergies" className="text-sm font-medium text-gray-700">
              Do you have any medication allergies?
            </Label>
            <Textarea
              id="medicationAllergies"
              value={medicationAllergies}
              onChange={(e) => setMedicationAllergies(e.target.value)}
              placeholder="List any medications you are allergic to and the reaction..."
              rows={2}
            />
          </div>

          {/* Pregnancy status */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Are you currently pregnant or breastfeeding?
            </Label>
            <RadioGroup
              value={pregnancyStatus}
              onValueChange={setPregnancyStatus}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="not_applicable" id="not_applicable" />
                <Label htmlFor="not_applicable">Not applicable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pregnant" id="pregnant" />
                <Label htmlFor="pregnant">Pregnant</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="breastfeeding" id="breastfeeding" />
                <Label htmlFor="breastfeeding">Breastfeeding</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="neither" id="neither" />
                <Label htmlFor="neither">Neither</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Additional notes */}
          <div className="space-y-3">
            <Label htmlFor="additionalNotes" className="text-sm font-medium text-gray-700">
              Additional notes or concerns
            </Label>
            <Textarea
              id="additionalNotes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Anything else you would like the doctor to know..."
              rows={3}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-200">
          <Button
            type="submit"
            disabled={loading || !deIdentifiedId}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Consultation Request"}
          </Button>

          {!deIdentifiedId && (
            <p className="text-sm text-amber-600 text-center mt-3">
              Please generate a De-Identified ID before submitting
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
