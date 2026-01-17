-- NeuroBloom Access Request Schema
-- Run this in Supabase SQL Editor to add SMS-based access request functionality

-- =============================================
-- EXTEND CARE TEAM LINKS TABLE
-- =============================================
-- Add columns to support access requests via SMS
ALTER TABLE care_team_links 
ADD COLUMN IF NOT EXISTS access_request_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS access_request_phone TEXT,
ADD COLUMN IF NOT EXISTS access_request_expires_at TIMESTAMP;

-- =============================================
-- INDEXES
-- =============================================
-- Index for fast lookups by access request token
CREATE INDEX IF NOT EXISTS idx_care_team_access_request_token 
ON care_team_links(access_request_token) 
WHERE access_request_token IS NOT NULL;

-- =============================================
-- HELPER FUNCTION: Generate Access Request Token
-- =============================================
CREATE OR REPLACE FUNCTION generate_access_request_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
  token_exists BOOLEAN;
BEGIN
  -- Generate a unique token (16 characters for better security)
  LOOP
    result := '';
    FOR i IN 1..16 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM care_team_links WHERE access_request_token = result) INTO token_exists;
    
    -- Exit loop if token is unique
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Check that columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'care_team_links'
  AND column_name IN ('access_request_token', 'access_request_phone', 'access_request_expires_at');

-- Check that index was created
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'care_team_links'
  AND indexname = 'idx_care_team_access_request_token';
