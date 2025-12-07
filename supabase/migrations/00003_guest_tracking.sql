-- Guest Tracking Migration
-- Adds guest count to stays and links to auto-generated expense records

-- Add 'guest_fees' to expense_category enum
ALTER TYPE expense_category ADD VALUE 'guest_fees';

-- Add guest tracking columns to stays table
ALTER TABLE public.stays
ADD COLUMN guest_count integer NOT NULL DEFAULT 0,
ADD COLUMN linked_expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL;

-- Add constraint for non-negative guest count
ALTER TABLE public.stays
ADD CONSTRAINT check_guest_count CHECK (guest_count >= 0);

-- Add index for querying stays by linked expense
CREATE INDEX idx_stays_linked_expense_id ON public.stays(linked_expense_id);

-- Update expense insert policy to allow house members to create guest_fees expenses
-- where paid_by is the house admin (the person owed the money)
DROP POLICY IF EXISTS "House members can create expenses" ON public.expenses;

CREATE POLICY "House members can create expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (
    house_id IN (SELECT house_id FROM public.house_members WHERE user_id = auth.uid())
    AND (
      -- Regular expenses: paid_by must be the current user
      paid_by = auth.uid()
      OR
      -- Guest fees: paid_by can be any admin of the house
      (
        category = 'guest_fees'
        AND paid_by IN (
          SELECT user_id FROM public.house_members
          WHERE house_id = expenses.house_id
          AND role = 'admin'
          AND user_id IS NOT NULL
        )
      )
    )
  );

-- Also allow admins and the expense creator to delete expenses (for cleanup when stay is deleted)
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

CREATE POLICY "Users can delete their own expenses or guest_fees as admin"
  ON public.expenses FOR DELETE
  USING (
    paid_by = auth.uid()
    OR (
      category = 'guest_fees'
      AND house_id IN (
        SELECT house_id FROM public.house_members
        WHERE user_id = auth.uid()
        AND role = 'admin'
      )
    )
  );
