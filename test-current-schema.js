#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCurrentSchema() {
  console.log("🔍 Testing current consultations table schema...\n");

  // Try to insert a minimal record with just the required fields
  const minimalRecord = {
    patient_id: "SCHEMA_TEST_123",
    chief_complaint: "Test complaint",
    symptoms: "Test symptoms",
    duration: "1 day",
    severity: 5,
  };

  try {
    console.log("📝 Testing minimal insert with required fields...");
    const { data, error } = await supabase.from("consultations").insert(minimalRecord).select();

    if (error) {
      console.error("❌ Minimal insert failed:", error.message);
      console.error("Error details:", error);
    } else {
      console.log("✅ Minimal insert successful!");
      console.log("📊 Inserted data:", data);

      // Clean up test record
      await supabase.from("consultations").delete().eq("patient_id", "SCHEMA_TEST_123");
      console.log("🧹 Cleaned up test record");
    }

    // Now test with the form data structure
    console.log("\n📝 Testing form data structure...");
    const formData = {
      patient_id: "FORM_TEST_456",
      chief_complaint: "Chest pain",
      symptoms: "Chest pain, shortness of breath",
      duration: "2 hours",
      severity: 8,
      // Try adding the extra fields that the form wants to save
      gender: "male",
      age: 35,
      problem_start_date: "2 hours ago",
      specific_trigger: "After physical exertion",
      symptom_location: "Left side of chest",
      symptom_description: "Sharp, stabbing pain",
      symptom_aggravators: "Deep breathing",
      symptom_relievers: "Rest",
      symptom_progression: "Getting worse",
      selected_symptoms: "Chest pain, Shortness of breath, Nausea",
      treatments_attempted: "Rest",
      treatment_effectiveness: "Slight improvement",
      chronic_conditions: "Hypertension",
      medication_allergies: "None",
      pregnancy_status: "N/A",
      additional_notes: "Patient is worried",
      triage_level: "URGENT",
      triage_reasoning: "Chest pain with risk factors",
      recommended_action: "Immediate evaluation",
      urgency_score: 8,
      ai_analysis: "Patient requires urgent evaluation",
      status: "triaged",
    };

    const { data: formDataResult, error: formDataError } = await supabase
      .from("consultations")
      .insert(formData)
      .select();

    if (formDataError) {
      console.error("❌ Form data insert failed:", formDataError.message);
      console.error("Error details:", formDataError);
    } else {
      console.log("✅ Form data insert successful!");
      console.log("📊 Inserted form data:", formDataResult);

      // Clean up test record
      await supabase.from("consultations").delete().eq("patient_id", "FORM_TEST_456");
      console.log("🧹 Cleaned up form test record");
    }
  } catch (error) {
    console.error("❌ General error:", error.message);
  }
}

testCurrentSchema();
