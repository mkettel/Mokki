-- Expense Tracking System Enhancement
-- Adds new categories, venmo handle, title/created_by for expenses, and updates RLS policies

-- Add new expense categories to the enum
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'rent';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'entertainment';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'transportation';

-- Add venmo_handle to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS venmo_handle text;

-- Add title and created_by to expenses table
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Backfill created_by from paid_by for existing records
UPDATE public.expenses
SET created_by = paid_by
WHERE created_by IS NULL;

-- Add index for created_by lookups
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);

-- Add index for faster balance calculations
CREATE INDEX IF NOT EXISTS idx_expense_splits_settled ON public.expense_splits(settled);

-- Update expense insert policy to include created_by
DROP POLICY IF EXISTS "House members can create expenses" ON public.expenses;

CREATE POLICY "House members can create expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (
    house_id IN (SELECT house_id FROM public.house_members WHERE user_id = auth.uid() AND invite_status = 'accepted')
    AND created_by = auth.uid()
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

-- Update expense update policy to only allow creator to edit
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;

CREATE POLICY "Expense creators can update their expenses"
  ON public.expenses FOR UPDATE
  USING (created_by = auth.uid());

-- Update expense delete policy to allow creator to delete
DROP POLICY IF EXISTS "Users can delete their own expenses or guest_fees as admin" ON public.expenses;

CREATE POLICY "Expense creators can delete their expenses"
  ON public.expenses FOR DELETE
  USING (
    created_by = auth.uid()
    OR (
      -- Admins can still delete guest_fees expenses
      category = 'guest_fees'
      AND house_id IN (
        SELECT house_id FROM public.house_members
        WHERE user_id = auth.uid()
        AND role = 'admin'
      )
    )
  );

-- Update expense_splits policy - only expense creator (paid_by) can mark as settled
DROP POLICY IF EXISTS "Users can settle their own splits" ON public.expense_splits;

CREATE POLICY "Expense payer can settle splits"
  ON public.expense_splits FOR UPDATE
  USING (
    -- Only the person who paid (and is owed) can mark splits as settled
    expense_id IN (SELECT id FROM public.expenses WHERE paid_by = auth.uid())
  );

-- Allow expense creators to manage (insert/delete) splits
DROP POLICY IF EXISTS "Expense creators can manage splits" ON public.expense_splits;

CREATE POLICY "Expense creators can manage splits"
  ON public.expense_splits FOR INSERT
  WITH CHECK (
    expense_id IN (SELECT id FROM public.expenses WHERE created_by = auth.uid())
  );

CREATE POLICY "Expense creators can delete splits"
  ON public.expense_splits FOR DELETE
  USING (
    expense_id IN (SELECT id FROM public.expenses WHERE created_by = auth.uid())
  );

-- Create receipts storage bucket policies
-- Note: The bucket must be created via Supabase dashboard or CLI first:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

-- Policy: House members can upload to receipts
CREATE POLICY "House members can upload to receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.houses
      WHERE id IN (
        SELECT house_id FROM public.house_members
        WHERE user_id = auth.uid() AND invite_status = 'accepted'
      )
    )
  );

-- Policy: House members can view receipts
CREATE POLICY "House members can view receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.houses
      WHERE id IN (
        SELECT house_id FROM public.house_members
        WHERE user_id = auth.uid() AND invite_status = 'accepted'
      )
    )
  );

-- Policy: Users can update own receipt files (expense creator)
CREATE POLICY "Users can update own receipt files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'receipts'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM public.expenses
      WHERE created_by = auth.uid()
    )
  );

-- Policy: Users can delete own receipt files (expense creator)
CREATE POLICY "Users can delete own receipt files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM public.expenses
      WHERE created_by = auth.uid()
    )
  );
