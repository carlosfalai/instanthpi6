-- Create patient_answers table to store patient responses to triage questions
CREATE TABLE IF NOT EXISTS patient_answers (
  id SERIAL PRIMARY KEY,
  patient_id VARCHAR(50) NOT NULL,
  answers JSONB NOT NULL,
  hpi_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_patient_answers_patient_id ON patient_answers(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_answers_created_at ON patient_answers(created_at);

-- Add RLS policy
ALTER TABLE patient_answers ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read patient answers
CREATE POLICY "Authenticated users can read patient answers" ON patient_answers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for service role to insert patient answers
CREATE POLICY "Service role can insert patient answers" ON patient_answers
  FOR INSERT WITH CHECK (true);

-- Policy for service role to update patient answers
CREATE POLICY "Service role can update patient answers" ON patient_answers
  FOR UPDATE USING (true);
