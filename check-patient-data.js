#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPatientData() {
  console.log('🔍 Checking for patient submissions in InstantHPI database...\n');

  try {
    // Check consultations table
    console.log('📋 Checking consultations table...');
    const { data: consultations, error: consultationsError } = await supabase
      .from('consultations')
      .select('*')
      .order('created_at', { ascending: false });

    if (consultationsError) {
      console.error('❌ Error fetching consultations:', consultationsError.message);
    } else {
      console.log(`✅ Found ${consultations?.length || 0} consultations`);
      if (consultations && consultations.length > 0) {
        console.log('\n📊 Recent consultations:');
        consultations.slice(0, 5).forEach((consultation, index) => {
          console.log(`${index + 1}. Patient ID: ${consultation.patient_id}`);
          console.log(`   Chief Complaint: ${consultation.chief_complaint || 'N/A'}`);
          console.log(`   Created: ${consultation.created_at}`);
          console.log(`   Status: ${consultation.status || 'N/A'}`);
          console.log(`   Triage Level: ${consultation.triage_level || 'N/A'}`);
          console.log('');
        });
      }
    }

    // Check form submissions table
    console.log('📝 Checking form submissions table...');
    const { data: formSubmissions, error: formError } = await supabase
      .from('form_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (formError) {
      console.error('❌ Error fetching form submissions:', formError.message);
    } else {
      console.log(`✅ Found ${formSubmissions?.length || 0} form submissions`);
      if (formSubmissions && formSubmissions.length > 0) {
        console.log('\n📊 Recent form submissions:');
        formSubmissions.slice(0, 5).forEach((submission, index) => {
          console.log(`${index + 1}. Patient ID: ${submission.patient_id}`);
          console.log(`   Form Type: ${submission.form_type || 'N/A'}`);
          console.log(`   Submitted: ${submission.submitted_at}`);
          console.log('');
        });
      }
    }

    // Check physician profiles
    console.log('👨‍⚕️ Checking physician profiles...');
    const { data: physicians, error: physicianError } = await supabase
      .from('physician_profiles')
      .select('*');

    if (physicianError) {
      console.error('❌ Error fetching physician profiles:', physicianError.message);
    } else {
      console.log(`✅ Found ${physicians?.length || 0} physician profiles`);
      if (physicians && physicians.length > 0) {
        console.log('\n👨‍⚕️ Physician profiles:');
        physicians.forEach((physician, index) => {
          console.log(`${index + 1}. Physician ID: ${physician.physician_id}`);
          console.log(`   Email: ${physician.email || 'N/A'}`);
          console.log(`   Specialty: ${physician.specialty || 'N/A'}`);
          console.log('');
        });
      }
    }

    // Check if tables exist
    console.log('🗄️ Checking table structure...');
    const tables = ['consultations', 'form_submissions', 'physician_profiles', 'patients'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}' - Error: ${error.message}`);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' - Exception: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

checkPatientData();
