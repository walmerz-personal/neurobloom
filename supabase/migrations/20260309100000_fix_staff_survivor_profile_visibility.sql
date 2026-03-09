-- Allow medical staff to view the user profiles of their linked survivors
-- Without this, the survivor name join in getCareTeamLinks returns null → shows "Unknown" on staff home
CREATE POLICY "Medical staff can view linked survivor profiles" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM care_team_links
      WHERE care_team_links.survivor_id = users.id
      AND care_team_links.medical_staff_id = auth.uid()
      AND care_team_links.status = 'accepted'
    )
  );

-- Allow survivors to view the user profiles of their linked medical staff
-- Without this, the medical_staff name join in getCareTeamLinks returns null → shows "Unknown" in Health Data Sharing
CREATE POLICY "Survivors can view linked medical staff profiles" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM care_team_links
      WHERE care_team_links.medical_staff_id = users.id
      AND care_team_links.survivor_id = auth.uid()
      AND care_team_links.status = 'accepted'
    )
  );
