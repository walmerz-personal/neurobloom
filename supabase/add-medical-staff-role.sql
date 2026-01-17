-- Add medical_staff_role column to user_profiles table
-- Run this in the Supabase SQL Editor

-- Add medical_staff_role column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'medical_staff_role'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN medical_staff_role TEXT 
        CHECK (medical_staff_role IN (
            'occupational_therapist',
            'speech_language_pathologist',
            'physical_therapist',
            'psychologist',
            'psychiatrist',
            'nurse',
            'other'
        ) OR medical_staff_role IS NULL);
        
        COMMENT ON COLUMN user_profiles.medical_staff_role IS 
        'Specific role for medical staff (OT, SLP, PT, Psychologist, Psychiatrist, Nurse, or Other). Only set for users with role = medical_staff.';
    END IF;
END $$;

-- Create index for queries filtering by medical staff role
CREATE INDEX IF NOT EXISTS idx_user_profiles_medical_staff_role 
ON user_profiles(medical_staff_role) 
WHERE medical_staff_role IS NOT NULL;

-- Migrate any existing data from preferences JSONB to the new column
-- This handles cases where data was previously stored in preferences
UPDATE user_profiles
SET medical_staff_role = preferences->>'medical_staff_role'
WHERE preferences->>'medical_staff_role' IS NOT NULL
AND medical_staff_role IS NULL;

-- Verify the migration
SELECT 
    COUNT(*) as total_profiles,
    COUNT(medical_staff_role) as profiles_with_role,
    medical_staff_role,
    COUNT(*) as count
FROM user_profiles
WHERE medical_staff_role IS NOT NULL
GROUP BY medical_staff_role
ORDER BY count DESC;
