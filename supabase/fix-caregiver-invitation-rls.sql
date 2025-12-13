-- NeuroBloom - Fix Caregiver Invitation Acceptance RLS Issue
-- Run this in Supabase SQL Editor
-- 
-- Problem: When a caregiver tries to accept an invitation, the RLS policy
-- "Caregivers can accept/decline invitations" fails because caregiver_id is NULL
-- for pending invitations, and auth.uid() = NULL always returns false.

-- =============================================
-- DROP EXISTING FUNCTION (to update it)
-- =============================================
DROP FUNCTION IF EXISTS accept_invitation(TEXT, UUID);

-- =============================================
-- SECURITY DEFINER FUNCTION TO ACCEPT INVITATIONS
-- =============================================
-- This function bypasses RLS to allow caregivers to claim pending invitations

CREATE OR REPLACE FUNCTION accept_invitation(
  p_invitation_code TEXT,
  p_caregiver_id UUID
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
BEGIN
  -- Check if invitation exists and get current state
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

  -- Check if invitation was found
  IF v_link_id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::UUID,
      NULL::TEXT,
      false,
      'Invalid or expired invitation code'::TEXT;
    RETURN;
  END IF;

  -- Check if already accepted
  IF v_current_status != 'pending' THEN
    RETURN QUERY SELECT 
      v_link_id,
      v_survivor_id,
      v_survivor_name,
      false,
      'This invitation has already been used'::TEXT;
    RETURN;
  END IF;

  -- Update the invitation
  UPDATE care_team_links
  SET 
    caregiver_id = p_caregiver_id,
    status = 'accepted',
    accepted_at = NOW()
  WHERE care_team_links.id = v_link_id
    AND status = 'pending';

  -- Return success
  RETURN QUERY SELECT 
    v_link_id,
    v_survivor_id,
    v_survivor_name,
    true,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- GRANT EXECUTE PERMISSION
-- =============================================
GRANT EXECUTE ON FUNCTION accept_invitation(TEXT, UUID) TO authenticated;

-- =============================================
-- VERIFICATION QUERY
-- =============================================
-- Run this to verify the function was created
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'accept_invitation';
