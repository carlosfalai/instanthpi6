-- Update consultations table to match the form data structure
-- This will add all the missing columns that the form is trying to save

-- Add missing columns to consultations table
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS problem_start_date TEXT,
ADD COLUMN IF NOT EXISTS specific_trigger TEXT,
ADD COLUMN IF NOT EXISTS symptom_location TEXT,
ADD COLUMN IF NOT EXISTS symptom_description TEXT,
ADD COLUMN IF NOT EXISTS symptom_aggravators TEXT,
ADD COLUMN IF NOT EXISTS symptom_relievers TEXT,
ADD COLUMN IF NOT EXISTS symptom_progression TEXT,
ADD COLUMN IF NOT EXISTS selected_symptoms TEXT,
ADD COLUMN IF NOT EXISTS treatments_attempted TEXT,
ADD COLUMN IF NOT EXISTS treatment_effectiveness TEXT,
ADD COLUMN IF NOT EXISTS chronic_conditions TEXT,
ADD COLUMN IF NOT EXISTS medication_allergies TEXT,
ADD COLUMN IF NOT EXISTS pregnancy_status TEXT,
ADD COLUMN IF NOT EXISTS additional_notes TEXT,
ADD COLUMN IF NOT EXISTS triage_level TEXT,
ADD COLUMN IF NOT EXISTS triage_reasoning TEXT,
ADD COLUMN IF NOT EXISTS recommended_action TEXT,
ADD COLUMN IF NOT EXISTS urgency_score INTEGER,
ADD COLUMN IF NOT EXISTS ai_analysis TEXT;

-- Update the existing columns to match form expectations
-- Change duration to problem_start_date (they're similar concepts)
-- symptoms column already exists, so we'll keep it

-- Make chief_complaint nullable since it might not always be provided
ALTER TABLE consultations ALTER COLUMN chief_complaint DROP NOT NULL;

-- Update the consultation_summary view to include new fields
DROP VIEW IF EXISTS consultation_summary;

CREATE OR REPLACE VIEW consultation_summary AS
SELECT 
    c.id,
    c.patient_id,
    c.chief_complaint,
    c.symptoms,
    c.severity,
    c.urgency_score,
    c.triage_level,
    c.status,
    c.created_at,
    c.assigned_provider_id,
    c.gender,
    c.age,
    c.problem_start_date,
    c.symptom_description,
    c.chronic_conditions,
    c.medication_allergies,
    c.ai_analysis,
    CASE 
        WHEN c.created_at > NOW() - INTERVAL '24 hours' THEN 'urgent'
        WHEN c.urgency_score >= 8 OR c.severity >= 8 THEN 'high'
        WHEN c.urgency_score >= 5 OR c.severity >= 5 THEN 'medium'
        ELSE 'low'
    END as priority
FROM consultations c
ORDER BY 
    CASE c.status 
        WHEN 'pending' THEN 1 
        WHEN 'in_progress' THEN 2 
        ELSE 3 
    END,
    COALESCE(c.urgency_score, c.severity, 0) DESC,
    c.created_at ASC;
