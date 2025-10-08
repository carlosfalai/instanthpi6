-- Create writing_style_templates table for doctor's personal writing preferences
CREATE TABLE IF NOT EXISTS writing_style_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL, -- 'referrals', 'sap_note', 'patient_message', 'imaging', 'medications', etc.
  template_text TEXT NOT NULL, -- Doctor's instructions for how they want this section written
  example_text TEXT, -- Optional example of their preferred style
  tone TEXT, -- 'professional', 'casual', 'spartan', 'detailed'
  language TEXT DEFAULT 'french',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(physician_id, section_name)
);

-- Indexes
CREATE INDEX idx_writing_templates_physician ON writing_style_templates(physician_id);
CREATE INDEX idx_writing_templates_section ON writing_style_templates(section_name);

-- RLS
ALTER TABLE writing_style_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Physicians can view their own writing templates"
  ON writing_style_templates FOR SELECT
  USING (auth.uid() = physician_id);

CREATE POLICY "Physicians can insert their own writing templates"
  ON writing_style_templates FOR INSERT
  WITH CHECK (auth.uid() = physician_id);

CREATE POLICY "Physicians can update their own writing templates"
  ON writing_style_templates FOR UPDATE
  USING (auth.uid() = physician_id);

CREATE POLICY "Physicians can delete their own writing templates"
  ON writing_style_templates FOR DELETE
  USING (auth.uid() = physician_id);

COMMENT ON TABLE writing_style_templates IS 'Stores physician writing style preferences for different medical documentation sections';
COMMENT ON COLUMN writing_style_templates.template_text IS 'Instructions for AI: "Always include urgency, be concise, use bullet points, etc."';
COMMENT ON COLUMN writing_style_templates.example_text IS 'Example of desired output style for this section';

