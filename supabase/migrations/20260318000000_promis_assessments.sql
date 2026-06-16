-- NeuroBloom - PROMIS Global-10 monthly outcome assessments
--
-- Stores a survivor's periodic PROMIS Global Health (Global-10) responses and
-- the two raw component sums (physical/mental, 4-20). RLS mirrors daily_logs:
-- a user owns their rows; linked caregivers/medical staff can read them.

CREATE TABLE IF NOT EXISTS promis_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  physical_raw INTEGER,
  mental_raw INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promis_user_date
  ON promis_assessments(user_id, assessment_date DESC);

ALTER TABLE promis_assessments ENABLE ROW LEVEL SECURITY;

-- Owner: full access to own rows
DROP POLICY IF EXISTS "Users can manage own promis assessments" ON promis_assessments;
CREATE POLICY "Users can manage own promis assessments" ON promis_assessments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Linked caregivers / medical staff: read-only on accepted links
DROP POLICY IF EXISTS "Care team can view linked survivor promis assessments" ON promis_assessments;
CREATE POLICY "Care team can view linked survivor promis assessments" ON promis_assessments
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM care_team_links
      WHERE care_team_links.survivor_id = promis_assessments.user_id
      AND (care_team_links.caregiver_id = auth.uid() OR care_team_links.medical_staff_id = auth.uid())
      AND care_team_links.status = 'accepted'
    )
  );
