-- Update the access request RLS policy to include medical staff support
-- This updates the policy created in the previous migration

DROP POLICY IF EXISTS "Caregivers and medical staff can create access requests" ON care_team_links;

-- Recreate policy with medical staff support
CREATE POLICY "Caregivers and medical staff can create access requests" ON care_team_links
  FOR INSERT WITH CHECK (
    survivor_id IS NULL
    AND access_request_token IS NOT NULL
    AND status = 'pending'
    AND (caregiver_id = auth.uid() OR medical_staff_id = auth.uid())
  );
