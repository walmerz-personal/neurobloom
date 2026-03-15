-- Ensure survivors can read their own daily_logs and health_metrics for the Progress tab.
-- Idempotent: safe to run even if policies already exist.

-- daily_logs: owner SELECT (required for mood trend, streaks, weekly goal)
DROP POLICY IF EXISTS "Users can view own daily_logs" ON daily_logs;
CREATE POLICY "Users can view own daily_logs" ON daily_logs
  FOR SELECT USING (auth.uid() = user_id);

-- health_metrics: owner SELECT (required for Apple Health charts and mobility metrics)
DROP POLICY IF EXISTS "Users can view own health_metrics" ON health_metrics;
CREATE POLICY "Users can view own health_metrics" ON health_metrics
  FOR SELECT USING (auth.uid() = user_id);
