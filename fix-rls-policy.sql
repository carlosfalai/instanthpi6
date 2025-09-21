-- Fix RLS policy to allow anonymous form submissions
-- This allows patients to submit forms without authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Patients can create consultations" ON consultations;

-- Create a new policy that allows anonymous insertions
CREATE POLICY "Allow anonymous consultations" ON consultations
    FOR INSERT WITH CHECK (true);

-- Also ensure the select policy works for authenticated users
DROP POLICY IF EXISTS "Providers can view all consultations" ON consultations;

CREATE POLICY "Providers can view all consultations" ON consultations
    FOR SELECT USING (true);

-- Update policy for updates
DROP POLICY IF EXISTS "Providers can update consultations" ON consultations;

CREATE POLICY "Providers can update consultations" ON consultations
    FOR UPDATE USING (true);
