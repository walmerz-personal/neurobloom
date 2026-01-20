-- NeuroBloom - Add Circle Exercise Sharing Policies
-- Enables bi-directional exercise sharing: caregivers/medical staff can share with survivors,
-- and care team members can see shared exercises from other members of the same circle

-- =============================================
-- POLICY 1: Survivors can view shared exercises from their care team
-- =============================================
-- When a caregiver or medical staff shares an exercise, survivors connected to them should see it
CREATE POLICY "Survivors can view shared exercises from care team" ON user_exercises
  FOR SELECT USING (
    is_shared_with_care_team = true
    AND EXISTS (
      SELECT 1 FROM care_team_links
      WHERE care_team_links.survivor_id = auth.uid()
        AND (care_team_links.caregiver_id = user_exercises.user_id 
             OR care_team_links.medical_staff_id = user_exercises.user_id)
        AND care_team_links.status = 'accepted'
    )
  );

-- =============================================
-- POLICY 2: Care team members can view shared exercises from circle members
-- =============================================
-- When a caregiver or medical staff shares an exercise, other caregivers/medical staff
-- connected to the same survivors should also see it
CREATE POLICY "Care team can view shared exercises from circle" ON user_exercises
  FOR SELECT USING (
    is_shared_with_care_team = true
    AND EXISTS (
      SELECT 1 FROM care_team_links ctl1
      JOIN care_team_links ctl2 ON ctl1.survivor_id = ctl2.survivor_id
      WHERE ctl1.status = 'accepted' 
        AND ctl2.status = 'accepted'
        AND (ctl1.caregiver_id = auth.uid() OR ctl1.medical_staff_id = auth.uid())
        AND (ctl2.caregiver_id = user_exercises.user_id OR ctl2.medical_staff_id = user_exercises.user_id)
        AND ctl1.survivor_id = ctl2.survivor_id
    )
  );
