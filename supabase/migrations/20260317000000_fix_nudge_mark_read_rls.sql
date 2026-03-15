-- Fix RLS UPDATE policy on nudges so survivors can mark nudges as read.
-- Without explicit WITH CHECK, PostgreSQL reuses USING for post-update validation;
-- after setting read_at, read_at IS NULL is false and the update was rejected.
DROP POLICY IF EXISTS "Survivors can mark nudges as read" ON nudges;

CREATE POLICY "Survivors can mark nudges as read" ON nudges
  FOR UPDATE
  USING (auth.uid() = survivor_id AND read_at IS NULL)
  WITH CHECK (auth.uid() = survivor_id);
