-- Create doctor_credentials table for storing encrypted API credentials
CREATE TABLE IF NOT EXISTS doctor_credentials (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Spruce Health credentials (encrypted)
  spruce_access_id TEXT,
  spruce_api_key TEXT,
  
  -- AI Provider credentials (encrypted)
  openai_api_key TEXT,
  claude_api_key TEXT,
  preferred_ai_provider TEXT CHECK (preferred_ai_provider IN ('openai', 'claude', 'none')) DEFAULT 'none',
  
  -- Onboarding status
  onboarding_completed BOOLEAN DEFAULT false,
  credentials_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one credential set per user
  UNIQUE(user_id)
);

-- Create index for faster user lookups
CREATE INDEX idx_doctor_credentials_user_id ON doctor_credentials(user_id);

-- Enable Row Level Security
ALTER TABLE doctor_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own credentials
CREATE POLICY "Users can view their own credentials" 
  ON doctor_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials" 
  ON doctor_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials" 
  ON doctor_credentials
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials" 
  ON doctor_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_doctor_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER doctor_credentials_updated_at
  BEFORE UPDATE ON doctor_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_doctor_credentials_updated_at();

-- Add comments for documentation
COMMENT ON TABLE doctor_credentials IS 'Stores encrypted API credentials for each doctor including Spruce Health and AI providers';
COMMENT ON COLUMN doctor_credentials.spruce_access_id IS 'Encrypted Spruce Health access ID for SMS messaging';
COMMENT ON COLUMN doctor_credentials.spruce_api_key IS 'Encrypted Spruce Health API key';
COMMENT ON COLUMN doctor_credentials.openai_api_key IS 'Encrypted OpenAI API key (optional)';
COMMENT ON COLUMN doctor_credentials.claude_api_key IS 'Encrypted Claude API key (optional)';
COMMENT ON COLUMN doctor_credentials.preferred_ai_provider IS 'Which AI provider the doctor prefers to use';
COMMENT ON COLUMN doctor_credentials.onboarding_completed IS 'Whether the doctor has completed the initial setup';
COMMENT ON COLUMN doctor_credentials.credentials_verified IS 'Whether the credentials have been tested and verified';
