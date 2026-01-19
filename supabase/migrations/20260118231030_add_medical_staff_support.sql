-- NeuroBloom Medical Staff Schema
-- Add medical staff functionality to care_team_links

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
-- UPDATE CARE TEAM LINKS RLS POLICIES
-- =============================================
-- Medical staff can view links where they are the medical staff
DROP POLICY IF EXISTS "Medical staff can view their links" ON care_team_links;
CREATE POLICY "Medical staff can view their links" ON care_team_links
  FOR SELECT USING (auth.uid() = medical_staff_id);

-- Medical staff can update links to accept/decline invitations
DROP POLICY IF EXISTS "Medical staff can accept/decline invitations" ON care_team_links;
CREATE POLICY "Medical staff can accept/decline invitations" ON care_team_links
  FOR UPDATE USING (auth.uid() = medical_staff_id AND status = 'pending');

-- Medical staff can remove themselves from a link
DROP POLICY IF EXISTS "Medical staff can remove themselves" ON care_team_links;
CREATE POLICY "Medical staff can remove themselves" ON care_team_links
  FOR DELETE USING (auth.uid() = medical_staff_id);
