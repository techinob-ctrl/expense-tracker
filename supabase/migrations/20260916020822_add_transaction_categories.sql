-- Manual upgrade for the EXISTING table. Run once as postgres in SQL Editor.
-- No db push and no replay of the original CREATE TABLE migration.
-- Pause app writes while comparing the before/after verification results.
BEGIN;
SET LOCAL lock_timeout = '5s';

-- No DEFAULT or backfill: every existing row gets NULL (Uncategorized).
-- Intentionally fail on a duplicate column rather than accepting schema drift.
ALTER TABLE public.expense_transactions ADD COLUMN category text;

ALTER TABLE public.expense_transactions
  ADD CONSTRAINT expense_transactions_category_matches_type CHECK (
    category IS NULL
    OR (type = 'income' AND category IN ('salary', 'freelance', 'other_income'))
    OR (type = 'expense' AND category IN (
      'food', 'transport', 'housing', 'shopping', 'health', 'other_expense'
    ))
  );

-- Retain existing ownership restrictions and RLS policies.
GRANT INSERT (category), UPDATE (category)
  ON public.expense_transactions TO authenticated;

COMMIT;
