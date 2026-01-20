-- NeuroBloom - Fix Exercise Tables RLS Policies
-- Update RLS policies to use specific operation types instead of FOR ALL

-- =============================================
-- FIX USER_EXERCISES RLS POLICIES
-- =============================================
-- Drop the old FOR ALL policy and create separate policies
DROP POLICY IF EXISTS "Users can manage their own exercises" ON user_exercises;

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

-- =============================================
-- FIX EXERCISE_ASSIGNMENTS RLS POLICIES
-- =============================================
-- Drop the old FOR ALL policy and create separate policies
DROP POLICY IF EXISTS "Assigners can manage their assignments" ON exercise_assignments;

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
