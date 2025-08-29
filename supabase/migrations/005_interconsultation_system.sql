-- Interconsultation System for InstantHPI Medical Network

-- Specialist profiles with their custom templates
CREATE TABLE IF NOT EXISTS specialist_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    physician_id UUID REFERENCES physicians(id),
    specialty TEXT NOT NULL,
    sub_specialty TEXT,
    title TEXT,
    credentials TEXT,
    languages JSONB DEFAULT '["French", "English"]'::jsonb,
    availability_status TEXT DEFAULT 'available', -- 'available', 'busy', 'offline'
    response_time_hours INTEGER DEFAULT 24,
    accepts_referrals BOOLEAN DEFAULT true,
    bio TEXT,
    expertise_areas TEXT[],
    hospital_affiliations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral templates that specialists define for their needs
CREATE TABLE IF NOT EXISTS referral_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialist_id UUID REFERENCES specialist_profiles(id),
    template_name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    required_sections JSONB NOT NULL DEFAULT '{
        "chief_complaint": true,
        "hpi": true,
        "medications": true,
        "allergies": true,
        "past_medical_history": true,
        "social_history": false,
        "family_history": false,
        "review_of_systems": false,
        "physical_exam": false,
        "labs": false,
        "imaging": false,
        "assessment_plan": true
    }'::jsonb,
    custom_questions JSONB DEFAULT '[]'::jsonb,
    priority_conditions TEXT[],
    excluded_conditions TEXT[],
    minimum_info_requirements TEXT,
    preferred_format TEXT DEFAULT 'structured', -- 'structured', 'narrative', 'soap'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interconsultation requests between doctors
CREATE TABLE IF NOT EXISTS interconsultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id),
    patient_id TEXT NOT NULL,
    
    -- Referring physician
    referring_physician_id UUID REFERENCES physicians(id),
    referring_clinic_id UUID REFERENCES clinics(id),
    
    -- Consulting specialist
    consulting_specialist_id UUID REFERENCES specialist_profiles(id),
    template_used_id UUID REFERENCES referral_templates(id),
    
    -- Request details
    urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('urgent', 'semi-urgent', 'routine')),
    reason_for_referral TEXT NOT NULL,
    specific_questions TEXT[],
    
    -- Generated content based on specialist's template
    formatted_referral JSONB NOT NULL,
    ai_generated_summary TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'reviewing', 'completed', 'declined', 'cancelled')),
    accepted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Response from specialist
    specialist_response TEXT,
    specialist_recommendations JSONB,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_timeline TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Specialist availability schedule
CREATE TABLE IF NOT EXISTS specialist_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialist_id UUID REFERENCES specialist_profiles(id),
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT true,
    max_consultations_per_day INTEGER DEFAULT 10
);

-- Communication thread for interconsultations
CREATE TABLE IF NOT EXISTS interconsultation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interconsultation_id UUID REFERENCES interconsultations(id),
    sender_id UUID REFERENCES physicians(id),
    message TEXT NOT NULL,
    attachments JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral network connections (who refers to whom)
CREATE TABLE IF NOT EXISTS referral_network (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referring_physician_id UUID REFERENCES physicians(id),
    specialist_id UUID REFERENCES specialist_profiles(id),
    referral_count INTEGER DEFAULT 0,
    last_referral_date TIMESTAMP WITH TIME ZONE,
    average_response_time_hours NUMERIC,
    satisfaction_rating NUMERIC CHECK (satisfaction_rating >= 0 AND satisfaction_rating <= 5),
    is_preferred BOOLEAN DEFAULT false,
    notes TEXT
);

-- Sample templates will be created through the application interface

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_specialist_profiles_physician ON specialist_profiles(physician_id);
CREATE INDEX IF NOT EXISTS idx_specialist_profiles_specialty ON specialist_profiles(specialty);
CREATE INDEX IF NOT EXISTS idx_referral_templates_specialist ON referral_templates(specialist_id);
CREATE INDEX IF NOT EXISTS idx_interconsultations_referring ON interconsultations(referring_physician_id);
CREATE INDEX IF NOT EXISTS idx_interconsultations_consulting ON interconsultations(consulting_specialist_id);
CREATE INDEX IF NOT EXISTS idx_interconsultations_status ON interconsultations(status);
CREATE INDEX IF NOT EXISTS idx_interconsultation_messages_consultation ON interconsultation_messages(interconsultation_id);

