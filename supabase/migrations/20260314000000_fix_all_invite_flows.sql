-- NeuroBloom - Fix All Invite Flow Issues
--
-- Fixes three classes of bugs across all care_team_links invite flows:
-- 1. Duplicate key violation when accepting a request if a link already exists
-- 2. RLS blocking survivor-initiated invite acceptance (caregiver_id/medical_staff_id is NULL)
-- 3. CHECK constraint blocking survivor-initiated invite creation (both IDs NULL)

-- =============================================
-- FIX 1: Relax care_team_links_role_check
-- =============================================
-- The old constraint required exactly one of caregiver_id/medical_staff_id to be set.
-- Survivor-initiated invites need both NULL until the acceptor claims the row.
-- New constraint: both cannot be set simultaneously, but both-NULL is allowed.

ALTER TABLE care_team_links DROP CONSTRAINT IF EXISTS care_team_links_role_check;

ALTER TABLE care_team_links
ADD CONSTRAINT care_team_links_role_check
CHECK (NOT (caregiver_id IS NOT NULL AND medical_staff_id IS NOT NULL));

-- =============================================
-- FIX 2: Updated accept_access_request
-- =============================================
-- Handles duplicate links gracefully: if the survivor and requester already have
-- a care_team_links row, reuse/update it instead of violating the unique index.

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
  v_medical_staff_id UUID;
  v_caregiver_id UUID;
  v_existing_link_id UUID;
  v_existing_status TEXT;
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
    END,
    c.medical_staff_id,
    c.caregiver_id
  INTO
    v_link_id,
    v_expires_at,
    v_current_status,
    v_requester_id,
    v_requester_name,
    v_requester_role_type,
    v_medical_staff_id,
    v_caregiver_id
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

  -- Check for an existing link between this survivor and the same requester
  SELECT id, status INTO v_existing_link_id, v_existing_status
  FROM care_team_links
  WHERE survivor_id = p_survivor_id
    AND id != v_link_id
    AND (
      (v_medical_staff_id IS NOT NULL AND medical_staff_id = v_medical_staff_id)
      OR (v_caregiver_id IS NOT NULL AND caregiver_id = v_caregiver_id)
    )
  LIMIT 1;

  IF v_existing_link_id IS NOT NULL THEN
    -- Existing link found: update it to accepted if needed, then delete the pending row
    IF v_existing_status != 'accepted' THEN
      UPDATE care_team_links
      SET status = 'accepted', accepted_at = NOW()
      WHERE id = v_existing_link_id;
    END IF;
    DELETE FROM care_team_links WHERE id = v_link_id;
    RETURN QUERY SELECT true, NULL::TEXT, v_requester_id, v_requester_name, v_requester_role_type;
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

-- =============================================
-- FIX 3: Updated accept_invitation
-- =============================================
-- Now accepts a role_type parameter to support both caregiver and medical_staff.
-- Also handles duplicate links gracefully.

