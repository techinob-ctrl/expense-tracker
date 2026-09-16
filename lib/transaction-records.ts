import type { Transaction } from "../types/transaction.ts";
import { validateTransactionInput } from "./transactions.ts";

// Validate the API response instead of assuming that a TypeScript cast checks it.
export function parseTransactionRecords(records: unknown): Transaction[] {
  if (!Array.isArray(records)) throw new Error("Invalid transaction response.");
  return records.map((record: unknown) => {
    if (typeof record !== "object" || record === null) throw new Error("Invalid transaction.");
    const row = record as Record<string, unknown>;
    if (
      typeof row.id !== "string" || !row.id.trim() ||
      typeof row.title !== "string" || typeof row.amount !== "number" ||
      (row.type !== "income" && row.type !== "expense") || typeof row.date !== "string"
    ) throw new Error("Invalid transaction fields.");
    return {
      id: row.id,
      ...validateTransactionInput({ title: row.title, amount: row.amount, type: row.type, date: row.date, category: row.category }),
    };
  });
}