-- RLS Policies
ALTER TABLE specialist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interconsultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE interconsultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_network ENABLE ROW LEVEL SECURITY;

-- Policies for specialist profiles
CREATE POLICY "Specialists manage own profile" ON specialist_profiles
    FOR ALL USING (physician_id = auth.uid());

CREATE POLICY "All physicians can view specialist profiles" ON specialist_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for referral templates
CREATE POLICY "Specialists manage own templates" ON referral_templates
    FOR ALL USING (
        specialist_id IN (
            SELECT id FROM specialist_profiles WHERE physician_id = auth.uid()
        )
    );

CREATE POLICY "All physicians can view templates" ON referral_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for interconsultations
CREATE POLICY "Physicians see own referrals" ON interconsultations
    FOR SELECT USING (
        referring_physician_id = auth.uid() OR
        consulting_specialist_id IN (
            SELECT id FROM specialist_profiles WHERE physician_id = auth.uid()
        )
    );

-- Function to format referral based on specialist template
CREATE OR REPLACE FUNCTION format_referral_for_specialist(
    p_consultation_id UUID,
    p_specialist_id UUID,
    p_template_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_template referral_templates%ROWTYPE;
    v_consultation consultations%ROWTYPE;
    v_formatted_referral JSONB;
BEGIN
    -- Get template
    SELECT * INTO v_template FROM referral_templates WHERE id = p_template_id;
    
    -- Get consultation data
    SELECT * INTO v_consultation FROM consultations WHERE id = p_consultation_id;
    
    -- Build formatted referral based on template requirements
    v_formatted_referral := jsonb_build_object(
        'patient_id', v_consultation.patient_id,
        'referral_date', NOW(),
        'template_used', v_template.template_name
    );
    
    -- Add required sections
    IF v_template.required_sections->>'chief_complaint' = 'true' THEN
        v_formatted_referral := v_formatted_referral || 
            jsonb_build_object('chief_complaint', v_consultation.chief_complaint);
    END IF;
    
    IF v_template.required_sections->>'hpi' = 'true' THEN
        v_formatted_referral := v_formatted_referral || 
            jsonb_build_object('hpi', v_consultation.clinical_notes->'hpi');
    END IF;
    
    IF v_template.required_sections->>'medications' = 'true' THEN
        v_formatted_referral := v_formatted_referral || 
            jsonb_build_object('current_medications', v_consultation.current_medications);
    END IF;
    
    IF v_template.required_sections->>'allergies' = 'true' THEN
        v_formatted_referral := v_formatted_referral || 
            jsonb_build_object('allergies', v_consultation.allergies);
    END IF;
    
    -- Add custom questions section
    v_formatted_referral := v_formatted_referral || 
        jsonb_build_object('custom_questions', v_template.custom_questions);
    
    RETURN v_formatted_referral;
END;
$$ LANGUAGE plpgsql;

-- Function to notify specialist of new referral
CREATE OR REPLACE FUNCTION notify_specialist_new_referral()
RETURNS TRIGGER AS $$
BEGIN
    -- This would integrate with your notification system
    -- For now, just update the referral network
    INSERT INTO referral_network (
        referring_physician_id,
        specialist_id,
        referral_count,
        last_referral_date
    ) VALUES (
        NEW.referring_physician_id,
        NEW.consulting_specialist_id,
        1,
        NOW()
    )
    ON CONFLICT (referring_physician_id, specialist_id) 
    DO UPDATE SET
        referral_count = referral_network.referral_count + 1,
        last_referral_date = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_specialist
    AFTER INSERT ON interconsultations
    FOR EACH ROW
    EXECUTE FUNCTION notify_specialist_new_referral();