-- Medical Templates Management System
-- Allows doctors to enable/disable templates per case type

CREATE TABLE IF NOT EXISTS medical_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    physician_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template metadata
    template_name TEXT NOT NULL,
    template_category TEXT NOT NULL, -- 'soap_note', 'work_leave', 'patient_message', 'case_discussion', 'imaging_requisition', 'specialist_referral'
    template_type TEXT NOT NULL, -- 'soap_style_1', 'soap_style_2', etc.
    case_type TEXT, -- 'gastroenteritis', 'cough', 'cystitis', etc. - NULL means applies to all
    
    -- Template content
    template_content TEXT NOT NULL,
    
    -- Display preferences
    is_enabled BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Default template for this category/case_type
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique default per category/case_type per physician
    UNIQUE(physician_id, template_category, template_type, case_type)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_medical_templates_physician ON medical_templates(physician_id);
CREATE INDEX IF NOT EXISTS idx_medical_templates_category ON medical_templates(template_category, case_type);
CREATE INDEX IF NOT EXISTS idx_medical_templates_enabled ON medical_templates(physician_id, is_enabled, template_category);

-- Enable RLS
ALTER TABLE medical_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Doctors can only access their own templates
CREATE POLICY "Doctors can access their own templates" ON medical_templates
    FOR ALL USING (auth.uid() = physician_id);

-- Insert default templates for new doctors (will be created via application logic)
-- Templates are stored in the application and can be copied to user's profile

COMMENT ON TABLE medical_templates IS 'Medical documentation templates that doctors can enable/disable per case type';
COMMENT ON COLUMN medical_templates.template_category IS 'Category: soap_note, work_leave, patient_message, case_discussion, imaging_requisition, specialist_referral';
COMMENT ON COLUMN medical_templates.template_type IS 'Specific template identifier within category';
COMMENT ON COLUMN medical_templates.case_type IS 'Specific medical case type this template applies to (NULL = all cases)';
COMMENT ON COLUMN medical_templates.is_default IS 'Whether this is the default template for this category/case_type';

