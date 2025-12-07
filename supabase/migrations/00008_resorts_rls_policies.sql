-- RLS policies for resorts table
-- Any house admin can manage resorts
-- Uses existing is_house_admin() function from earlier migrations

-- Allow admins to insert new resorts
CREATE POLICY "House admins can insert resorts" ON resorts
  FOR INSERT WITH CHECK (is_house_admin(auth.uid()));

-- Allow admins to update resorts
CREATE POLICY "House admins can update resorts" ON resorts
  FOR UPDATE USING (is_house_admin(auth.uid()));

-- Allow admins to delete resorts
CREATE POLICY "House admins can delete resorts" ON resorts
  FOR DELETE USING (is_house_admin(auth.uid()));
