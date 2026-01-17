-- NeuroBloom Medical Staff Schema
-- Run this in Supabase SQL Editor to add medical staff functionality

-- =============================================
-- EXTEND CARE TEAM LINKS TABLE
-- =============================================
-- Add medical_staff_id column to support medical staff linking
ALTER TABLE care_team_links 
ADD COLUMN IF NOT EXISTS medical_staff_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Update relationship CHECK to include medical staff types
ALTER TABLE care_team_links
DROP CONSTRAINT IF EXISTS care_team_links_relationship_check;

ALTER TABLE care_team_links
ADD CONSTRAINT care_team_links_relationship_check 
CHECK (relationship IN ('spouse', 'child', 'parent', 'sibling', 'friend', 'professional', 'pt', 'ot', 'slp', 'other'));

-- Add constraint: ensure either caregiver_id OR medical_staff_id is set (not both, not neither)
ALTER TABLE care_team_links
DROP CONSTRAINT IF EXISTS care_team_links_role_check;

ALTER TABLE care_team_links
ADD CONSTRAINT care_team_links_role_check
CHECK (
  (caregiver_id IS NOT NULL AND medical_staff_id IS NULL) OR
  (caregiver_id IS NULL AND medical_staff_id IS NOT NULL)
);

-- Update unique constraint to support both caregiver and medical staff
ALTER TABLE care_team_links
DROP CONSTRAINT IF EXISTS care_team_links_survivor_id_caregiver_id_key;

-- Create unique index for caregiver links
CREATE UNIQUE INDEX IF NOT EXISTS care_team_links_survivor_caregiver_unique 
ON care_team_links(survivor_id, caregiver_id) 
WHERE caregiver_id IS NOT NULL;

-- Create unique index for medical staff links
CREATE UNIQUE INDEX IF NOT EXISTS care_team_links_survivor_medical_staff_unique 
ON care_team_links(survivor_id, medical_staff_id) 
WHERE medical_staff_id IS NOT NULL;

-- Add index for medical staff queries
CREATE INDEX IF NOT EXISTS idx_care_team_medical_staff ON care_team_links(medical_staff_id, status);

-- =============================================
-- EXERCISE ASSIGNMENTS TABLE
-- =============================================
-- Stores exercises assigned by medical staff to survivors
CREATE TABLE IF NOT EXISTS exercise_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survivor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  assigned_by_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  exercise_id TEXT NOT NULL, -- Built-in ID (e.g., 'a1', 'l2') or custom UUID
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('built_in', 'custom')),
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE, -- Optional due date
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'skipped')),
  notes TEXT, -- Optional notes from medical staff
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(survivor_id, exercise_id, assigned_date) -- One assignment per exercise per day per survivor
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_survivor ON exercise_assignments(survivor_id, status);
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_assigned_by ON exercise_assignments(assigned_by_id);
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_status ON exercise_assignments(status);
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_due_date ON exercise_assignments(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_exercise ON exercise_assignments(exercise_id, exercise_type);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE exercise_assignments ENABLE ROW LEVEL SECURITY;

-- Survivors can view their own assignments
CREATE POLICY "Survivors can view own assignments" ON exercise_assignments
  FOR SELECT USING (auth.uid() = survivor_id);

-- Medical staff can create assignments for linked survivors
CREATE POLICY "Medical staff can create assignments" ON exercise_assignments
  FOR INSERT WITH CHECK (
    auth.uid() = assigned_by_id
    AND EXISTS (
      SELECT 1 FROM care_team_links 
      WHERE care_team_links.survivor_id = exercise_assignments.survivor_id 
      AND care_team_links.medical_staff_id = auth.uid()
      AND care_team_links.status = 'accepted'
    )
  );

-- Medical staff can view assignments they created
CREATE POLICY "Medical staff can view own assignments" ON exercise_assignments
  FOR SELECT USING (auth.uid() = assigned_by_id);

-- Medical staff can update assignments they created
CREATE POLICY "Medical staff can update own assignments" ON exercise_assignments
  FOR UPDATE USING (auth.uid() = assigned_by_id);

-- Caregivers can view assignments for linked survivors (read-only)
CREATE POLICY "Caregivers can view linked survivor assignments" ON exercise_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM care_team_links 
      WHERE care_team_links.survivor_id = exercise_assignments.survivor_id 
      AND care_team_links.caregiver_id = auth.uid()
      AND care_team_links.status = 'accepted'
    )
  );

-- Survivors can update assignment status (completed/skipped)
CREATE POLICY "Survivors can update assignment status" ON exercise_assignments
  FOR UPDATE USING (
    auth.uid() = survivor_id
    AND status IN ('assigned', 'completed', 'skipped')
  );

-- =============================================
-- UPDATE CARE TEAM LINKS RLS POLICIES
-- =============================================
-- Medical staff can view links where they are the medical staff
DROP POLICY IF EXISTS "Medical staff can view their links" ON care_team_links;
CREATE POLICY "Medical staff can view their links" ON care_team_links
  FOR SELECT USING (auth.uid() = medical_staff_id);

-- Update survivor policy to allow creating medical staff invitations
-- (Already covered by "Survivors can create invitations" policy)

-- Medical staff can update links to accept/decline invitations
DROP POLICY IF EXISTS "Medical staff can accept/decline invitations" ON care_team_links;
CREATE POLICY "Medical staff can accept/decline invitations" ON care_team_links
  FOR UPDATE USING (auth.uid() = medical_staff_id AND status = 'pending');

-- Medical staff can remove themselves from a link
DROP POLICY IF EXISTS "Medical staff can remove themselves" ON care_team_links;
CREATE POLICY "Medical staff can remove themselves" ON care_team_links
  FOR DELETE USING (auth.uid() = medical_staff_id);

-- =============================================
-- UPDATE EXISTING RLS POLICIES FOR MEDICAL STAFF ACCESS
-- =============================================
-- Update daily_logs policy to include medical staff
DROP POLICY IF EXISTS "Caregivers can view linked survivor logs" ON daily_logs;
CREATE POLICY "Caregivers and medical staff can view linked survivor logs" ON daily_logs
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM care_team_links 
      WHERE care_team_links.survivor_id = daily_logs.user_id 
      AND (
        (care_team_links.caregiver_id = auth.uid() OR care_team_links.medical_staff_id = auth.uid())
      )
      AND care_team_links.status = 'accepted'
    )
  );

-- Update users policy to include medical staff
DROP POLICY IF EXISTS "Users can view own profile or linked survivors" ON users;
CREATE POLICY "Users can view own profile or linked survivors" ON users
  FOR SELECT USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM care_team_links 
      WHERE care_team_links.survivor_id = users.id 
      AND (
        (care_team_links.caregiver_id = auth.uid() OR care_team_links.medical_staff_id = auth.uid())
      )
      AND care_team_links.status = 'accepted'
    )
  );

-- Update user_profiles policy to include medical staff
DROP POLICY IF EXISTS "Users can view own or linked survivor profile" ON user_profiles;
CREATE POLICY "Users can view own or linked survivor profile" ON user_profiles
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM care_team_links 
      WHERE care_team_links.survivor_id = user_profiles.user_id 
      AND (
        (care_team_links.caregiver_id = auth.uid() OR care_team_links.medical_staff_id = auth.uid())
      )
      AND care_team_links.status = 'accepted'
    )
  );

-- =============================================
-- TRIGGERS
-- =============================================
-- Auto-update updated_at timestamp
CREATE TRIGGER update_exercise_assignments_updated_at BEFORE UPDATE ON exercise_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'exercise_assignments';

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'exercise_assignments';

-- Check indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'exercise_assignments';
