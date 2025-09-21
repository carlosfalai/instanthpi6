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

async function checkClinicsData() {
  console.log('🏥 Checking clinics data...\n');

  try {
    // Check clinics table
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*');

    if (clinicsError) {
      console.error('❌ Error fetching clinics:', clinicsError.message);
    } else {
      console.log(`✅ Found ${clinics?.length || 0} clinics`);
      if (clinics && clinics.length > 0) {
        console.log('\n🏥 Clinics:');
        clinics.forEach((clinic, index) => {
          console.log(`${index + 1}. ID: ${clinic.id}`);
          console.log(`   Name: ${clinic.name || 'N/A'}`);
          console.log(`   Address: ${clinic.address || 'N/A'}`);
          console.log(`   Phone: ${clinic.phone || 'N/A'}`);
          console.log(`   Email: ${clinic.email || 'N/A'}`);
          console.log(`   Created: ${clinic.created_at || 'N/A'}`);
          console.log('');
        });
      }
    }

    // Check physicians table
    const { data: physicians, error: physiciansError } = await supabase
      .from('physicians')
      .select('*');

    if (physiciansError) {
      console.error('❌ Error fetching physicians:', physiciansError.message);
    } else {
      console.log(`✅ Found ${physicians?.length || 0} physicians`);
      if (physicians && physicians.length > 0) {
        console.log('\n👨‍⚕️ Physicians:');
        physicians.forEach((physician, index) => {
          console.log(`${index + 1}. ID: ${physician.id}`);
          console.log(`   Name: ${physician.name || 'N/A'}`);
          console.log(`   Email: ${physician.email || 'N/A'}`);
          console.log(`   Specialty: ${physician.specialty || 'N/A'}`);
          console.log(`   Clinic ID: ${physician.clinic_id || 'N/A'}`);
          console.log(`   Created: ${physician.created_at || 'N/A'}`);
          console.log('');
        });
      }
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

checkClinicsData();
