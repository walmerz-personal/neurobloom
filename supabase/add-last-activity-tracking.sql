-- Add last_activity_at column to users table for tracking app usage
-- This migration adds a timestamp column to track when users last opened the app

-- Add the column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;

-- Set default value for existing users (use created_at if last_activity_at is null)
UPDATE users 
SET last_activity_at = created_at 
WHERE last_activity_at IS NULL;

-- Create index for efficient queries on last_activity_at
CREATE INDEX IF NOT EXISTS idx_users_last_activity_at ON users(last_activity_at);

-- Add comment for documentation
COMMENT ON COLUMN users.last_activity_at IS 'Timestamp of when the user last opened the app';
