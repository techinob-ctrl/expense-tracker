import type { Transaction } from "../types/transaction.ts";

// Keep IDs in sync with supabase/migrations/20260916020822_add_transaction_categories.sql.
export const CATEGORIES = [
  { id: "salary", label: "Salary", type: "income" },
  { id: "freelance", label: "Freelance", type: "income" },
  { id: "other_income", label: "Other income", type: "income" },
  { id: "food", label: "Food & groceries", type: "expense" },
  { id: "transport", label: "Transport", type: "expense" },
  { id: "housing", label: "Housing & bills", type: "expense" },
  { id: "shopping", label: "Shopping", type: "expense" },
  { id: "health", label: "Health", type: "expense" },
  { id: "other_expense", label: "Other expense", type: "expense" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export type CategoryFilter = CategoryId | "all" | "uncategorized";

export function getCategories(type: Transaction["type"]) {
  return CATEGORIES.filter((category) => category.type === type);
}

export function validateCategory(value: unknown, type: Transaction["type"]): CategoryId | null {
  if (value === null) return null;
  const category = CATEGORIES.find((category) => category.id === value && category.type === type);
  if (!category) throw new Error("Choose a category that matches the transaction type.");
  return category.id;
}

export function getCategoryLabel(category: CategoryId | null): string {
  return CATEGORIES.find((item) => item.id === category)?.label ?? "Uncategorized";
}

export function isCategoryFilter(value: unknown): value is CategoryFilter {
  return value === "all" || value === "uncategorized" || CATEGORIES.some((item) => item.id === value);
}

export function filterTransactionsByCategory(transactions: Transaction[], category: CategoryFilter): Transaction[] {
  return transactions.filter((transaction) => category === "all" ||
    (category === "uncategorized" ? transaction.category === null : transaction.category === category));
}
