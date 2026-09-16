# Expense Tracker

## Handoff snapshot — 2026-09-15

This is the active learning project. Read `AGENTS.md` for collaboration rules,
then this README before continuing. The local working tree, not the remote repo,
contains the latest implementation; Auth, CRUD and categories were pushed in `01f12b2`.

- Completed: email/password login/logout, protected home page, session refresh,
  database-backed create/read/update/delete, USD-cent validation, monthly totals,
  month/type filters, pending/error states, and deletion confirmation.
- Category implementation checks (2026-09-15): TypeScript, ESLint, production
  build, and 59 Node tests passed. These automated results are historical; the
  following browser checks were subsequently reported as passing by the user.
- User reported **all manual checks passed**: add and refresh, edit and refresh,
  cancel deletion, confirm deletion and refresh, and account B cannot see account A's
  entries. This is user-reported QA, not an automated live-RLS/security audit.
- Categories implemented locally: fixed income/expense choices, add/edit selection,
  list labels, URL-backed category filter, and runtime validation of input/API rows.
  Existing rows retain all original values; the additive SQL leaves category NULL
  (Uncategorized). Monthly totals still include all types and categories.
- User ran category SQL in SQL Editor and reported verification sections 1-5 passed:
  original row count, total cents and fingerprint matched; column, constraint, grants,
  RLS and policies matched expectations.
- User-reported category browser QA passed: original Uncategorized entry retained;
  add category and refresh; edit category and refresh; Expense to Income resets
  category, then Salary persists after save/refresh; month/type/category filters,
  filtered URL refresh, incompatible filter empty state, reset, and stable monthly
  totals; account B cannot see A's test entry and A still sees it after signing back in.
- User also reported the final category checks passed: cancelling a category edit
  retains the saved category; clearing it to Uncategorized persists after save and
  refresh without changing amount or type. The planned category manual checks are
  complete. Earlier CRUD QA remains historical; these reports do not constitute
  an automated security audit.
- Vercel project `expense-tracker` is linked to this GitHub repository. Production
  deployment verification is in progress; Notes App remains a separate project.
- Repository: https://github.com/techinob-ctrl/expense-tracker . Last local commit
  at the original handoff: `7b04159`; Auth, CRUD and categories were subsequently
  committed and pushed in `01f12b2`. Current-month deployment work follows that commit.

### Categories — manual SQL upgrade (2026-09-15)

The user has already applied this upgrade through SQL Editor and verified sections
1-5. Do not rerun it because its file was moved. The procedure below is retained
for a database that has not received the upgrade. The agent did not run remote SQL,
push, or deploy during the SQL upgrade.

1. Open **fullstack-learning-hub → SQL Editor**, role `postgres`. Pause app writes.
   Export `public.expense_transactions` as CSV from Table Editor as a precaution.
   Do not run the original CREATE TABLE migration or `db push`.
2. Open [verify-transaction-categories.sql](supabase/verify-transaction-categories.sql).
   Run **section 1 only** before the upgrade and keep the results: row count,
   exact total cents, and fingerprint of every original field for each owner.
   Also keep the result of section 5 (RLS and four policies) for comparison.
3. Run all of [20260916020822_add_transaction_categories.sql](supabase/migrations/20260916020822_add_transaction_categories.sql)
   once. Expected: success. It adds a nullable text column, checks the category/type
   pairing, and grants authenticated users INSERT/UPDATE on `category` only.
   Existing records stay Uncategorized; there is no UPDATE, DELETE, or backfill.
   If it fails, stop and share the error; the transaction prevents partial changes.
   If you already ran it successfully, do not rerun it (duplicate-column failure).
4. Run the entire verification file. Section 1 must match your saved results;
   section 2 must show `text / YES / NULL` and the category constraint;
   section 3 must show every row Uncategorized; section 4 must show
   `true, true, false, false, false`; section 5 must retain RLS and the same policies.
   An empty table legitimately gives no rows in section 1.
5. Run `npm.cmd run dev`, sign in, and refresh. Old entries should display
   **Uncategorized**, with the same titles, dates, amounts, and monthly totals.
6. Use disposable test entries: add income with Salary and expense with Food &
   groceries; refresh to check persistence. Edit the category, clear it to
   Uncategorized, cancel an edit, and change transaction type (category resets).
   Test month/type/category filters together, refresh the filtered URL, and reset.
   Conflicting filters (Income + Food) correctly show no entries. Totals stay monthly.
7. Sign in as account B and confirm A's entries remain hidden. Recheck CRUD only
   using disposable entries. Metadata checks above do not prove live RLS isolation.

