-- Remove the foreign key constraint on user_id
-- This allows strategies to be created without requiring a valid auth.users entry
ALTER TABLE strategies DROP CONSTRAINT IF EXISTS strategies_user_id_fkey;

-- Make user_id nullable to allow strategies without specific users
ALTER TABLE strategies ALTER COLUMN user_id DROP NOT NULL;
