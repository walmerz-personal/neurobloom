-- NeuroBloom: Add Automatic User Creation Trigger
-- This trigger automatically creates a row in the users table when someone signs up
-- Run this in Supabase SQL Editor

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatically create user record with data from signup metadata
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    COALESCE(new.raw_user_meta_data->>'role', 'survivor')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Verify the trigger was created
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
