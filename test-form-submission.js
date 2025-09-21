#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFormSubmission() {
  console.log('🧪 Testing patient form submission...\n');

  // Generate a test patient ID
  const testPatientId = 'TEST123456';
  
  const testConsultation = {
    patient_id: testPatientId,
    gender: "male",
    age: 35,
    chief_complaint: "Douleur thoracique",
    problem_start_date: "Il y a 2 heures",
    specific_trigger: "Après un effort physique",
    symptom_location: "Côté gauche de la poitrine",
    symptom_description: "Douleur aiguë et lancinante",
    symptom_aggravators: "Respiration profonde",
    symptom_relievers: "Repos",
    severity: 8,
    symptom_progression: "S'aggrave",
    selected_symptoms: ["Douleur thoracique", "Essoufflement", "Nausées"],
    treatments_attempted: "Repos",
    treatment_effectiveness: "Légère amélioration",
    chronic_conditions: "Hypertension",
    medication_allergies: "Aucune",
    pregnancy_status: "N/A",
    additional_notes: "Patient inquiet",
    triage_level: "URGENT",
    triage_reasoning: "Douleur thoracique avec facteurs de risque",
    recommended_action: "Évaluation immédiate",
    urgency_score: 8,
    ai_analysis: "Patient nécessite une évaluation urgente",
    symptoms: "Douleur thoracique, Essoufflement, Nausées",
    status: "triaged",
    created_at: new Date().toISOString(),
  };

  try {
    console.log('📝 Inserting test consultation...');
    const { data, error } = await supabase
      .from('consultations')
      .insert(testConsultation)
      .select();

    if (error) {
      console.error('❌ Error inserting consultation:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Test consultation inserted successfully!');
      console.log('📊 Inserted data:', data);
    }

    // Now test retrieval
    console.log('\n🔍 Testing retrieval...');
    const { data: retrieved, error: retrieveError } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', testPatientId);

    if (retrieveError) {
      console.error('❌ Error retrieving consultation:', retrieveError.message);
    } else {
      console.log('✅ Retrieved consultations:', retrieved?.length || 0);
      if (retrieved && retrieved.length > 0) {
        console.log('📋 Retrieved data:', retrieved[0]);
      }
    }

    // Test the doctor dashboard query
    console.log('\n👨‍⚕️ Testing doctor dashboard query...');
    const { data: dashboardData, error: dashboardError } = await supabase
      .from('consultations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (dashboardError) {
      console.error('❌ Error with dashboard query:', dashboardError.message);
    } else {
      console.log('✅ Dashboard query successful!');
      console.log('📊 Total consultations for dashboard:', dashboardData?.length || 0);
      if (dashboardData && dashboardData.length > 0) {
        console.log('📋 Recent consultations:');
        dashboardData.forEach((consultation, index) => {
          console.log(`  ${index + 1}. Patient ID: ${consultation.patient_id}`);
          console.log(`     Chief Complaint: ${consultation.chief_complaint}`);
          console.log(`     Status: ${consultation.status}`);
          console.log(`     Triage Level: ${consultation.triage_level}`);
          console.log('');
        });
      }
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

testFormSubmission();
