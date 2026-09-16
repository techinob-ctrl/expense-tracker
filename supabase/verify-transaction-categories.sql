-- READ ONLY. Run section 1 BEFORE and AFTER the upgrade, with app writes paused.
-- Run sections 2-5 only AFTER migrations/20260916020822_add_transaction_categories.sql succeeds.

-- 1. Row count, exact sum, and fingerprint of ALL original fields.
-- Expected: identical before/after values for every row in this result.
-- Fingerprint is intended for this small learning dataset (not a backup).
SELECT user_id, count(*) AS row_count, sum(amount) AS total_cents,
  md5(string_agg(
    jsonb_build_array(id, user_id, title, amount, type, date, created_at)::text,
    ',' ORDER BY id
  )) AS original_fields_fingerprint
FROM public.expense_transactions
GROUP BY user_id
ORDER BY user_id;

-- 2. Expected: text / YES / NULL, and category_matches_type is present.
SELECT data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'expense_transactions'
  AND column_name = 'category';
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.expense_transactions'::regclass
  AND conname = 'expense_transactions_category_matches_type';

-- 3. Immediately after upgrade, categorized_count = 0; row_count = uncategorized_count.
SELECT count(*) AS row_count,
  count(*) FILTER (WHERE category IS NULL) AS uncategorized_count,
  count(category) AS categorized_count
FROM public.expense_transactions;

-- 4. Expected: true, true, false, false, false.
SELECT
  has_column_privilege('authenticated', 'public.expense_transactions', 'category', 'INSERT') AS can_insert_category,
  has_column_privilege('authenticated', 'public.expense_transactions', 'category', 'UPDATE') AS can_update_category,
  has_column_privilege('authenticated', 'public.expense_transactions', 'user_id', 'UPDATE') AS can_change_owner,
  has_column_privilege('anon', 'public.expense_transactions', 'category', 'INSERT') AS anon_can_insert_category,
  has_column_privilege('anon', 'public.expense_transactions', 'category', 'UPDATE') AS anon_can_update_category;

-- 5. Expected: rowsecurity = true and the SAME four owner policies as before.
SELECT rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'expense_transactions';
SELECT policyname, cmd, roles, qual, with_check FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'expense_transactions'
ORDER BY cmd;
