import type { Transaction } from "../types/transaction.ts";

export const transactions: Transaction[] = [
  {
    id: "1",
    title: "Salary",
    amount: 300000,
    type: "income",
    date: "2026-09-01",
  },
  {
    id: "2",
    title: "Lunch",
    amount: 1250,
    type: "expense",
    date: "2026-09-02",
  },
  {
    id: "3",
    title: "Freelance work",
    amount: 45000,
    type: "income",
    date: "2026-09-03",
  },
  {
    id: "4",
    title: "Groceries",
    amount: 4875,
    type: "expense",
    date: "2026-09-04",
  },
];
