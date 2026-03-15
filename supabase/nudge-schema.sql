-- NeuroBloom Nudge Feature Schema
-- Run this in Supabase SQL Editor to add nudge functionality

-- =============================================
-- NUDGES TABLE
-- =============================================
-- Stores nudge messages sent from caregivers/medical staff to survivors
CREATE TABLE IF NOT EXISTS nudges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survivor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  nudge_type TEXT NOT NULL CHECK (nudge_type IN ('template', 'custom')),
  template_id TEXT, -- e.g., 'gentle_reminder', 'miss_you', 'keep_going', etc.
  message TEXT NOT NULL, -- The actual message text sent
  emoji TEXT, -- Optional emoji/icon associated with the nudge
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP, -- When survivor viewed the nudge
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
-- Optimize common queries
CREATE INDEX IF NOT EXISTS idx_nudges_survivor ON nudges(survivor_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_nudges_sender ON nudges(sender_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_nudges_unread ON nudges(survivor_id, read_at) WHERE read_at IS NULL;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;

-- Survivors can view nudges sent to them
CREATE POLICY "Survivors can view own nudges" ON nudges
  FOR SELECT USING (auth.uid() = survivor_id);

-- Caregivers can create nudges for linked survivors
CREATE POLICY "Caregivers can send nudges to linked survivors" ON nudges
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM care_team_links 
      WHERE care_team_links.survivor_id = nudges.survivor_id 
      AND care_team_links.caregiver_id = auth.uid()
      AND care_team_links.status = 'accepted'
    )
  );

-- Medical staff can create nudges for linked survivors
CREATE POLICY "Medical staff can send nudges to linked survivors" ON nudges
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM care_team_links 
      WHERE care_team_links.survivor_id = nudges.survivor_id 
      AND care_team_links.medical_staff_id = auth.uid()
      AND care_team_links.status = 'accepted'
    )
  );

-- Senders can view nudges they sent
CREATE POLICY "Senders can view own nudges" ON nudges
  FOR SELECT USING (auth.uid() = sender_id);

-- Survivors can mark nudges as read
CREATE POLICY "Survivors can mark nudges as read" ON nudges
  FOR UPDATE
  USING (auth.uid() = survivor_id AND read_at IS NULL)
  WITH CHECK (auth.uid() = survivor_id);

-- =============================================
-- HELPER FUNCTION: Check Rate Limiting
-- =============================================
-- Prevents spam by limiting nudges to 1 per day per sender-survivor pair
CREATE OR REPLACE FUNCTION can_send_nudge(p_sender_id UUID, p_survivor_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_nudge_time TIMESTAMP;
BEGIN
  -- Get the most recent nudge from this sender to this survivor
  SELECT sent_at INTO last_nudge_time
  FROM nudges
  WHERE sender_id = p_sender_id 
    AND survivor_id = p_survivor_id
  ORDER BY sent_at DESC
  LIMIT 1;

  -- If no previous nudge, allow
  IF last_nudge_time IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check if last nudge was more than 24 hours ago
  RETURN (NOW() - last_nudge_time) > INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these to verify the schema was created correctly

-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'nudges';

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'nudges';

-- Check indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'nudges';
