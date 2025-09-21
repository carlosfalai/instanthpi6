-- Fix RLS policy to allow anonymous form submissions
-- This allows patients to submit forms without authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Patients can create consultations" ON consultations;
DROP POLICY IF EXISTS "Providers can view all consultations" ON consultations;
DROP POLICY IF EXISTS "Providers can update consultations" ON consultations;

-- Create new policies that allow form submissions
CREATE POLICY "Allow anonymous consultations" ON consultations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow viewing consultations" ON consultations
    FOR SELECT USING (true);

CREATE POLICY "Allow updating consultations" ON consultations
    FOR UPDATE USING (true);