Fixed categories are defined in `lib/categories.ts`. They are not user-editable.
Income: Salary, Freelance, Other income. Expense: Food & groceries, Transport,
Housing & bills, Shopping, Health, Other expense. Uncategorized is allowed for both.
Adding or saving resets list filters to the saved month / all types / all categories.

The nullable column approach follows the [Supabase table documentation](https://supabase.com/docs/guides/database/tables).

### SQL file organization

```text
supabase/
├─ migrations/
│  ├─ 202609140001_create_expense_transactions.sql
│  └─ 20260916020822_add_transaction_categories.sql
├─ verify-expense-transactions.sql
└─ verify-transaction-categories.sql
```

Schema-changing SQL lives in `migrations/`; read-only verification stays outside.
Both migrations were applied manually by the user in SQL Editor. The category
filename timestamp records local file creation, not when SQL was executed remotely.
Moving the unchanged SQL does not execute it or register CLI migration history.
Before using CLI migrations, reconcile the actual schema and migration history;
do not replay either file on this existing database.

### File and function map

| File | Responsibility / main functions |
| --- | --- |
| `app/page.tsx` | `Home`: verify identity, read records, pass initial data and filters to dashboard |
| `app/login/page.tsx` | Login route; redirects an already signed-in user |
| `actions/auth.ts` | `signIn(previous, formData)`, `signOut()` |
| `actions/transactions.ts` | `createTransaction(input)`, `saveTransaction(id, input)`, `removeTransaction(id)` |
| `lib/supabase/server.ts` | `createClient(writable = false)`: session-aware server client |
| `lib/supabase/transactions.ts` | `readTransactions(supabase, userId)`: owner-filtered read |
| `proxy.ts` | Refresh session cookies; currently matches only `/` and `/login` |
| `components/expense-dashboard.tsx` | `handleAdd(input)`, `handleSave(input)`, `handleDelete(transaction)`; state and filters |
| `components/transaction-form.tsx` | `handleSubmit(event)`: reads fields, converts money, awaits callback |
| `lib/transactions.ts` | `validateTransactionInput(value)` and pure calculation/filter/exercise helpers |
| `lib/categories.ts` | Category catalog, `getCategories(type)`, `validateCategory(value, type)`, `filterTransactionsByCategory(transactions, category)` |
| `lib/transaction-records.ts` | `parseTransactionRecords(records)`: runtime validation of API response |
| `lib/money.ts` | `parseMoneyToCents(text)`, `formatMoney(amount)` |
| `types/transaction.ts` | Transaction types |
| `tests/` | Pure logic, input and response validation; not live Server Action/RLS tests |
| `supabase/` | Existing schema migration and read-only structural verification SQL |

```text
TransactionForm.handleSubmit(event)
└─ onSubmitTransaction(input)
   ├─ handleAdd(input) → createTransaction(input)
   └─ handleSave(input) → saveTransaction(editingId, input)
      └─ validate input + verify session → database mutation
         ├─ { transaction } → update dashboard state
         └─ { error } → keep draft and show error

handleDelete(transaction)
└─ confirm → removeTransaction(transaction.id)
   └─ verify session → delete by id AND verified user_id
      ├─ { deletedId } → remove from dashboard state
      └─ { error } → retain visible entry and show error
```

### Known limitations / not yet implemented

- Default/reset month uses the current calendar month in `America/New_York`,
  consistently on the server and browser. Explicit valid URL months are preserved.
- Reads are limited to 1,000 rows (or the configured API cap); incomplete reads
  show an error rather than incorrect totals. No pagination yet.
- Updates are last-write-wins; no conflict detection or realtime cross-tab sync.
- No idempotency keys for inserts; after a lost response, refresh before retrying.
- Individual amounts are safe integer cents; very large aggregate totals could
  still exceed JavaScript's safe integer range.
- No custom category management, charts, export, signup/password-reset UI, or in-app delete undo.
- Database was prepared manually in SQL Editor. CLI migration-history alignment
  has not been established: do not blindly run `db push` or replay the migration.

Next.js learning app with Supabase email/password login, database-backed transaction CRUD, monthly/type filters, a shared add/edit transaction form, and Delete buttons with confirmation. Additions, edits, and deletions persist through validated, authenticated Server Actions. Deletion is permanent with no in-app undo.

Enter positive USD amounts with up to two decimal places (for example, `4.50`). Adding an entry shows its month and all types. Applying or resetting filters preserves loaded entries without reloading the page; the selected filters are reflected in the URL.

Select Edit to prefill the form with an existing transaction. Save changes preserves its ID and shows the updated transaction's month with all types. Cancel editing returns to the add form without saving the draft.

## Local development

Requires Node.js 24+.

Current stack: Next.js 16.3.4, React 19.2.8, Tailwind CSS 4, TypeScript 5,
`@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.116.0, local Supabase CLI 2.117.0.
Use `package.json` and the lockfile as the source of truth for versions.
On Windows PowerShell use `npm.cmd` / `npx.cmd` if `.ps1` execution is blocked.

```bash
npm ci
npm run dev
```

Open http://localhost:3001 (separate from Notes App).

## Supabase database preparation

Use the existing `fullstack-learning-hub` project shared with Notes App.
The existing shared project already has the table, according to the user's setup
and manual QA. For a genuinely fresh database only, run
`supabase/migrations/202609140001_create_expense_transactions.sql` once
in its SQL Editor as `postgres`, then run `supabase/verify-expense-transactions.sql`.
Next apply the category migration and its verification using the steps above;
the current app requires both migrations.
Do not rerun the migration or drop an existing table if it reports a name conflict.
The migration leaves `public.notes` and Auth settings unchanged.

The new table stores positive USD cents, a calendar date, and an owner from
`auth.uid()`. The original schema permits title, amount, type, and date; the category upgrade adds category to the permitted fields. Column grants
prevent changing ownership; four RLS policies restrict CRUD to the owner.
Deleting an Auth user with expense records is deliberately restricted, not
cascaded: handle their records explicitly before deleting a shared account.
Auth accounts are shared between apps; separate tables are not app-level isolation.
Structural verification is not a substitute for two-user RLS integration tests.
The home page reads only the verified user's expense records using their session.
An empty result shows an empty list, never sample records. Failed/incomplete reads
show an error instead of misleading zero totals. The current learning step supports
up to 1,000 records (subject to the API's configured limit); larger results fail
explicitly until pagination is added. Inserts, edits and deletions persist.

Insert verification: add an entry, refresh, and confirm it remains. Check a second
account cannot see it. During saving the form is disabled; failures keep the draft.
If a response is lost, refresh and check before retrying to avoid duplicate entries.

Update verification: edit a saved entry's title, amount, type and date, then refresh
to confirm persistence. Moving its date switches the displayed month. Cancel makes
no request. A failed update keeps the draft open and does not change totals.
Updates filter by both record ID and verified user ID, with RLS still enforced.
Only editable fields are sent; IDs and ownership cannot be changed through this action.
Concurrent edits use last-write-wins; conflict detection is not implemented yet.

Delete verification: create a disposable test entry, cancel deletion once (it must
remain), then confirm deletion and refresh (it must stay removed). The server
filters by ID and verified owner and requires a returned deleted ID before showing
success. Failures retain the visible entry; refresh after an uncertain response.
Mutation controls are disabled while an add, edit or delete request is pending.
Verify with two accounts that another user's records cannot be deleted.

## Verification commands

The server client is in `lib/supabase/server.ts`. Copy `.env.example` to
`.env.local` and fill in the shared project's URL
and publishable key, using the same values as Notes App. Do not copy its site URL
or use a secret/service-role key. `.env.local` is ignored by Git.
Restart the dev server after setting environment variables.

Sign in at `/login` using an existing confirmed Notes App account. The home page
verifies identity with `getClaims`; `proxy.ts` refreshes cookies before rendering.
Server Actions use `createClient(true)` to persist login/logout cookies.
All clients use `expense-tracker-auth` to avoid cookie collisions with Notes App
on another localhost port. Logout uses local scope, leaving other sessions alone.
No signup or email redirect settings have been changed in the shared project.

Manual auth checks: signed-out visitors to `/` reach `/login`; wrong passwords
show an error; a valid login reaches `/`; refreshing retains login; logging out
blocks direct access to `/` again. Verify Notes App stays signed in separately.
Automated tests cover transaction logic and database response validation, not live
authentication or RLS. Manually verify reads with two different signed-in accounts.

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The types, sample data, and library functions were copied from the separate expense-tracker-logic exercise. They are independent copies, not automatically synchronized. Money is stored as integer USD cents. Environment variables are required for authentication.

## Current-month behavior

`getCurrentMonth(now = new Date())` returns `YYYY-MM` in `America/New_York`.
Home uses it when the URL month is missing/invalid; Reset calls it at click time.
Explicit valid month filters still work. Month/year boundary tests, TypeScript,
ESLint, production build, and all 61 tests passed before deployment.
