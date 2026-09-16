# Expense Tracker — working agreement

## Start here

- Active project: `C:/Users/Techino/CodingStudy/PracticeCoding/expense-tracker`.
- Read this file and README.md's dated handoff before editing. Inspect current
  `git status`, relevant code, package versions, and any applicable parent instructions.
- README holds project status and known limitations; this file holds stable rules.
  Neither replaces checking the current working tree.
- There are substantial uncommitted changes at the 2026-09-15 handoff. Preserve them.
  Do not reset, overwrite, or reconstruct the app from the initial Git commit.

## Collaboration with the user

- The user is a Thai-speaking full-stack learner. Latest preference supersedes
  the original hints-only approach: implement requested code, verify, then explain.
- Interpret “ต่อ” as the next small step in the agreed plan, not permission for
  unrelated refactors, deployment, or changes to shared services.
- Explain briefly with function names, parameters, values passed to the next
  function, and returned results. Follow with a simple text tree in a code fence.
  Avoid long prose, Mermaid, or interactive diagrams unless requested.
- The user does dashboard work (Supabase setup / SQL execution) themselves.
  Prepare reviewed SQL and concise steps with expected results; pause for their
  result when subsequent code depends on a database change.
- Do not run remote SQL, push GitHub, deploy, or create another project without
  explicit authorization. Do not create a new task/chat unless requested.
- Do not spawn subagents unless explicitly requested or required by applicable instructions.

## Shared database boundaries

- Supabase project: `fullstack-learning-hub`, shared with Notes App and future exercises.
- Expense data is `public.expense_transactions`; Notes App uses `public.notes`.
  Leave Notes App, its data, Auth settings, and redirect URLs unchanged.
- Auth users are shared. Do not delete users as test cleanup; this affects other apps.
- Existing table fields: id, user_id, title, amount, type, date, created_at.
  No updated_at. The user applied category SQL manually and reported all five
  verification sections passed. Category persistence, filters, and two-account
  visibility checks subsequently passed per user report; see README for scope.
- Keep RLS enabled. Every mutation verifies identity on the server. Update/delete
  filter both record ID and verified owner ID; never trust a form-supplied owner.
- INSERT/UPDATE grants allow title, amount, type, date, category after the
  user-applied upgrade. Database defaults generate id and user_id.
- Do not use a service-role key to bypass permissions. Do not print, commit, or
  include `.env.local`, passwords, session tokens, or credentials in documentation.
- Schema was applied manually. Do not replay the initial migration or run db push
  without checking actual schema and migration history. Preserve existing records.
- Follow applicable Supabase/database skills for actual implementation work.

## Architecture and invariants

- Server Components read with `createClient()`; Actions use `createClient(true)`.
- Both server client and Proxy use cookie name `expense-tracker-auth`; this avoids
  collisions with Notes App on a different localhost port. Keep them consistent.
- Proxy refreshes cookies, while protected pages and Actions verify identity.
  Matcher currently covers `/` and `/login`; review when adding protected routes.
- Store money as positive integer USD cents, never floating-point dollars.
  Dates are calendar strings YYYY-MM-DD, not timezone-converted instants.
- Runtime input validation returns only allowed editable fields; TypeScript alone
  does not validate network input. Validate API responses before using them.
- Change displayed records only after a confirmed mutation result. Preserve drafts
  on failure; disable conflicting mutations while pending; use functional state updates.
- Keep delete confirmation explicit about permanence. Never delete a real record
  just to test; use authorized disposable test data.
- Pure exercise helpers remain in lib/transactions.ts, but dashboard persistence
  uses actions/transactions.ts. Do not accidentally reconnect it to local-only CRUD.

## Verification and handoff

Use PowerShell-compatible commands from this project:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
git diff --check
```

- Run relevant tests plus typecheck/lint/build for implementation changes; inspect
  each result, not merely the last exit code of a sequence.
- For documentation-only changes, inspect the diff and links; full app rebuild
  is not needed unless code/config changed.
- Separate automated checks, direct runtime observations, and user-reported QA.
  Do not claim live RLS/security verification from unit tests or metadata checks.
- Last baseline: 53 tests/typecheck/lint/build passed; user reported CRUD persistence
  and two-account visibility checks passed. This is historical, not a fresh run.
- Category implementation uses fixed IDs and nullable text (NULL = Uncategorized).
  Manual SQL verification and core post-upgrade browser QA passed per user report.
  All planned category manual checks passed per user report, including cancelling
  edits and clearing a category to Uncategorized; README records the checked cases.
  Schema changes live in supabase/migrations; read-only verification stays outside.
  File organization does not establish CLI migration history; do not replay SQL.
- Update README status/limitations after meaningful milestones. Keep this file
  focused on conventions and leave the generated Next.js block below intact.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
