-- Allow survivors to view the user profiles of their linked caregivers
-- Without this, the caregiver name join in getCareTeamLinks returns null → shows "Unknown"
CREATE POLICY "Survivors can view linked caregiver profiles" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM care_team_links
      WHERE care_team_links.caregiver_id = users.id
      AND care_team_links.survivor_id = auth.uid()
      AND care_team_links.status = 'accepted'
    )
  );