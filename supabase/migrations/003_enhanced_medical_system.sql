-- Enhanced medical system with clinic separation and AI processing

-- Clinics table
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Physicians table
CREATE TABLE IF NOT EXISTS physicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    specialty TEXT,
    license_number TEXT,
    clinic_id UUID REFERENCES clinics(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update consultations table with new fields
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS assigned_physician_id UUID REFERENCES physicians(id);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS form_data JSONB;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS clinical_notes JSONB;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS ai_transcriptions JSONB;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS trigger TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS aggravating_factors TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS relieving_factors TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS evolution TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS associated_symptoms TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS treatments_tried TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS treatment_response TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS chronic_conditions TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS pregnancy_breastfeeding TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS other_notes TEXT;

-- AI Processing logs
CREATE TABLE IF NOT EXISTS ai_processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id),
    physician_id UUID REFERENCES physicians(id),
    command TEXT NOT NULL,
    template_used TEXT,
    input_data JSONB,
    output_data JSONB,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id),
    patient_id TEXT NOT NULL,
    physician_id UUID REFERENCES physicians(id),
    referral_type TEXT NOT NULL, -- 'PT', 'OT', 'Social', 'Specialist', etc.
    referral_text TEXT NOT NULL,
    urgency TEXT DEFAULT 'routine',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample clinics
INSERT INTO clinics (name, code, address, phone, email) VALUES
    ('Clinique Centrale', 'CLIN01', '123 Rue Principale, Montréal', '514-555-0001', 'centrale@instanthpi.ca'),
    ('Centre Médical Nord', 'CLIN02', '456 Boulevard Nord, Laval', '450-555-0002', 'nord@instanthpi.ca'),
    ('Urgences Est', 'CLIN03', '789 Avenue Est, Longueuil', '450-555-0003', 'est@instanthpi.ca')
ON CONFLICT (code) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consultations_clinic ON consultations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_consultations_physician ON consultations(assigned_physician_id);
CREATE INDEX IF NOT EXISTS idx_physicians_clinic ON physicians(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_consultation ON ai_processing_logs(consultation_id);
CREATE INDEX IF NOT EXISTS idx_referrals_consultation ON referrals(consultation_id);

-- RLS Policies for new tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE physicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Physicians can see their clinic's data
CREATE POLICY "Physicians see own clinic" ON consultations
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM physicians 
            WHERE id = auth.uid()
        )
    );

-- Physicians can update consultations in their clinic
CREATE POLICY "Physicians update own clinic consultations" ON consultations
    FOR UPDATE USING (
        clinic_id IN (
            SELECT clinic_id FROM physicians 
            WHERE id = auth.uid()
        )
    );

-- Public policies for demo (adjust for production)
CREATE POLICY "Public read clinics" ON clinics
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users are physicians" ON physicians
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Physicians manage AI logs" ON ai_processing_logs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Physicians manage referrals" ON referrals
    FOR ALL USING (auth.role() = 'authenticated');