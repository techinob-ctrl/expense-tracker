-- Run ONCE in fullstack-learning-hub's SQL Editor as postgres.
-- This migration only creates Expense Tracker objects. It does not modify notes.
-- Intentionally fail if the table already exists; do not silently accept drift.
BEGIN;

CREATE TABLE public.expense_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (
    char_length(btrim(title)) BETWEEN 1 AND 100
    AND title = btrim(title)
  ),
  -- USD cents, bounded by JavaScript's Number.MAX_SAFE_INTEGER.
  amount bigint NOT NULL CHECK (amount BETWEEN 1 AND 9007199254740991),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  date date NOT NULL CHECK (date BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX expense_transactions_user_date_idx
  ON public.expense_transactions (user_id, date DESC);

ALTER TABLE public.expense_transactions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.expense_transactions FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.expense_transactions TO authenticated;
-- Clients cannot change IDs, ownership, or creation timestamps.
GRANT INSERT (title, amount, type, date)
  ON public.expense_transactions TO authenticated;
GRANT UPDATE (title, amount, type, date)
  ON public.expense_transactions TO authenticated;

CREATE POLICY expense_transactions_select_own
  ON public.expense_transactions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY expense_transactions_insert_own
  ON public.expense_transactions FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY expense_transactions_update_own
  ON public.expense_transactions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY expense_transactions_delete_own
  ON public.expense_transactions FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

COMMIT;
