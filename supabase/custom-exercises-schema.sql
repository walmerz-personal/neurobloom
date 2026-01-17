-- NeuroBloom Custom Exercises Schema
-- Run this in Supabase SQL Editor to add custom exercises functionality

-- =============================================
-- USER EXERCISES TABLE
-- =============================================
-- Stores custom exercises created by users
CREATE TABLE IF NOT EXISTS user_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Arms', 'Legs', 'Core', 'Hands')),
  mode TEXT NOT NULL CHECK (mode IN ('solo', 'partner')),
  time TEXT, -- Optional, e.g., '3 min'
  target TEXT, -- Optional, e.g., 'Upper Traps'
  description TEXT, -- Optional
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')), -- Optional
  thumbnail_color TEXT NOT NULL DEFAULT '#E0F2FE', -- Default color, auto-assigned based on category
  instructions TEXT[] NOT NULL, -- Array of instruction strings
  is_shared_with_care_team BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_exercises_user_id ON user_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exercises_shared ON user_exercises(is_shared_with_care_team) WHERE is_shared_with_care_team = true;
CREATE INDEX IF NOT EXISTS idx_user_exercises_category ON user_exercises(category);
CREATE INDEX IF NOT EXISTS idx_user_exercises_mode ON user_exercises(mode);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE user_exercises ENABLE ROW LEVEL SECURITY;

-- Users can view their own exercises
CREATE POLICY "Users can view own exercises" ON user_exercises
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own exercises
CREATE POLICY "Users can create own exercises" ON user_exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own exercises
CREATE POLICY "Users can update own exercises" ON user_exercises
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own exercises
CREATE POLICY "Users can delete own exercises" ON user_exercises
  FOR DELETE USING (auth.uid() = user_id);

-- Caregivers and medical staff can view shared exercises from linked survivors
CREATE POLICY "Caregivers and medical staff can view shared exercises" ON user_exercises
  FOR SELECT USING (
    is_shared_with_care_team = true
    AND EXISTS (
      SELECT 1 FROM care_team_links 
      WHERE care_team_links.survivor_id = user_exercises.user_id 
      AND (
        care_team_links.caregiver_id = auth.uid() OR 
        care_team_links.medical_staff_id = auth.uid()
      )
      AND care_team_links.status = 'accepted'
    )
  );

-- Medical staff can view exercises from linked survivors (for assignment)
CREATE POLICY "Medical staff can view linked survivor exercises" ON user_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM care_team_links 
      WHERE care_team_links.survivor_id = user_exercises.user_id 
      AND care_team_links.medical_staff_id = auth.uid()
      AND care_team_links.status = 'accepted'
    )
  );

-- =============================================
-- TRIGGERS
-- =============================================
-- Auto-update updated_at timestamp
CREATE TRIGGER update_user_exercises_updated_at BEFORE UPDATE ON user_exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these to verify the schema was created correctly

-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_exercises';

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_exercises';

-- Check indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'user_exercises';
