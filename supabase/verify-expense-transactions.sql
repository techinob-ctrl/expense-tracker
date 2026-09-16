-- Read-only structural checks after applying the migration.
-- These do not replace end-to-end tests with two authenticated users.
SELECT c.relname, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'expense_transactions';

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'expense_transactions'
ORDER BY cmd;

SELECT
  has_table_privilege('anon', 'public.expense_transactions', 'SELECT') AS anon_can_read,
  has_column_privilege('authenticated', 'public.expense_transactions', 'title', 'INSERT') AS can_insert_title,
  has_column_privilege('authenticated', 'public.expense_transactions', 'user_id', 'UPDATE') AS can_change_owner;
-- Expected: false, true, false.
