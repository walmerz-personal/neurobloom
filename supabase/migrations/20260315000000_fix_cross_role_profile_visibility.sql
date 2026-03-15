-- NeuroBloom - Fix cross-role profile visibility on users table
--
-- Consolidates all SELECT policies for viewing own + linked profiles into one.
-- Fixes "Unknown" patient/survivor/caregiver names on medical staff and caregiver home screens.
-- Idempotent: drops known policy names then creates the single comprehensive policy.
--
-- If supabase db push fails due to migration history, run this file in
-- Supabase Dashboard > SQL Editor.

-- Drop all existing SELECT policies that may have been created in fragments
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile or linked survivors" ON users;
DROP POLICY IF EXISTS "Medical staff can view linked survivor profiles" ON users;
DROP POLICY IF EXISTS "Survivors can view linked medical staff profiles" ON users;
DROP POLICY IF EXISTS "Survivors can view linked caregiver profiles" ON users;

-- Single policy: own profile + caregivers/medical staff see linked survivors, survivors see linked caregivers/medical staff
CREATE POLICY "Users can view own and linked profiles" ON users
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM care_team_links c
      WHERE c.status = 'accepted'
      AND (
        (c.survivor_id = users.id AND (c.caregiver_id = auth.uid() OR c.medical_staff_id = auth.uid()))
        OR (c.survivor_id = auth.uid() AND (c.caregiver_id = users.id OR c.medical_staff_id = users.id))
      )
    )
  );
