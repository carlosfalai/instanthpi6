-- Migration: Two-Stage AI Medical Documentation System
-- Purpose: Support initial AI call on patient submission + secondary AI call for additional sections

-- Extend consultations table with comprehensive form fields and AI processing flags
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS form_data JSONB;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS trigger_event TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS aggravating_factors TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS relieving_factors TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS evolution TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS associated_symptoms TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS treatments_tried TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS treatment_response TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS chronic_conditions TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS pregnancy_breastfeeding TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS other_notes TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS triage_data JSONB;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS initial_ai_processed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS complete_ai_processed_at TIMESTAMP WITH TIME ZONE;

-- Create table for storing AI-generated medical documentation sections
CREATE TABLE IF NOT EXISTS ai_medical_documentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL,
    
    -- Core documentation sections (generated on patient submission)
    clinical_strategy JSONB, -- Differential diagnosis, red flags, probabilities
    hpi TEXT, -- History of Present Illness confirmation
    soap_note JSONB, -- Subjective, Objective, Assessment, Plan
    follow_up_questions JSONB, -- Array of 10 questions
    medications JSONB, -- Organized by differential diagnosis
    laboratory_tests JSONB, -- Organized by differential diagnosis
    imaging_requisitions JSONB, -- Complete requisitions with clinical details
    specialist_referrals JSONB, -- Complete referral letters
    work_leave_declaration JSONB, -- Dates and justification
    work_modifications JSONB, -- Restrictions and accommodations
    insurance_declaration JSONB, -- ICD codes, severity, prognosis
    
    -- Additional sections (generated on doctor request via "Complete" button)
    preventive_care_suggestions JSONB,
    patient_education_materials JSONB,
    billing_optimization JSONB,
    functional_medicine_approach JSONB,
    mental_health_screening JSONB,
    lifestyle_modifications JSONB,
    alternative_treatments JSONB,
    research_articles JSONB,
    
    -- Metadata
    initial_generation_time_ms INTEGER,
    complete_generation_time_ms INTEGER,
    ai_provider TEXT, -- 'ollama', 'openai', 'anthropic'
    ai_model TEXT,
    language TEXT DEFAULT 'fr',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for doctor documentation preferences
CREATE TABLE IF NOT EXISTS doctor_documentation_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- Will add foreign key when users table exists
    
    -- Default visible sections (shown immediately)
    show_clinical_strategy BOOLEAN DEFAULT true,
    show_hpi BOOLEAN DEFAULT true,
    show_soap BOOLEAN DEFAULT true,
    show_follow_up_questions BOOLEAN DEFAULT true,
    show_medications BOOLEAN DEFAULT true,
    show_laboratory BOOLEAN DEFAULT true,
    show_imaging BOOLEAN DEFAULT true,
    show_referrals BOOLEAN DEFAULT true,
    show_work_leave BOOLEAN DEFAULT false,
    show_work_modifications BOOLEAN DEFAULT false,
    show_insurance_declaration BOOLEAN DEFAULT false,
    
    -- Additional sections (require "Complete" button)
    enable_preventive_care BOOLEAN DEFAULT true,
    enable_patient_education BOOLEAN DEFAULT false,
    enable_billing_optimization BOOLEAN DEFAULT true,
    enable_functional_medicine BOOLEAN DEFAULT false,
    enable_mental_health_screening BOOLEAN DEFAULT true,
    enable_lifestyle_modifications BOOLEAN DEFAULT false,
    enable_alternative_treatments BOOLEAN DEFAULT false,
    enable_research_articles BOOLEAN DEFAULT false,
    
    -- Display preferences
    auto_expand_sections BOOLEAN DEFAULT false,
    show_copy_buttons BOOLEAN DEFAULT true,
    show_ai_confidence BOOLEAN DEFAULT false,
    show_generation_time BOOLEAN DEFAULT false,
    compact_view BOOLEAN DEFAULT false,
    
    -- Template preferences
    medication_include_rationale BOOLEAN DEFAULT true,
    medication_include_warnings BOOLEAN DEFAULT true,
    referral_comprehensive_details BOOLEAN DEFAULT true,
    use_simplified_terminology BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create table for AI processing logs with enhanced tracking
