# Expense Tracker

Next.js learning app with sample transactions, monthly/type filters, a shared add/edit transaction form, and Delete buttons with confirmation. All changes live in React state only: refreshing or closing the page discards additions, edits, and deletions. No login or database yet.

Enter positive USD amounts with up to two decimal places (for example, `4.50`). Adding an entry shows its month and all types. Applying or resetting filters preserves temporary entries without reloading the page; the selected filters are reflected in the URL.

Select Edit to prefill the form with an existing transaction. Save changes preserves its ID and shows the updated transaction's month with all types. Cancel editing returns to the add form without saving the draft.

## Local development

Requires Node.js 24+.

```bash
npm ci
npm run dev
```

Open http://localhost:3001 (separate from Notes App).

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The types, sample data, and library functions were copied from the separate expense-tracker-logic exercise. They are independent copies, not automatically synchronized. Money is stored as integer USD cents. No environment variables are needed at this stage.
