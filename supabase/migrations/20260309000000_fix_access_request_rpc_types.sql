-- Fix get_access_request_by_token: RETURNS TABLE used TIMESTAMPTZ but the
-- care_team_links columns are TIMESTAMP (without timezone).  PostgreSQL
-- rejects the mismatch with "structure of query does not match function
-- result type".  Re-create the function with the correct TIMESTAMP type.

DROP FUNCTION IF EXISTS get_access_request_by_token(TEXT);

CREATE OR REPLACE FUNCTION get_access_request_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  survivor_id UUID,
  caregiver_id UUID,
  medical_staff_id UUID,
  relationship TEXT,
  status TEXT,
  permissions JSONB,
  access_request_expires_at TIMESTAMP,
  created_at TIMESTAMP,
  accepted_at TIMESTAMP,
  requester_id UUID,
  requester_name TEXT,
  requester_email TEXT,
  requester_role TEXT,
  requester_role_type TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester_id UUID;
  v_requester_name TEXT;
  v_requester_email TEXT;
  v_requester_role TEXT;
  v_requester_role_type TEXT;
BEGIN
  -- Resolve requester: caregiver, medical_staff, or survivor (for survivor-initiated invites)
  SELECT
    COALESCE(c.caregiver_id, c.medical_staff_id, c.survivor_id),
    u.name,
    u.email,
    u.role,
    CASE
      WHEN c.survivor_id IS NOT NULL AND c.caregiver_id IS NULL AND c.medical_staff_id IS NULL THEN 'survivor'
      WHEN c.caregiver_id IS NOT NULL THEN 'caregiver'
      ELSE 'medical_staff'
    END
  INTO
    v_requester_id,
    v_requester_name,
    v_requester_email,
    v_requester_role,
    v_requester_role_type
  FROM care_team_links c
  LEFT JOIN users u ON u.id = COALESCE(c.caregiver_id, c.medical_staff_id, c.survivor_id)
  WHERE c.access_request_token = p_token;

  IF v_requester_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.survivor_id,
    c.caregiver_id,
    c.medical_staff_id,
    c.relationship,
    c.status,
    c.permissions,
    c.access_request_expires_at,
    c.created_at,
    c.accepted_at,
    v_requester_id,
    v_requester_name,
    v_requester_email,
    v_requester_role,
    v_requester_role_type
  FROM care_team_links c
  WHERE c.access_request_token = p_token;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_access_request_by_token(TEXT) TO authenticated;