CREATE TABLE IF NOT EXISTS ai_processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL,
    command TEXT NOT NULL, -- 'initial_documentation', 'complete_documentation', 'triage', etc.
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    processing_stage TEXT, -- 'initial' or 'complete'
    ai_provider TEXT,
    ai_model TEXT,
    processing_time_ms INTEGER,
    token_count INTEGER,
    cost_estimate DECIMAL(10, 4),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_medical_documentation_consultation_id ON ai_medical_documentation(consultation_id);
CREATE INDEX IF NOT EXISTS idx_ai_medical_documentation_patient_id ON ai_medical_documentation(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_documentation_preferences_user_id ON doctor_documentation_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_consultation_id ON ai_processing_logs(consultation_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_patient_id ON ai_processing_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_created_at ON ai_processing_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE ai_medical_documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_documentation_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_medical_documentation
CREATE POLICY "Providers can view all documentation" ON ai_medical_documentation
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert documentation" ON ai_medical_documentation
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update documentation" ON ai_medical_documentation
    FOR UPDATE WITH CHECK (true);

-- RLS Policies for doctor_documentation_preferences
CREATE POLICY "Doctors can view own preferences" ON doctor_documentation_preferences
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Doctors can update own preferences" ON doctor_documentation_preferences
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert preferences" ON doctor_documentation_preferences
    FOR INSERT WITH CHECK (true);

-- RLS Policies for ai_processing_logs
CREATE POLICY "Providers can view logs" ON ai_processing_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert logs" ON ai_processing_logs
    FOR INSERT WITH CHECK (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_ai_documentation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating timestamps
CREATE TRIGGER update_ai_medical_documentation_updated_at
    BEFORE UPDATE ON ai_medical_documentation
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_documentation_updated_at();

CREATE TRIGGER update_doctor_documentation_preferences_updated_at
    BEFORE UPDATE ON doctor_documentation_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_documentation_updated_at();

-- Function to get or create default preferences for a doctor
CREATE OR REPLACE FUNCTION get_or_create_doctor_preferences(p_user_id INTEGER)
RETURNS doctor_documentation_preferences AS $$
DECLARE
    v_preferences doctor_documentation_preferences;
BEGIN
    -- Try to get existing preferences
    SELECT * INTO v_preferences
    FROM doctor_documentation_preferences
    WHERE user_id = p_user_id;
    
    -- If not found, create default preferences
    IF NOT FOUND THEN
        INSERT INTO doctor_documentation_preferences (user_id)
        VALUES (p_user_id)
        RETURNING * INTO v_preferences;
    END IF;
    
    RETURN v_preferences;
END;
$$ LANGUAGE plpgsql;

-- View for consultation with AI documentation status
CREATE OR REPLACE VIEW consultation_documentation_status AS
SELECT 
    c.id,
    c.patient_id,
    c.chief_complaint,
    c.severity,
    c.status,
    c.created_at,
    c.initial_ai_processed_at,
    c.complete_ai_processed_at,
    CASE 
        WHEN c.initial_ai_processed_at IS NOT NULL THEN 'processed'
        ELSE 'pending'
    END as initial_ai_status,
    CASE 
        WHEN c.complete_ai_processed_at IS NOT NULL THEN 'processed'
        WHEN c.initial_ai_processed_at IS NOT NULL THEN 'available'
        ELSE 'not_available'
    END as complete_ai_status,
    amd.id as documentation_id,
    amd.ai_provider,
    amd.ai_model,
    amd.language
FROM consultations c
LEFT JOIN ai_medical_documentation amd ON c.id = amd.consultation_id
ORDER BY c.created_at DESC;

-- Sample data for testing (commented out for production)
/*
-- Insert sample doctor preferences
INSERT INTO doctor_documentation_preferences (user_id, show_work_leave, show_insurance_declaration, enable_functional_medicine)
VALUES 
    (1, true, true, true),
    (2, false, false, false)
ON CONFLICT (user_id) DO NOTHING;
*/
