-- Run these in Supabase Dashboard > SQL Editor (project kxohtekvnnpjfuegvmbk)
-- Copy and run each block separately, or run all.
-- If query 1 returns rows: mood data exists; app will show it once the device loads the latest JS (Metro reload or rebuild).
-- If query 2 is missing "Users can view own daily_logs" or "Users can view own health_metrics": run supabase/migrations/20260317000000_ensure_progress_tab_rls.sql in the SQL Editor.

-- ============================================================
-- 1. Verify daily_logs data exists for Katie
-- ============================================================
SELECT id, user_id, log_date, mood
FROM daily_logs
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'katie.b.adler@gmail.com')
ORDER BY log_date DESC
LIMIT 10;

-- ============================================================
-- 2. Verify RLS SELECT policies on daily_logs and health_metrics
-- ============================================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('daily_logs', 'health_metrics')
  AND cmd = 'SELECT'
ORDER BY tablename;
