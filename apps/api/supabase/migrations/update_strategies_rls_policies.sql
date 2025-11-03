-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own strategies" ON strategies;
DROP POLICY IF EXISTS "Users can create their own strategies" ON strategies;
DROP POLICY IF EXISTS "Users can update their own strategies" ON strategies;
DROP POLICY IF EXISTS "Users can delete their own strategies" ON strategies;

-- Create more permissive policies that allow access with the fallback UUID
-- This allows the app to work without Supabase Auth configured

-- Allow viewing strategies for authenticated users OR fallback UUID
CREATE POLICY "Users can view strategies"
  ON strategies
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    user_id = '00000000-0000-0000-0000-000000000000'::uuid
  );

-- Allow creating strategies for authenticated users OR fallback UUID
CREATE POLICY "Users can create strategies"
  ON strategies
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    user_id = '00000000-0000-0000-0000-000000000000'::uuid
  );

-- Allow updating strategies for authenticated users OR fallback UUID
CREATE POLICY "Users can update strategies"
  ON strategies
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    user_id = '00000000-0000-0000-0000-000000000000'::uuid
  );

-- Allow deleting strategies for authenticated users OR fallback UUID
CREATE POLICY "Users can delete strategies"
  ON strategies
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    user_id = '00000000-0000-0000-0000-000000000000'::uuid
  );
