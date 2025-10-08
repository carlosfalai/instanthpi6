import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://uoahrhroyqsqixusewwe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvYWhyaHJveXFzcWl4dXNld3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA4NDc4OCwiZXhwIjoyMDcxNjYwNzg4fQ.oC9CTxo8fjAKDpAbQjIFB8aEkKT2w3Kv5D2o6TDUvLY';

console.log('🔄 Applying diagnostic_templates migration...\n');

const sql = readFileSync('./supabase/migrations/010_create_diagnostic_templates.sql', 'utf8');

// Use fetch to call the SQL endpoint directly
try {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  if (response.ok) {
    console.log('✅ Migration applied successfully!\n');
  } else {
    const error = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', error);
    
    // Try alternative: direct table creation
    console.log('\n🔄 Trying direct approach...\n');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create table directly using admin API
    const createTableSQL = `
CREATE TABLE IF NOT EXISTS diagnostic_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  specialty TEXT,
  diagnosis_name TEXT NOT NULL,
  diagnosis_confidence DECIMAL,
  plan_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

    // Execute via SQL endpoint
    const createResp = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: createTableSQL })
    });
    
    console.log('Create table response:', createResp.status, await createResp.text());
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Verify table exists
console.log('\n🔍 Verifying tables...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const { data, error } = await supabase
  .from('diagnostic_templates')
  .select('count')
  .limit(0);

if (!error) {
  console.log('✅ diagnostic_templates table exists and is accessible!');
} else {
  console.log('Status:', error.message);
}

const { data: consultData, error: consultError } = await supabase
  .from('consultations')
  .select('ai_diagnosis')
  .limit(0);

if (!consultError || consultError.message.includes('is null')) {
  console.log('✅ consultations.ai_diagnosis column exists!');
} else {
  console.log('Consultations check:', consultError.message);
}

console.log('\n✨ Done!\n');

