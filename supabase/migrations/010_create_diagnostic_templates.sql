-- Create diagnostic_templates table
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

-- Add indexes
CREATE INDEX idx_diagnostic_templates_physician ON diagnostic_templates(physician_id);
CREATE INDEX idx_diagnostic_templates_diagnosis ON diagnostic_templates(diagnosis_name);
CREATE INDEX idx_diagnostic_templates_specialty ON diagnostic_templates(specialty);

-- Enable RLS
ALTER TABLE diagnostic_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Physicians can view their own templates"
  ON diagnostic_templates FOR SELECT
  USING (auth.uid() = physician_id OR is_shared = true);

CREATE POLICY "Physicians can insert their own templates"
  ON diagnostic_templates FOR INSERT
  WITH CHECK (auth.uid() = physician_id);

CREATE POLICY "Physicians can update their own templates"
  ON diagnostic_templates FOR UPDATE
  USING (auth.uid() = physician_id);

CREATE POLICY "Physicians can delete their own templates"
  ON diagnostic_templates FOR DELETE
  USING (auth.uid() = physician_id);

-- Add column to consultations for AI diagnosis prediction
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS ai_diagnosis JSONB;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS ai_diagnosis_generated_at TIMESTAMPTZ;

COMMENT ON TABLE diagnostic_templates IS 'Stores physician-created plan templates for different diagnoses';
COMMENT ON COLUMN diagnostic_templates.plan_items IS 'Array of plan items: [{category: "medication", item: "Albuterol nebulizer", selected: false}, ...]';
COMMENT ON COLUMN consultations.ai_diagnosis IS 'AI-generated diagnosis predictions: [{diagnosis: "RSV", confidence: 0.85, reasoning: "..."}]';

