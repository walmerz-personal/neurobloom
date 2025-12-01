-- NeuroBloom Database Schema - UPDATED
-- Run this UPDATED SQL in Supabase SQL Editor to fix the signup issue

-- DROP existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

DROP POLICY IF EXISTS "Users can view own user_profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own user_profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own user_profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view own daily_logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can insert own daily_logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can update own daily_logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can delete own daily_logs" ON daily_logs;

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

-- RECREATE policies with proper INSERT permissions
-- Users table policies - FIXED VERSION
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User profiles policies - FIXED VERSION
CREATE POLICY "Users can view own user_profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Daily logs policies
CREATE POLICY "Users can view own daily_logs" ON daily_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily_logs" ON daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily_logs" ON daily_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily_logs" ON daily_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);
