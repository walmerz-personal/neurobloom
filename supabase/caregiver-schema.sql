-- NeuroBloom Caregiver Coordination Schema
-- Run this in Supabase SQL Editor to add care team linking

-- =============================================
-- CARE TEAM LINKS TABLE
-- =============================================
-- Links survivors with their caregivers for progress sharing
CREATE TABLE IF NOT EXISTS care_team_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survivor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  relationship TEXT CHECK (relationship IN ('spouse', 'child', 'parent', 'sibling', 'friend', 'professional', 'other')),
  permissions JSONB DEFAULT '{"viewProgress": true, "viewExercises": true, "viewNotes": false}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invitation_code TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  UNIQUE(survivor_id, caregiver_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_care_team_survivor ON care_team_links(survivor_id, status);
CREATE INDEX IF NOT EXISTS idx_care_team_caregiver ON care_team_links(caregiver_id, status);
CREATE INDEX IF NOT EXISTS idx_care_team_invitation ON care_team_links(invitation_code) WHERE invitation_code IS NOT NULL;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE care_team_links ENABLE ROW LEVEL SECURITY;

-- Survivors can view their own care team links
CREATE POLICY "Survivors can view their care team" ON care_team_links
  FOR SELECT USING (auth.uid() = survivor_id);

-- Caregivers can view links where they are the caregiver
CREATE POLICY "Caregivers can view their links" ON care_team_links
  FOR SELECT USING (auth.uid() = caregiver_id);

-- Survivors can create invitations (insert links)
CREATE POLICY "Survivors can create invitations" ON care_team_links
  FOR INSERT WITH CHECK (auth.uid() = survivor_id);

-- Survivors can update their own links (manage permissions, remove)
CREATE POLICY "Survivors can update their links" ON care_team_links
  FOR UPDATE USING (auth.uid() = survivor_id);

-- Caregivers can update links to accept/decline invitations
CREATE POLICY "Caregivers can accept/decline invitations" ON care_team_links
  FOR UPDATE USING (auth.uid() = caregiver_id AND status = 'pending');

-- Survivors can delete their own links
CREATE POLICY "Survivors can delete links" ON care_team_links
  FOR DELETE USING (auth.uid() = survivor_id);

-- Caregivers can remove themselves from a link
CREATE POLICY "Caregivers can remove themselves" ON care_team_links
  FOR DELETE USING (auth.uid() = caregiver_id);

-- =============================================
-- CAREGIVER ACCESS TO SURVIVOR DATA
-- =============================================
-- Allow caregivers to view daily_logs of linked survivors

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Caregivers can view linked survivor logs" ON daily_logs;

-- Create policy for caregivers to view linked survivors' daily logs
CREATE POLICY "Caregivers can view linked survivor logs" ON daily_logs
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM care_team_links 
      WHERE care_team_links.survivor_id = daily_logs.user_id 
      AND care_team_links.caregiver_id = auth.uid()
      AND care_team_links.status = 'accepted'
    )
  );

-- Allow caregivers to view basic user data of linked survivors
DROP POLICY IF EXISTS "Caregivers can view linked survivor profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

CREATE POLICY "Users can view own profile or linked survivors" ON users
  FOR SELECT USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM care_team_links 
      WHERE care_team_links.survivor_id = users.id 
      AND care_team_links.caregiver_id = auth.uid()
      AND care_team_links.status = 'accepted'
    )
  );

-- Allow caregivers to view user_profiles of linked survivors
DROP POLICY IF EXISTS "Users can view own user_profile" ON user_profiles;

CREATE POLICY "Users can view own or linked survivor profile" ON user_profiles
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM care_team_links 
      WHERE care_team_links.survivor_id = user_profiles.user_id 
      AND care_team_links.caregiver_id = auth.uid()
      AND care_team_links.status = 'accepted'
    )
  );

-- =============================================
-- PUBLIC ACCESS FOR INVITATION LOOKUP
-- =============================================
-- Allow anyone (authenticated) to look up an invitation by code
-- This is needed for the invitation acceptance flow

CREATE OR REPLACE FUNCTION get_invitation_by_code(code TEXT)
RETURNS TABLE (
  id UUID,
  survivor_id UUID,
  survivor_name TEXT,
  relationship TEXT,
  status TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.survivor_id,
    u.name as survivor_name,
    c.relationship,
    c.status
  FROM care_team_links c
  JOIN users u ON c.survivor_id = u.id
  WHERE c.invitation_code = code;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- HELPER FUNCTION: Generate Invitation Code
-- =============================================
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these to verify the schema was created correctly

-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'care_team_links';

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'care_team_links';

-- Check indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'care_team_links';
