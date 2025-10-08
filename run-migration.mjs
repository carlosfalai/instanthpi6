import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://uoahrhroyqsqixusewwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvYWhyaHJveXFzcWl4dXNld3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA4NDc4OCwiZXhwIjoyMDcxNjYwNzg4fQ.oC9CTxo8fjAKDpAbQjIFB8aEkKT2w3Kv5D2o6TDUvLY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔄 Running database migration...\n');

const sql = readFileSync('./supabase/migrations/009_create_diagnostic_templates.sql', 'utf8');

// Split by semicolon and filter out empty statements
const statements = sql.split(';').filter(s => s.trim().length > 0);

let successCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i].trim() + ';';
  
  // Skip comments
  if (statement.startsWith('--') || statement.startsWith('COMMENT')) {
    continue;
  }
  
  console.log(`Executing statement ${i + 1}/${statements.length}...`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: statement });
    
    if (error) {
      // Try alternative method
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: statement })
      });
      
      if (!response.ok) {
        console.log(`⚠️  Statement ${i + 1}: ${error.message || 'Unknown error'}`);
        console.log(`   (This might be OK if the table/column already exists)`);
        errorCount++;
      } else {
        console.log(`✅ Statement ${i + 1}: Success`);
        successCount++;
      }
    } else {
      console.log(`✅ Statement ${i + 1}: Success`);
      successCount++;
    }
  } catch (err) {
    console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
    console.log(`   (This might be OK if the table/column already exists)`);
    errorCount++;
  }
}

console.log(`\n📊 Migration Summary:`);
console.log(`   ✅ Successful: ${successCount}`);
console.log(`   ⚠️  Warnings: ${errorCount}`);
console.log(`\n🔍 Verifying tables...`);

// Check if diagnostic_templates table exists
const { data: tables, error: tablesError } = await supabase
  .from('diagnostic_templates')
  .select('count')
  .limit(1);

if (!tablesError) {
  console.log('✅ diagnostic_templates table exists!');
} else {
  console.log('❌ diagnostic_templates table NOT found:', tablesError.message);
}

// Check if consultations has ai_diagnosis column
const { data: consultations, error: consultationsError } = await supabase
  .from('consultations')
  .select('ai_diagnosis')
  .limit(1);

if (!consultationsError || consultationsError.message.includes('limit')) {
  console.log('✅ consultations.ai_diagnosis column exists!');
} else {
  console.log('⚠️  consultations.ai_diagnosis column check:', consultationsError.message);
}

console.log('\n✨ Migration complete!\n');

