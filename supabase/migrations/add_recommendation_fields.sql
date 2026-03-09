-- Add affected_side and impairment_severity columns to user_profiles
-- for personalized exercise recommendations

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS affected_side TEXT CHECK (affected_side IN ('left', 'right', 'both', 'unknown')),
  ADD COLUMN IF NOT EXISTS impairment_severity TEXT CHECK (impairment_severity IN ('mild', 'moderate', 'severe'));
