import type { CategoryId } from "../lib/categories.ts";

export type Transaction = {
  id: string;
  title: string;
  // Store USD as integer cents: 1250 means $12.50.
  amount: number;
  type: "income" | "expense";
  date: string;
  category: CategoryId | null;
};

export type TransactionTypeFilter = Transaction["type"] | "all";
export type NewTransaction = Omit<Transaction, "id">;
