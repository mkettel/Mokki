-- Fix resorts RLS policies
-- The original policies incorrectly called is_house_admin(auth.uid())
-- but is_house_admin expects a house_id, not a user_id

-- Create a new helper function to check if user is admin of ANY house
CREATE OR REPLACE FUNCTION public.is_any_house_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM house_members
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND invite_status = 'accepted'
  );
$$;

-- Drop the incorrect policies
DROP POLICY IF EXISTS "House admins can insert resorts" ON resorts;
DROP POLICY IF EXISTS "House admins can update resorts" ON resorts;
DROP POLICY IF EXISTS "House admins can delete resorts" ON resorts;

-- Recreate with the correct function
CREATE POLICY "House admins can insert resorts" ON resorts
  FOR INSERT WITH CHECK (is_any_house_admin());

CREATE POLICY "House admins can update resorts" ON resorts
  FOR UPDATE USING (is_any_house_admin());

CREATE POLICY "House admins can delete resorts" ON resorts
  FOR DELETE USING (is_any_house_admin());

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
