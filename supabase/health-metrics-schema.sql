-- NeuroBloom Health Metrics Schema
-- Run this in Supabase SQL Editor to add health metrics tracking functionality

-- =============================================
-- HEALTH_METRICS TABLE
-- =============================================
-- Stores daily aggregates and individual samples of health metrics from Apple HealthKit
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  metric_date DATE NOT NULL,
  
  -- Walking Metrics (from HealthKit Mobility category)
  walking_speed_avg NUMERIC(5, 3), -- meters per second (average for the day)
  walking_speed_samples JSONB, -- Array of individual samples if needed
  walking_step_length_avg NUMERIC(5, 3), -- meters (average step length)
  walking_asymmetry_percentage NUMERIC(5, 2), -- percentage (0-100)
  walking_double_support_percentage NUMERIC(5, 2), -- percentage (0-100)
  walking_steadiness TEXT CHECK (walking_steadiness IN ('OK', 'Low', 'Very Low', NULL)), -- Most recent classification
  six_minute_walk_distance NUMERIC(6, 2), -- meters (if available)
  
  -- Activity Metrics
  step_count INTEGER, -- Daily step count
  distance_walked NUMERIC(7, 2), -- meters (distance walking/running)
  
  -- Metadata
  data_quality TEXT CHECK (data_quality IN ('good', 'fair', 'poor', 'insufficient')), -- Quality assessment
  sample_count INTEGER, -- Number of samples used for aggregation
  device_source TEXT, -- 'iPhone' or 'Apple Watch' or 'Unknown'
  sync_timestamp TIMESTAMP DEFAULT NOW(), -- When this data was synced from HealthKit
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- One record per user per day
  UNIQUE(user_id, metric_date)
);

-- =============================================
-- HEALTH_SHARING_PREFERENCES TABLE
-- =============================================
-- User-controlled sharing settings for health data
CREATE TABLE IF NOT EXISTS health_sharing_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Relationship type: 'caregiver' or 'medical_staff'
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('caregiver', 'medical_staff')),
  
  -- Specific user ID of the person being shared with (caregiver or medical staff member)
  shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Per-metric sharing toggles (granular privacy control)
  share_walking_speed BOOLEAN DEFAULT false,
  share_walking_steadiness BOOLEAN DEFAULT false,
  share_step_length BOOLEAN DEFAULT false,
  share_asymmetry BOOLEAN DEFAULT false,
  share_double_support BOOLEAN DEFAULT false,
  share_step_count BOOLEAN DEFAULT false,
  share_distance_walked BOOLEAN DEFAULT false,
  share_six_minute_walk BOOLEAN DEFAULT false,
  
  -- Global toggle (if true, overrides individual metric toggles)
  share_all_metrics BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- One preference record per user-relationship pair
  UNIQUE(user_id, shared_with_user_id, relationship_type)
);

