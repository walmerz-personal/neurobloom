-- NeuroBloom - Allow caregivers and medical staff to view linked survivors' progress data
--
-- Problem: When a caregiver/medical staff views a connected survivor's progress screen,
-- day streak, check-in rate, 14-day averages, and recent check-ins show as zero because
-- RLS on daily_logs (and user_profiles) only allowed "own" rows. The policies that
-- grant access to linked survivors' data existed only in standalone schema files
-- (caregiver-schema.sql, medical-staff-schema.sql), not in migrations.
--
-- Fix: Add SELECT policies so linked caregivers/medical staff can read the survivor's
-- daily_logs and user_profiles. Idempotent: drops older policy names if present.

-- =============================================
-- daily_logs: allow viewing linked survivor logs
-- =============================================
DROP POLICY IF EXISTS "Caregivers can view linked survivor logs" ON daily_logs;
CREATE POLICY "Caregivers and medical staff can view linked survivor logs" ON daily_logs
  FOR SELECT USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM care_team_links
      WHERE care_team_links.survivor_id = daily_logs.user_id
      AND (care_team_links.caregiver_id = auth.uid() OR care_team_links.medical_staff_id = auth.uid())
      AND care_team_links.status = 'accepted'
    )
  );

-- =============================================
-- user_profiles: allow viewing linked survivor profile
-- =============================================
-- Additive only: do not drop "Users can view own user_profile" or any existing
-- "own or linked" policy. This policy lets caregivers/medical staff read a linked
-- survivor's profile (stroke_date, goals, etc.).
DROP POLICY IF EXISTS "Caregivers and medical staff can view linked survivor profiles" ON user_profiles;
CREATE POLICY "Caregivers and medical staff can view linked survivor profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM care_team_links
      WHERE care_team_links.survivor_id = user_profiles.user_id
      AND (care_team_links.caregiver_id = auth.uid() OR care_team_links.medical_staff_id = auth.uid())
      AND care_team_links.status = 'accepted'
    )
  );
