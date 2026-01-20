-- NeuroBloom - Add Exercise Tables
-- Create tables for custom exercises and exercise assignments

-- =============================================
-- USER EXERCISES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Arms', 'Legs', 'Core', 'Hands')),
  mode TEXT NOT NULL CHECK (mode IN ('solo', 'partner')),
  time TEXT,
  target TEXT,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  thumbnail_color TEXT NOT NULL,
  instructions TEXT[] NOT NULL,
  is_shared_with_care_team BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_exercises ENABLE ROW LEVEL SECURITY;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_exercises_user_id ON user_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exercises_shared ON user_exercises(is_shared_with_care_team) WHERE is_shared_with_care_team = true;

-- RLS Policies for user_exercises
-- Users can CRUD their own exercises
DROP POLICY IF EXISTS "Users can view their own exercises" ON user_exercises;
CREATE POLICY "Users can view their own exercises" ON user_exercises
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own exercises" ON user_exercises;
CREATE POLICY "Users can insert their own exercises" ON user_exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own exercises" ON user_exercises;
CREATE POLICY "Users can update their own exercises" ON user_exercises
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own exercises" ON user_exercises;
CREATE POLICY "Users can delete their own exercises" ON user_exercises
  FOR DELETE USING (auth.uid() = user_id);

-- Care team members can SELECT exercises marked as shared from their linked survivors
DROP POLICY IF EXISTS "Care team can view shared exercises" ON user_exercises;
CREATE POLICY "Care team can view shared exercises" ON user_exercises
  FOR SELECT USING (
    is_shared_with_care_team = true
    AND EXISTS (
      SELECT 1 FROM care_team_links
      WHERE survivor_id = user_exercises.user_id
        AND status = 'accepted'
        AND (caregiver_id = auth.uid() OR medical_staff_id = auth.uid())
    )
  );

-- =============================================
-- EXERCISE ASSIGNMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS exercise_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survivor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('built_in', 'custom')),
  assigned_date DATE NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'skipped')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE exercise_assignments ENABLE ROW LEVEL SECURITY;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_survivor ON exercise_assignments(survivor_id);
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_assigned_by ON exercise_assignments(assigned_by_id);
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_status ON exercise_assignments(status);
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_survivor_status ON exercise_assignments(survivor_id, status);

-- RLS Policies for exercise_assignments
-- Survivors can SELECT and UPDATE (status only) their own assignments
DROP POLICY IF EXISTS "Survivors can view their assignments" ON exercise_assignments;
CREATE POLICY "Survivors can view their assignments" ON exercise_assignments
  FOR SELECT USING (auth.uid() = survivor_id);

DROP POLICY IF EXISTS "Survivors can update assignment status" ON exercise_assignments;
CREATE POLICY "Survivors can update assignment status" ON exercise_assignments
  FOR UPDATE USING (auth.uid() = survivor_id)
  WITH CHECK (auth.uid() = survivor_id);

-- Medical staff/caregivers can full CRUD for assignments they created
DROP POLICY IF EXISTS "Assigners can view their assignments" ON exercise_assignments;
CREATE POLICY "Assigners can view their assignments" ON exercise_assignments
  FOR SELECT USING (auth.uid() = assigned_by_id);

DROP POLICY IF EXISTS "Assigners can insert their assignments" ON exercise_assignments;
CREATE POLICY "Assigners can insert their assignments" ON exercise_assignments
  FOR INSERT WITH CHECK (auth.uid() = assigned_by_id);

DROP POLICY IF EXISTS "Assigners can update their assignments" ON exercise_assignments;
CREATE POLICY "Assigners can update their assignments" ON exercise_assignments
  FOR UPDATE USING (auth.uid() = assigned_by_id)
  WITH CHECK (auth.uid() = assigned_by_id);

DROP POLICY IF EXISTS "Assigners can delete their assignments" ON exercise_assignments;
CREATE POLICY "Assigners can delete their assignments" ON exercise_assignments
  FOR DELETE USING (auth.uid() = assigned_by_id);

-- Medical staff/caregivers can SELECT assignments for survivors they're linked to
DROP POLICY IF EXISTS "Care team can view survivor assignments" ON exercise_assignments;
CREATE POLICY "Care team can view survivor assignments" ON exercise_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM care_team_links
      WHERE survivor_id = exercise_assignments.survivor_id
        AND status = 'accepted'
        AND (caregiver_id = auth.uid() OR medical_staff_id = auth.uid())
    )
  );

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_exercises
DROP TRIGGER IF EXISTS update_user_exercises_updated_at ON user_exercises;
CREATE TRIGGER update_user_exercises_updated_at
  BEFORE UPDATE ON user_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for exercise_assignments
DROP TRIGGER IF EXISTS update_exercise_assignments_updated_at ON exercise_assignments;
CREATE TRIGGER update_exercise_assignments_updated_at
  BEFORE UPDATE ON exercise_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
