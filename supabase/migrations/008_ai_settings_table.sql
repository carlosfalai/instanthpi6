-- Create AI Settings table for doctor-specific AI provider configuration
CREATE TABLE ai_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL, -- The doctor who owns these settings
  hpi_confirmation_enabled BOOLEAN DEFAULT true,
  differential_diagnosis_enabled BOOLEAN DEFAULT true,
  follow_up_questions_enabled BOOLEAN DEFAULT true,
  preventative_care_enabled BOOLEAN DEFAULT true,
  labwork_suggestions_enabled BOOLEAN DEFAULT true,
  in_person_referral_enabled BOOLEAN DEFAULT true,
  prescription_suggestions_enabled BOOLEAN DEFAULT true,
  medical_notes_draft_enabled BOOLEAN DEFAULT true,
  pending_items_tracking_enabled BOOLEAN DEFAULT true,
  billing_optimization_enabled BOOLEAN DEFAULT true,
  functional_medicine_enabled BOOLEAN DEFAULT false,
  
  -- AI Model Configuration
  preferred_ai_provider TEXT DEFAULT 'openai', -- 'openai' or 'claude'
  openai_api_key TEXT, -- Doctor's OpenAI API key (encrypted)
  claude_api_key TEXT, -- Doctor's Claude API key (encrypted)
  openai_model TEXT DEFAULT 'gpt-4o', -- OpenAI model to use
  claude_model TEXT DEFAULT 'claude-3-5-sonnet-20241022', -- Claude model to use
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one settings record per user
  UNIQUE(user_id)
);

-- Create index for faster lookups by user_id
CREATE INDEX idx_ai_settings_user_id ON ai_settings(user_id);

-- Add Row Level Security
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own AI settings
CREATE POLICY "Users can access their own AI settings" ON ai_settings
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Add comments for documentation
COMMENT ON TABLE ai_settings IS 'Per-doctor AI configuration settings including provider preferences and API keys';
COMMENT ON COLUMN ai_settings.preferred_ai_provider IS 'The AI provider the doctor prefers to use (openai or claude)';
COMMENT ON COLUMN ai_settings.openai_api_key IS 'Doctor''s personal OpenAI API key (should be encrypted at application level)';
COMMENT ON COLUMN ai_settings.claude_api_key IS 'Doctor''s personal Claude API key (should be encrypted at application level)';