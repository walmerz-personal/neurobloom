-- NeuroBloom - Fix Access Request RLS Issue
-- Run this in Supabase SQL Editor
-- 
-- Problem: When a caregiver or medical staff tries to create an SMS access request,
-- the RLS policy "Survivors can create invitations" fails because:
-- 1. The requester is a caregiver/medical staff (not a survivor)
-- 2. survivor_id is NULL (survivor hasn't accepted yet)
-- 3. The policy requires auth.uid() = survivor_id, which fails when survivor_id IS NULL

-- =============================================
-- ADD RLS POLICY FOR ACCESS REQUESTS (INSERT)
-- =============================================
-- Allow caregivers and medical staff to create access requests
-- (INSERT rows with NULL survivor_id and access_request_token set)

DROP POLICY IF EXISTS "Caregivers and medical staff can create access requests" ON care_team_links;

-- Create policy for both caregivers and medical staff to create access requests
CREATE POLICY "Caregivers and medical staff can create access requests" ON care_team_links
  FOR INSERT WITH CHECK (
    survivor_id IS NULL
    AND access_request_token IS NOT NULL
    AND status = 'pending'
    AND (caregiver_id = auth.uid() OR medical_staff_id = auth.uid())
  );

-- =============================================
-- ADD RLS POLICY FOR ACCESS REQUEST ACCEPTANCE (UPDATE)
-- =============================================
-- Allow survivors to accept access requests
-- (UPDATE rows where survivor_id is NULL and access_request_token is set)
-- This is needed because the existing "Survivors can update their links" policy
-- requires auth.uid() = survivor_id, but access requests have survivor_id = NULL

DROP POLICY IF EXISTS "Survivors can accept access requests" ON care_team_links;

CREATE POLICY "Survivors can accept access requests" ON care_team_links
  FOR UPDATE USING (
    survivor_id IS NULL
    AND access_request_token IS NOT NULL
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = survivor_id
    AND status = 'accepted'
  );

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Check that both policies were created
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'care_team_links'
  AND policyname IN (
    'Caregivers and medical staff can create access requests',
    'Survivors can accept access requests'
  )
ORDER BY policyname;