-- =============================================
-- INDEXES
-- =============================================
-- Optimize queries for health metrics
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date ON health_metrics(user_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_date ON health_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_sharing_user ON health_sharing_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_health_sharing_shared_with ON health_sharing_preferences(shared_with_user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
-- Enable RLS on all tables
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_sharing_preferences ENABLE ROW LEVEL SECURITY;

-- Health metrics policies
-- Users can view their own health metrics
CREATE POLICY "Users can view own health_metrics" ON health_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own health metrics
CREATE POLICY "Users can insert own health_metrics" ON health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own health metrics
CREATE POLICY "Users can update own health_metrics" ON health_metrics
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own health metrics
CREATE POLICY "Users can delete own health_metrics" ON health_metrics
  FOR DELETE USING (auth.uid() = user_id);

-- Caregivers and medical staff can view health metrics if sharing is enabled
CREATE POLICY "Care team can view shared health_metrics" ON health_metrics
  FOR SELECT USING (
    -- Owner can always see
    auth.uid() = user_id OR
    -- Or if sharing is enabled for this viewer
    EXISTS (
      SELECT 1 FROM health_sharing_preferences hsp
      WHERE hsp.user_id = health_metrics.user_id
        AND hsp.shared_with_user_id = auth.uid()
        AND (
          hsp.share_all_metrics = true OR
          (hsp.share_walking_speed = true AND health_metrics.walking_speed_avg IS NOT NULL) OR
          (hsp.share_walking_steadiness = true AND health_metrics.walking_steadiness IS NOT NULL) OR
          (hsp.share_step_length = true AND health_metrics.walking_step_length_avg IS NOT NULL) OR
          (hsp.share_asymmetry = true AND health_metrics.walking_asymmetry_percentage IS NOT NULL) OR
          (hsp.share_double_support = true AND health_metrics.walking_double_support_percentage IS NOT NULL) OR
          (hsp.share_step_count = true AND health_metrics.step_count IS NOT NULL) OR
          (hsp.share_distance_walked = true AND health_metrics.distance_walked IS NOT NULL) OR
          (hsp.share_six_minute_walk = true AND health_metrics.six_minute_walk_distance IS NOT NULL)
        )
    )
  );

-- Health sharing preferences policies
-- Users can view their own sharing preferences
CREATE POLICY "Users can view own health_sharing_preferences" ON health_sharing_preferences
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = shared_with_user_id);

-- Users can insert their own sharing preferences
CREATE POLICY "Users can insert own health_sharing_preferences" ON health_sharing_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sharing preferences
CREATE POLICY "Users can update own health_sharing_preferences" ON health_sharing_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own sharing preferences
CREATE POLICY "Users can delete own health_sharing_preferences" ON health_sharing_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================
-- Auto-update updated_at timestamp
CREATE TRIGGER update_health_metrics_updated_at BEFORE UPDATE ON health_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_sharing_preferences_updated_at BEFORE UPDATE ON health_sharing_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================
-- Function to get health metrics for a date range (respects sharing preferences)
CREATE OR REPLACE FUNCTION get_health_metrics_for_viewer(
  target_user_id UUID,
  viewer_user_id UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  metric_date DATE,
  walking_speed_avg NUMERIC,
  walking_step_length_avg NUMERIC,
  walking_asymmetry_percentage NUMERIC,
  walking_double_support_percentage NUMERIC,
  walking_steadiness TEXT,
  six_minute_walk_distance NUMERIC,
  step_count INTEGER,
  distance_walked NUMERIC,
  data_quality TEXT,
  device_source TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hm.id,
    hm.user_id,
    hm.metric_date,
    -- Only return metrics that are shared (or if viewer is owner)
    CASE 
      WHEN viewer_user_id = target_user_id THEN hm.walking_speed_avg
      WHEN EXISTS (
        SELECT 1 FROM health_sharing_preferences hsp
        WHERE hsp.user_id = target_user_id
          AND hsp.shared_with_user_id = viewer_user_id
          AND (hsp.share_all_metrics = true OR hsp.share_walking_speed = true)
      ) THEN hm.walking_speed_avg
      ELSE NULL
    END as walking_speed_avg,
    CASE 
      WHEN viewer_user_id = target_user_id THEN hm.walking_step_length_avg
      WHEN EXISTS (
        SELECT 1 FROM health_sharing_preferences hsp
        WHERE hsp.user_id = target_user_id
          AND hsp.shared_with_user_id = viewer_user_id
          AND (hsp.share_all_metrics = true OR hsp.share_step_length = true)
      ) THEN hm.walking_step_length_avg
      ELSE NULL
    END as walking_step_length_avg,
    CASE 
      WHEN viewer_user_id = target_user_id THEN hm.walking_asymmetry_percentage
      WHEN EXISTS (
        SELECT 1 FROM health_sharing_preferences hsp
        WHERE hsp.user_id = target_user_id
          AND hsp.shared_with_user_id = viewer_user_id
          AND (hsp.share_all_metrics = true OR hsp.share_asymmetry = true)
      ) THEN hm.walking_asymmetry_percentage
      ELSE NULL
    END as walking_asymmetry_percentage,
    CASE 
      WHEN viewer_user_id = target_user_id THEN hm.walking_double_support_percentage
      WHEN EXISTS (
        SELECT 1 FROM health_sharing_preferences hsp
        WHERE hsp.user_id = target_user_id
          AND hsp.shared_with_user_id = viewer_user_id
          AND (hsp.share_all_metrics = true OR hsp.share_double_support = true)
      ) THEN hm.walking_double_support_percentage
      ELSE NULL
    END as walking_double_support_percentage,
    CASE 
      WHEN viewer_user_id = target_user_id THEN hm.walking_steadiness
      WHEN EXISTS (
        SELECT 1 FROM health_sharing_preferences hsp
        WHERE hsp.user_id = target_user_id
          AND hsp.shared_with_user_id = viewer_user_id
          AND (hsp.share_all_metrics = true OR hsp.share_walking_steadiness = true)
      ) THEN hm.walking_steadiness
      ELSE NULL
    END as walking_steadiness,
    CASE 
      WHEN viewer_user_id = target_user_id THEN hm.six_minute_walk_distance
      WHEN EXISTS (
        SELECT 1 FROM health_sharing_preferences hsp
        WHERE hsp.user_id = target_user_id
          AND hsp.shared_with_user_id = viewer_user_id
          AND (hsp.share_all_metrics = true OR hsp.share_six_minute_walk = true)
      ) THEN hm.six_minute_walk_distance
      ELSE NULL
    END as six_minute_walk_distance,
    CASE 
      WHEN viewer_user_id = target_user_id THEN hm.step_count
      WHEN EXISTS (
        SELECT 1 FROM health_sharing_preferences hsp
        WHERE hsp.user_id = target_user_id
          AND hsp.shared_with_user_id = viewer_user_id
          AND (hsp.share_all_metrics = true OR hsp.share_step_count = true)
      ) THEN hm.step_count
      ELSE NULL
    END as step_count,
    CASE 
      WHEN viewer_user_id = target_user_id THEN hm.distance_walked
      WHEN EXISTS (
        SELECT 1 FROM health_sharing_preferences hsp
        WHERE hsp.user_id = target_user_id
          AND hsp.shared_with_user_id = viewer_user_id
          AND (hsp.share_all_metrics = true OR hsp.share_distance_walked = true)
      ) THEN hm.distance_walked
      ELSE NULL
    END as distance_walked,
    hm.data_quality,
    hm.device_source
  FROM health_metrics hm
  WHERE hm.user_id = target_user_id
    AND hm.metric_date BETWEEN start_date AND end_date
    AND (
      -- Owner can see all
      viewer_user_id = target_user_id OR
      -- Or sharing is enabled
      EXISTS (
        SELECT 1 FROM health_sharing_preferences hsp
        WHERE hsp.user_id = target_user_id
          AND hsp.shared_with_user_id = viewer_user_id
          AND (hsp.share_all_metrics = true OR
               hsp.share_walking_speed = true OR
               hsp.share_walking_steadiness = true OR
               hsp.share_step_length = true OR
               hsp.share_asymmetry = true OR
               hsp.share_double_support = true OR
               hsp.share_step_count = true OR
               hsp.share_distance_walked = true OR
               hsp.share_six_minute_walk = true)
      )
    )
  ORDER BY hm.metric_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
