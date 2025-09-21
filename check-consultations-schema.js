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

async function checkConsultationsSchema() {
  console.log('🔍 Checking consultations table schema...\n');

  try {
    // Try to get the schema by inserting a minimal record
    const minimalRecord = {
      patient_id: 'SCHEMA_TEST',
      created_at: new Date().toISOString(),
    };

    console.log('📝 Testing minimal insert...');
    const { data, error } = await supabase
      .from('consultations')
      .insert(minimalRecord)
      .select();

    if (error) {
      console.error('❌ Minimal insert failed:', error.message);
    } else {
      console.log('✅ Minimal insert successful!');
      console.log('📊 Inserted data:', data);
      
      // Clean up test record
      await supabase
        .from('consultations')
        .delete()
        .eq('patient_id', 'SCHEMA_TEST');
      console.log('🧹 Cleaned up test record');
    }

    // Try to get all records to see the structure
    console.log('\n📋 Getting existing records to see structure...');
    const { data: existing, error: existingError } = await supabase
      .from('consultations')
      .select('*')
      .limit(1);

    if (existingError) {
      console.error('❌ Error getting existing records:', existingError.message);
    } else {
      console.log('✅ Existing records query successful!');
      console.log('📊 Found records:', existing?.length || 0);
      if (existing && existing.length > 0) {
        console.log('📋 Record structure:', Object.keys(existing[0]));
      }
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

checkConsultationsSchema();
