-- Create consultations table for patient intake
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT NOT NULL UNIQUE, -- The 10-character de-identified ID (e.g., A1B2C3D4E5)
    chief_complaint TEXT NOT NULL,
    symptoms TEXT NOT NULL,
    duration TEXT NOT NULL,
    severity INTEGER CHECK (severity >= 1 AND severity <= 10),
    current_medications TEXT,
    allergies TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_provider_id UUID,
    provider_notes TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consultation_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_assigned_provider ON consultations(assigned_provider_id);

-- Enable Row Level Security
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Policies for consultations
-- Patients can create and view their own consultations using their patient_id
CREATE POLICY "Patients can create consultations" ON consultations
    FOR INSERT WITH CHECK (true);

-- Authenticated users (providers) can view all consultations
CREATE POLICY "Providers can view all consultations" ON consultations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Providers can update consultations
CREATE POLICY "Providers can update consultations" ON consultations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create a view for provider dashboard
CREATE OR REPLACE VIEW consultation_summary AS
SELECT 
    c.id,
    c.patient_id,
    c.chief_complaint,
    c.severity,
    c.status,
    c.created_at,
    c.assigned_provider_id,
    CASE 
        WHEN c.created_at > NOW() - INTERVAL '24 hours' THEN 'urgent'
        WHEN c.severity >= 8 THEN 'high'
        WHEN c.severity >= 5 THEN 'medium'
        ELSE 'low'
    END as priority
FROM consultations c
ORDER BY 
    CASE c.status 
        WHEN 'pending' THEN 1 
        WHEN 'in_progress' THEN 2 
        ELSE 3 
    END,
    c.severity DESC,
    c.created_at ASC;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_consultation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the updated_at field
CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_consultation_updated_at();