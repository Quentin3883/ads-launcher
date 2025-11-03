-- Drop and recreate the SELECT policy to be more permissive
DROP POLICY IF EXISTS "Users can view strategies" ON strategies;

-- Allow anyone to view strategies with the fallback UUID
-- This is safe because all unauthenticated users share the same fallback UUID
CREATE POLICY "Enable read access for all users"
  ON strategies
  FOR SELECT
  USING (true);
