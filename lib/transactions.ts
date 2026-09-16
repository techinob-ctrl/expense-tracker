import type { Transaction, NewTransaction, TransactionTypeFilter } from "../types/transaction.ts";
import { validateCategory } from "./categories.ts";

export function validateTransactionInput(value: unknown): NewTransaction {
  if (typeof value !== "object" || value === null) {
    throw new Error("Transaction details are required.");
  }
  const input = value as Record<string, unknown>;
  if (typeof input.title !== "string" || typeof input.amount !== "number" || typeof input.date !== "string") {
    throw new Error("Invalid transaction fields.");
  }
  const title = input.title.trim();

  if (!title || title.length > 100) {
    throw new Error("Title must contain 1 to 100 characters.");
  }

  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new Error("Amount must be a positive safe integer in cents.");
  }

  if (input.type !== "income" && input.type !== "expense") {
    throw new Error("Type must be income or expense.");
  }

  // Compare the parsed date back to the input to reject dates such as February 30.
  const parsedDate = new Date(`${input.date}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) || input.date.startsWith("0000") ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== input.date
  ) {
    throw new Error("Date must be a valid calendar date in YYYY-MM-DD format.");
  }

  return {
    title,
    amount: input.amount,
    type: input.type,
    date: input.date,
    category: validateCategory(input.category, input.type),
  };
}

export function addTransaction(
  transactions: Transaction[],
  input: NewTransaction,
): Transaction[] {
  const validInput = validateTransactionInput(input);
  const newTransaction: Transaction = {
    ...validInput,
    id: crypto.randomUUID(),
  };

  return [...transactions, newTransaction];
}

// Each transaction must have a unique ID.
export function deleteTransaction(
  transactions: Transaction[],
  id: string,
): Transaction[] {
  const trimmedId = id.trim();

  if (!trimmedId) {
    throw new Error("Transaction ID is required.");
  }

  const exists = transactions.some((transaction) => transaction.id === trimmedId);

  if (!exists) {
    throw new Error("Transaction not found.");
  }

  return transactions.filter((transaction) => transaction.id !== trimmedId);
}

// Replaces all editable fields; the existing ID and list order are preserved.
export function updateTransaction(
  transactions: Transaction[],
  id: string,
  input: NewTransaction,
): Transaction[] {
  const trimmedId = id.trim();

  if (!trimmedId) {
    throw new Error("Transaction ID is required.");
  }

  const exists = transactions.some((transaction) => transaction.id === trimmedId);
  if (!exists) {
    throw new Error("Transaction not found.");
  }

  const validInput = validateTransactionInput(input);

  return transactions.map((transaction) => {
    if (transaction.id === trimmedId) {
      return { ...validInput, id: transaction.id };
    }

    return transaction;
  });
}

export function calculateTotalIncome(transactions: Transaction[]): number {
  return transactions.reduce((total, transaction) => {
    if (transaction.type === "income") {
      return total + transaction.amount;
    }

    return total;
  }, 0);
}

export function calculateTotalExpense(transactions: Transaction[]): number {
  return transactions.reduce((total, transaction) => {
    if (transaction.type === "expense") {
      return total + transaction.amount;
    }

    return total;
  }, 0);
}

export function calculateBalance(transactions: Transaction[]): number {
  const totalIncome = calculateTotalIncome(transactions);
  const totalExpense = calculateTotalExpense(transactions);

  return totalIncome - totalExpense;
}

// Dates must be valid calendar dates stored as YYYY-MM-DD.
export function filterTransactionsByMonth(
  transactions: Transaction[],
  month: string,
): Transaction[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error("Month must use YYYY-MM format, for example 2026-09.");
  }

  return transactions.filter((transaction) => transaction.date.slice(0, 7) === month);
}

export function filterTransactionsByType(
  transactions: Transaction[],
  type: TransactionTypeFilter,
): Transaction[] {
  return transactions.filter((transaction) => {
    if (type === "all") {
      return true;
    }

    return transaction.type === type;
  });
}
