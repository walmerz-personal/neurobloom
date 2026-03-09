-- NeuroBloom - Fix Access Request Token Lookup RLS
--
-- Problem: When a medical staff (or caregiver) sends an SMS access request, the
-- care_team_links row has survivor_id = NULL. When the survivor clicks the link,
-- RLS blocks SELECT (no policy allows the survivor to see that row). This migration
-- adds SECURITY DEFINER RPCs so lookup and accept bypass RLS, matching the
-- pattern used for invitation codes (get_invitation_by_code / accept_invitation).

-- =============================================
-- get_access_request_by_token
-- =============================================
-- Returns the access request row with requester info. Callable by any authenticated
-- user (e.g. survivor) so they can view the request before accepting.

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
  access_request_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
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

-- =============================================
-- accept_access_request
-- =============================================
-- Atomically validates the token, then sets survivor_id, status = 'accepted',
-- and clears token fields. Callable by the survivor accepting the request.

DROP FUNCTION IF EXISTS accept_access_request(TEXT, UUID);

CREATE OR REPLACE FUNCTION accept_access_request(p_token TEXT, p_survivor_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  requester_id UUID,
  requester_name TEXT,
  requester_role_type TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_current_status TEXT;
  v_requester_id UUID;
  v_requester_name TEXT;
  v_requester_role_type TEXT;
BEGIN
  SELECT
    c.id,
    c.access_request_expires_at,
    c.status,
    COALESCE(c.caregiver_id, c.medical_staff_id),
    u.name,
    CASE
      WHEN c.caregiver_id IS NOT NULL THEN 'caregiver'
      ELSE 'medical_staff'
    END
  INTO
    v_link_id,
    v_expires_at,
    v_current_status,
    v_requester_id,
    v_requester_name,
    v_requester_role_type
  FROM care_team_links c
  LEFT JOIN users u ON u.id = COALESCE(c.caregiver_id, c.medical_staff_id)
  WHERE c.access_request_token = p_token
    AND c.survivor_id IS NULL
    AND c.access_request_token IS NOT NULL;

  IF v_link_id IS NULL THEN
    RETURN QUERY SELECT false, 'Access request not found'::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  IF v_current_status != 'pending' THEN
    RETURN QUERY SELECT false, 'This access request has already been used'::TEXT, v_requester_id, v_requester_name, v_requester_role_type;
    RETURN;
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'Access request has expired'::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  UPDATE care_team_links
  SET
    survivor_id = p_survivor_id,
    status = 'accepted',
    accepted_at = NOW(),
    access_request_token = NULL,
    access_request_phone = NULL,
    access_request_expires_at = NULL
  WHERE care_team_links.id = v_link_id;

  RETURN QUERY SELECT true, NULL::TEXT, v_requester_id, v_requester_name, v_requester_role_type;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION accept_access_request(TEXT, UUID) TO authenticated;
