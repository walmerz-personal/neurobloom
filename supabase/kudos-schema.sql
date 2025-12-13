-- NeuroBloom Kudos Schema
-- Allows caregivers to send encouragement/kudos to survivors for their progress

-- =============================================
-- KUDOS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS kudos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caregiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  survivor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('streak', 'exercises', 'checkin_rate', 'mood', 'pain', 'energy', 'daily_checkin')),
  item_value TEXT, -- The value at time of kudos (e.g., "27" for exercises)
  item_date DATE, -- For daily check-in kudos, the specific date
  message TEXT, -- Optional custom message (future feature)
  read_at TIMESTAMP, -- NULL = unread, timestamp = read
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_kudos_survivor_unread ON kudos(survivor_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_kudos_caregiver ON kudos(caregiver_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE kudos ENABLE ROW LEVEL SECURITY;

-- Caregivers can create kudos for linked survivors
CREATE POLICY "Caregivers can send kudos to linked survivors" ON kudos
  FOR INSERT WITH CHECK (
    auth.uid() = caregiver_id
    AND EXISTS (
      SELECT 1 FROM care_team_links 
      WHERE care_team_links.survivor_id = kudos.survivor_id 
      AND care_team_links.caregiver_id = auth.uid()
      AND care_team_links.status = 'accepted'
    )
  );

-- Survivors can view their own kudos
CREATE POLICY "Survivors can view their kudos" ON kudos
  FOR SELECT USING (auth.uid() = survivor_id);

-- Caregivers can view kudos they sent
CREATE POLICY "Caregivers can view kudos they sent" ON kudos
  FOR SELECT USING (auth.uid() = caregiver_id);

-- Survivors can update their kudos (to mark as read)
CREATE POLICY "Survivors can mark kudos as read" ON kudos
  FOR UPDATE USING (auth.uid() = survivor_id)
  WITH CHECK (auth.uid() = survivor_id);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'kudos';

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'kudos';
