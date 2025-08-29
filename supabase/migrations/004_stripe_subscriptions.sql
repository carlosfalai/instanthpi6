-- Physician subscription management
CREATE TABLE IF NOT EXISTS physician_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    clinic_id UUID REFERENCES clinics(id),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    plan_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment history
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_invoice_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    amount INTEGER,
    currency TEXT DEFAULT 'cad',
    status TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Physician preferences with output settings
CREATE TABLE IF NOT EXISTS physician_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    physician_id UUID UNIQUE,
    output_preferences JSONB DEFAULT '{
        "showClinicalStrategy": true,
        "showHPI": true,
        "showSOAP": true,
        "showFollowUpQuestions": true,
        "showMedications": true,
        "showLaboratory": true,
        "showImaging": true,
        "showReferrals": true,
        "showWorkLeave": true,
        "showWorkModifications": true,
        "showInsuranceDeclaration": true,
        "includeRationale": true,
        "includeDifferentialDiagnosis": true,
        "includeRedFlags": true,
        "medicationWarnings": true,
        "language": "fr",
        "medicalTerminology": "standard"
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    physician_id UUID,
    clinic_id UUID,
    action_type TEXT, -- 'report_generated', 'ai_command', 'export', etc.
    patient_id TEXT,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON physician_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON physician_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON physician_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_customer ON payment_history(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_physician ON usage_tracking(physician_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_clinic ON usage_tracking(clinic_id);

-- RLS Policies
ALTER TABLE physician_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE physician_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Subscription policies
CREATE POLICY "Users can view own subscription" ON physician_subscriptions
    FOR SELECT USING (email = current_user);

CREATE POLICY "Service role manages subscriptions" ON physician_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Preferences policies
CREATE POLICY "Physicians manage own preferences" ON physician_preferences
    FOR ALL USING (physician_id = auth.uid());

-- Usage tracking policies
CREATE POLICY "Physicians view own usage" ON usage_tracking
    FOR SELECT USING (physician_id = auth.uid());

-- Function to check subscription validity
CREATE OR REPLACE FUNCTION check_subscription_valid(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM physician_subscriptions
        WHERE email = p_email
        AND status = 'active'
        AND current_period_end > NOW()
    );
END;
$$ LANGUAGE plpgsql;