#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFormWithAnonKey() {
  console.log('🧪 Testing form submission with anon key (like the frontend)...\n');

  // Generate a test patient ID
  const testPatientId = 'TEST123456';
  
  // Simulate the form data structure that matches the database schema
  const consultationData = {
    patient_id: testPatientId,
    chief_complaint: "Chest pain",
    symptoms: "Chest pain, Shortness of breath, Nausea",
    duration: "2 hours ago",
    severity: 8,
    current_medications: "Rest",
    allergies: "None",
    status: "pending",
    // Map to existing database fields
    location: "Left side of chest",
    trigger: "After physical exertion",
    aggravating_factors: "Deep breathing",
    relieving_factors: "Rest",
    evolution: "Getting worse",
    associated_symptoms: "Sharp, stabbing pain",
    treatments_tried: "Rest",
    treatment_response: "Slight improvement",
    chronic_conditions: "Hypertension",
    pregnancy_breastfeeding: "N/A",
    other_notes: "Patient is worried",
    // Store AI analysis in form_data as JSON
    form_data: {
      triage_level: "URGENT",
      triage_reasoning: "Chest pain with risk factors",
      recommended_action: "Immediate evaluation",
      urgency_score: 8,
      ai_analysis: "Patient requires urgent evaluation",
      gender: "male",
      age: 35,
      problem_start_date: "2 hours ago",
      symptom_description: "Sharp, stabbing pain",
      selected_symptoms: ["Chest pain", "Shortness of breath", "Nausea"]
    }
  };

  try {
    console.log('📝 Inserting test consultation with anon key...');
    const { data, error } = await supabase
      .from('consultations')
      .insert(consultationData)
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
        console.log('📋 Form data (AI analysis):', retrieved[0].form_data);
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
          console.log(`     Severity: ${consultation.severity}`);
          if (consultation.form_data?.triage_level) {
            console.log(`     Triage Level: ${consultation.form_data.triage_level}`);
          }
          console.log('');
        });
      }
    }

    // Clean up test record
    console.log('\n🧹 Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('consultations')
      .delete()
      .eq('patient_id', testPatientId);

    if (deleteError) {
      console.error('❌ Error deleting test record:', deleteError.message);
    } else {
      console.log('✅ Test record cleaned up successfully!');
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

testFormWithAnonKey();
