-- Fix CHECK constraint on users.role to include 'medical_staff'
-- Run this in the Supabase SQL Editor
-- The live DB may have an older constraint that only allows 'survivor' and 'caregiver'.
-- This migration safely drops whatever constraint exists and re-adds it with all three values.

-- Step 1: Drop the existing CHECK constraint on the role column
-- The constraint name may vary, so we look it up dynamically and drop it.
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attnum = ANY(con.conkey)
        AND att.attrelid = con.conrelid
    WHERE con.conrelid = 'public.users'::regclass
        AND att.attname = 'role'
        AND con.contype = 'c';

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No existing CHECK constraint found on users.role';
    END IF;
END $$;

-- Step 2: Re-add the CHECK constraint with all three valid roles
ALTER TABLE public.users
ADD CONSTRAINT users_role_check CHECK (role IN ('survivor', 'caregiver', 'medical_staff'));

-- Step 3: Verify the constraint is in place
SELECT con.conname, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_attribute att ON att.attnum = ANY(con.conkey)
    AND att.attrelid = con.conrelid
WHERE con.conrelid = 'public.users'::regclass
    AND att.attname = 'role'
    AND con.contype = 'c';
