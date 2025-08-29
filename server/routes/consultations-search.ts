import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

// Search consultations by patient ID
router.get("/search", async (req, res) => {
  try {
    const { patient_id } = req.query;

    if (!patient_id || typeof patient_id !== "string") {
      return res.status(400).json({ error: "Patient ID is required" });
    }

    // Ensure patient_id is uppercase for consistent searching
    const normalizedPatientId = patient_id.toUpperCase().trim();

    console.log("Searching for consultations with patient_id:", normalizedPatientId);

    // Search for consultations with this patient ID
    const { data: consultations, error } = await supabase
      .from("consultations")
      .select("*")
      .eq("patient_id", normalizedPatientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching consultations:", error);
      return res.status(500).json({ error: "Failed to search consultations" });
    }

    // If no consultations found, return empty array
    if (!consultations || consultations.length === 0) {
      console.log("No consultations found for patient_id:", normalizedPatientId);
      return res.json([]);
    }

    console.log(`Found ${consultations.length} consultations for patient_id:`, normalizedPatientId);

    // Format consultations for frontend display
    const formattedConsultations = consultations.map((consultation) => ({
      id: consultation.id,
      patient_id: consultation.patient_id,
      chief_complaint: consultation.chief_complaint,
      created_at: consultation.created_at,
      triage_level: consultation.triage_level || "P3",
      status: consultation.status || "pending",
      severity: consultation.severity,
      symptoms: consultation.symptoms || consultation.selected_symptoms?.join(", ") || "",
      age: consultation.age,
      gender: consultation.gender,
      chronic_conditions: consultation.chronic_conditions,
      medication_allergies: consultation.medication_allergies,
      ai_analysis: consultation.ai_analysis,
      triage_reasoning: consultation.triage_reasoning,
      recommended_action: consultation.recommended_action,
      urgency_score: consultation.urgency_score,
      // Include all form data
      problem_start_date: consultation.problem_start_date,
      specific_trigger: consultation.specific_trigger,
      symptom_location: consultation.symptom_location,
      symptom_description: consultation.symptom_description,
      symptom_aggravators: consultation.symptom_aggravators,
      symptom_relievers: consultation.symptom_relievers,
      symptom_progression: consultation.symptom_progression,
      treatments_attempted: consultation.treatments_attempted,
      treatment_effectiveness: consultation.treatment_effectiveness,
      pregnancy_status: consultation.pregnancy_status,
      additional_notes: consultation.additional_notes,
    }));

    res.json(formattedConsultations);
  } catch (error) {
    console.error("Error in consultation search:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single consultation by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: consultation, error } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !consultation) {
      return res.status(404).json({ error: "Consultation not found" });
    }

    res.json(consultation);
  } catch (error) {
    console.error("Error fetching consultation:", error);
    res.status(500).json({ error: "Failed to fetch consultation" });
  }
});

// Get recent consultations for dashboard
router.get("/", async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const { data: consultations, error } = await supabase
      .from("consultations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Number(limit));

    if (error) {
      console.error("Error fetching recent consultations:", error);
      return res.status(500).json({ error: "Failed to fetch consultations" });
    }

    // Format consultations for frontend display
    const formattedConsultations = (consultations || []).map((consultation) => ({
      id: consultation.id,
      patient_id: consultation.patient_id,
      chief_complaint: consultation.chief_complaint,
      created_at: consultation.created_at,
      triage_level: consultation.triage_level || "P3",
      status: consultation.status || "pending",
      severity: consultation.severity,
      symptoms: consultation.symptoms || consultation.selected_symptoms?.join(", ") || "",
      age: consultation.age,
      gender: consultation.gender,
    }));

    res.json(formattedConsultations);
  } catch (error) {
    console.error("Error fetching recent consultations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
