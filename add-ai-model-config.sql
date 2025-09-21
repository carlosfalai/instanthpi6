-- Add AI model configuration fields to ai_settings table
ALTER TABLE ai_settings 
ADD COLUMN IF NOT EXISTS preferred_ai_provider TEXT DEFAULT 'openai' CHECK (preferred_ai_provider IN ('openai', 'claude')),
ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
ADD COLUMN IF NOT EXISTS claude_api_key TEXT,
ADD COLUMN IF NOT EXISTS openai_model TEXT DEFAULT 'gpt-4o',
ADD COLUMN IF NOT EXISTS claude_model TEXT DEFAULT 'claude-3-5-sonnet-20241022';

-- Add comments for documentation
COMMENT ON COLUMN ai_settings.preferred_ai_provider IS 'The AI provider to use for medical analysis (openai or claude)';
COMMENT ON COLUMN ai_settings.openai_api_key IS 'OpenAI API key for the doctor (encrypted in production)';
COMMENT ON COLUMN ai_settings.claude_api_key IS 'Claude API key for the doctor (encrypted in production)';
COMMENT ON COLUMN ai_settings.openai_model IS 'OpenAI model to use (e.g., gpt-4o, gpt-4-turbo)';
COMMENT ON COLUMN ai_settings.claude_model IS 'Claude model to use (e.g., claude-3-5-sonnet-20241022, claude-3-opus-20240229)';