DROP FUNCTION IF EXISTS accept_invitation(TEXT, UUID);
DROP FUNCTION IF EXISTS accept_invitation(TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION accept_invitation(
  p_invitation_code TEXT,
  p_acceptor_id UUID,
  p_role_type TEXT DEFAULT 'caregiver'
)
RETURNS TABLE (
  link_id UUID,
  survivor_id UUID,
  survivor_name TEXT,
  success BOOLEAN,
  error_message TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id UUID;
  v_survivor_id UUID;
  v_survivor_name TEXT;
  v_current_status TEXT;
  v_existing_link_id UUID;
  v_existing_status TEXT;
BEGIN
  SELECT
    c.id,
    c.survivor_id,
    u.name,
    c.status
  INTO
    v_link_id,
    v_survivor_id,
    v_survivor_name,
    v_current_status
  FROM care_team_links c
  JOIN users u ON c.survivor_id = u.id
  WHERE c.invitation_code = p_invitation_code;

  IF v_link_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::TEXT, false, 'Invalid or expired invitation code'::TEXT;
    RETURN;
  END IF;

  IF v_current_status != 'pending' THEN
    RETURN QUERY SELECT v_link_id, v_survivor_id, v_survivor_name, false, 'This invitation has already been used'::TEXT;
    RETURN;
  END IF;

  -- Check for existing link between this survivor and acceptor
  SELECT id, status INTO v_existing_link_id, v_existing_status
  FROM care_team_links
  WHERE survivor_id = v_survivor_id
    AND id != v_link_id
    AND (
      (p_role_type = 'medical_staff' AND medical_staff_id = p_acceptor_id)
      OR (p_role_type != 'medical_staff' AND caregiver_id = p_acceptor_id)
    )
  LIMIT 1;

  IF v_existing_link_id IS NOT NULL THEN
    IF v_existing_status != 'accepted' THEN
      UPDATE care_team_links
      SET status = 'accepted', accepted_at = NOW()
      WHERE id = v_existing_link_id;
    END IF;
    DELETE FROM care_team_links WHERE id = v_link_id;
    RETURN QUERY SELECT v_existing_link_id, v_survivor_id, v_survivor_name, true, NULL::TEXT;
    RETURN;
  END IF;

  IF p_role_type = 'medical_staff' THEN
    UPDATE care_team_links
    SET medical_staff_id = p_acceptor_id, status = 'accepted', accepted_at = NOW()
    WHERE care_team_links.id = v_link_id AND status = 'pending';
  ELSE
    UPDATE care_team_links
    SET caregiver_id = p_acceptor_id, status = 'accepted', accepted_at = NOW()
    WHERE care_team_links.id = v_link_id AND status = 'pending';
  END IF;

  RETURN QUERY SELECT v_link_id, v_survivor_id, v_survivor_name, true, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION accept_invitation(TEXT, UUID, TEXT) TO authenticated;

-- =============================================
-- FIX 4: New accept_survivor_invite RPC
-- =============================================
-- SECURITY DEFINER function for survivor-initiated SMS invites.
-- Bypasses RLS since caregiver_id/medical_staff_id are NULL on pending rows.
-- Handles duplicate links gracefully.

DROP FUNCTION IF EXISTS accept_survivor_invite(TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION accept_survivor_invite(
  p_token TEXT,
  p_acceptor_id UUID,
  p_role_type TEXT DEFAULT 'caregiver'
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  survivor_id UUID,
  survivor_name TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id UUID;
  v_survivor_id UUID;
  v_survivor_name TEXT;
  v_current_status TEXT;
  v_expires_at TIMESTAMPTZ;
  v_existing_link_id UUID;
  v_existing_status TEXT;
BEGIN
  -- Look up the pending survivor-initiated invite (survivor_id is set, both IDs are NULL)
  SELECT
    c.id,
    c.survivor_id,
    u.name,
    c.status,
    c.access_request_expires_at
  INTO
    v_link_id,
    v_survivor_id,
    v_survivor_name,
    v_current_status,
    v_expires_at
  FROM care_team_links c
  LEFT JOIN users u ON u.id = c.survivor_id
  WHERE c.access_request_token = p_token
    AND c.survivor_id IS NOT NULL
    AND c.caregiver_id IS NULL
    AND c.medical_staff_id IS NULL;

  IF v_link_id IS NULL THEN
    RETURN QUERY SELECT false, 'Invite not found'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  IF v_current_status != 'pending' THEN
    RETURN QUERY SELECT false, 'This invite has already been used'::TEXT, v_survivor_id, v_survivor_name;
    RETURN;
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'Invite has expired'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- Check for existing link between this survivor and acceptor
  SELECT id, status INTO v_existing_link_id, v_existing_status
  FROM care_team_links
  WHERE survivor_id = v_survivor_id
    AND id != v_link_id
    AND (
      (p_role_type = 'medical_staff' AND medical_staff_id = p_acceptor_id)
      OR (p_role_type != 'medical_staff' AND caregiver_id = p_acceptor_id)
    )
  LIMIT 1;

  IF v_existing_link_id IS NOT NULL THEN
    IF v_existing_status != 'accepted' THEN
      UPDATE care_team_links
      SET status = 'accepted', accepted_at = NOW()
      WHERE id = v_existing_link_id;
    END IF;
    DELETE FROM care_team_links WHERE id = v_link_id;
    RETURN QUERY SELECT true, NULL::TEXT, v_survivor_id, v_survivor_name;
    RETURN;
  END IF;

  IF p_role_type = 'medical_staff' THEN
    UPDATE care_team_links
    SET
      medical_staff_id = p_acceptor_id,
      status = 'accepted',
      accepted_at = NOW(),
      access_request_token = NULL,
      access_request_phone = NULL,
      access_request_expires_at = NULL
    WHERE id = v_link_id;
  ELSE
    UPDATE care_team_links
    SET
      caregiver_id = p_acceptor_id,
      status = 'accepted',
      accepted_at = NOW(),
      access_request_token = NULL,
      access_request_phone = NULL,
      access_request_expires_at = NULL
    WHERE id = v_link_id;
  END IF;

  RETURN QUERY SELECT true, NULL::TEXT, v_survivor_id, v_survivor_name;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION accept_survivor_invite(TEXT, UUID, TEXT) TO authenticated;
