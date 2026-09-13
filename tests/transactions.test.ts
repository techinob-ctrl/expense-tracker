import assert from "node:assert/strict";
import test from "node:test";
import {
  addTransaction,
  deleteTransaction,
  updateTransaction,
  calculateBalance,
  calculateTotalExpense,
  calculateTotalIncome,
  filterTransactionsByMonth,
  filterTransactionsByType,
} from "../lib/transactions.ts";
import { formatMoney, parseMoneyToCents } from "../lib/money.ts";
import { transactions } from "../data/transactions.ts";
import type { NewTransaction } from "../types/transaction.ts";

test("parses dollar text into exact cents", () => {
  for (const [text, expected] of [["4.50", 450], ["0.29", 29], ["1", 100], [" 1.2 ", 120], ["0.01", 1]] as const) {
    assert.equal(parseMoneyToCents(text), expected);
  }
});

test("rejects invalid dollar input without silently rounding", () => {
  for (const text of ["", " ", "0", "-1", "1.005", "1e3", "NaN", "1,000", "90071992547409.92"]) {
    assert.throws(() => parseMoneyToCents(text));
  }
});

const newExpense: NewTransaction = {
  title: " Coffee ", amount: 450, type: "expense", date: "2026-09-05",
};

test("updates fields but preserves ID, order, and original inputs", () => {
  const original = structuredClone(transactions);
  const originalInput = structuredClone(newExpense);
  const result = updateTransaction(transactions, " 2 ", newExpense);
  assert.notEqual(result, transactions);
  assert.deepEqual(result.map((item) => item.id), transactions.map((item) => item.id));
  assert.deepEqual(result[1], { ...newExpense, title: "Coffee", id: "2" });
  assert.notEqual(result[1], transactions[1]);
  assert.equal(result[0], transactions[0]);
  assert.deepEqual(transactions, original);
  assert.deepEqual(newExpense, originalInput);
});

test("editing an expense recalculates the balance", () => {
  const result = updateTransaction(transactions, "2", { ...newExpense, amount: 1500 });
  assert.equal(calculateBalance(result), 338625);
});

test("editing type and date affects filters and totals", () => {
  const result = updateTransaction(transactions, "2", {
    ...newExpense, type: "income", date: "2026-10-01",
  });
  assert.equal(calculateTotalIncome(result), 345450);
  assert.equal(calculateTotalExpense(result), 4875);
  assert.deepEqual(filterTransactionsByMonth(result, "2026-10").map((item) => item.id), ["2"]);
});

test("update rejects blank IDs and nonexistent transactions", () => {
  assert.throws(() => updateTransaction(transactions, " ", newExpense), /ID is required/);
  assert.throws(() => updateTransaction(transactions, "missing", newExpense), /not found/);
  assert.throws(() => updateTransaction([], "2", newExpense), /not found/);
});

test("update uses the same validation as add and leaves input unchanged on failure", () => {
  const original = structuredClone(transactions);
  const invalidInputs: NewTransaction[] = [
    { ...newExpense, title: " " },
    { ...newExpense, title: "a".repeat(101) },
    { ...newExpense, amount: 0 },
    { ...newExpense, amount: -1 },
    { ...newExpense, amount: 1.5 },
    { ...newExpense, amount: NaN },
    { ...newExpense, amount: Infinity },
    { ...newExpense, amount: Number.MAX_SAFE_INTEGER + 1 },
    { ...newExpense, date: "2026-02-30" },
  ];
  for (const input of invalidInputs) {
    assert.throws(() => updateTransaction(transactions, "2", input));
  }
  // @ts-expect-error Simulate an invalid external type.
  assert.throws(() => updateTransaction(transactions, "2", { ...newExpense, type: "all" }), /Type/);
  assert.deepEqual(transactions, original);
});

test("deletes the matching ID and preserves the original list and order", () => {
  const original = structuredClone(transactions);
  const result = deleteTransaction(transactions, "2");
  assert.deepEqual(result.map((item) => item.id), ["1", "3", "4"]);
  assert.notEqual(result, transactions);
  assert.deepEqual(transactions, original);
  assert.equal(calculateTotalExpense(result), 4875);
  assert.equal(calculateBalance(result), 340125);
});

test("trims whitespace around the ID", () => {
  assert.deepEqual(deleteTransaction(transactions, " 2 "), deleteTransaction(transactions, "2"));
});

test("rejects blank and missing IDs without changing data", () => {
  const original = structuredClone(transactions);
  for (const id of ["", "   "]) {
    assert.throws(() => deleteTransaction(transactions, id), /ID is required/);
  }
  assert.throws(() => deleteTransaction(transactions, "missing"), /not found/);
  assert.throws(() => deleteTransaction([], "1"), /not found/);
  assert.deepEqual(transactions, original);
});

test("deleting the only transaction returns an empty array", () => {
  assert.deepEqual(deleteTransaction([transactions[0]], "1"), []);
});

test("uses ID rather than title to distinguish transactions", () => {
  const items = [
    { ...transactions[0], id: "a", title: "Same title" },
    { ...transactions[0], id: "b", title: "Same title" },
  ];
  assert.deepEqual(deleteTransaction(items, "a"), [items[1]]);
});

test("deleting income updates the balance and repeated deletion fails", () => {
  const result = deleteTransaction(transactions, "1");
  assert.equal(calculateBalance(result), 38875);
  assert.throws(() => deleteTransaction(result, "1"), /not found/);
});

test("adds a trimmed transaction with a generated ID without mutating inputs", () => {
  const original = structuredClone(transactions);
  const originalInput = structuredClone(newExpense);
  const result = addTransaction(transactions, newExpense);
  assert.equal(result.length, transactions.length + 1);
  assert.notEqual(result, transactions);
  assert.deepEqual(result.slice(0, -1), transactions);
  assert.deepEqual(transactions, original);
  assert.deepEqual(newExpense, originalInput);
  const added = result[result.length - 1];
  assert.match(added.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.deepEqual({ ...added, id: "generated" }, { ...newExpense, title: "Coffee", id: "generated" });
  assert.equal(calculateBalance(result), 338425);
});

test("adds income to an empty list and generates different IDs", () => {
  const input = { ...newExpense, type: "income" as const };
  const first = addTransaction([], input);
  const second = addTransaction([], input);
  assert.equal(calculateBalance(first), 450);
  assert.notEqual(first[0].id, second[0].id);
});

test("rejects blank and oversized titles", () => {
  for (const title of ["", "   ", "a".repeat(101)]) {
    assert.throws(() => addTransaction([], { ...newExpense, title }), /Title/);
  }
  assert.equal(addTransaction([], { ...newExpense, title: "a".repeat(100) }).length, 1);
});

test("rejects invalid amounts in cents", () => {
  for (const amount of [0, -1, 4.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => addTransaction([], { ...newExpense, amount }), /Amount/);
  }
  assert.equal(addTransaction([], { ...newExpense, amount: 1 })[0].amount, 1);
});

test("rejects malformed and impossible dates", () => {
  for (const date of ["", "2026-9-05", "2026-02-30", "2026-02-29", "2026-13-01", "2026-04-31"]) {
    assert.throws(() => addTransaction([], { ...newExpense, date }), /Date/);
  }
  assert.equal(addTransaction([], { ...newExpense, date: "2024-02-29" })[0].date, "2024-02-29");
});

test("rejects an invalid type at runtime", () => {
  // @ts-expect-error Deliberately simulate invalid external data.
  assert.throws(() => addTransaction([], { ...newExpense, type: "all" }), /Type/);
});

const mixedMonths = [
  ...transactions,
  { id: "5", title: "August lunch", amount: 1500, type: "expense" as const, date: "2026-08-31" },
  { id: "6", title: "October salary", amount: 300000, type: "income" as const, date: "2026-10-01" },
  { id: "7", title: "Last year", amount: 5000, type: "income" as const, date: "2025-09-01" },
];

test("type filter selects only income", () => {
  assert.deepEqual(filterTransactionsByType(transactions, "income").map((item) => item.id), ["1", "3"]);
});

test("type filter selects only expenses", () => {
  assert.deepEqual(filterTransactionsByType(transactions, "expense").map((item) => item.id), ["2", "4"]);
});

test("all returns every item in a new array without changing the input", () => {
  const original = structuredClone(transactions);
  const result = filterTransactionsByType(transactions, "all");
  assert.deepEqual(result, transactions);
  assert.notEqual(result, transactions);
  filterTransactionsByType(transactions, "expense");
  assert.deepEqual(transactions, original);
});

test("type filter handles empty lists and no matches", () => {
  assert.deepEqual(filterTransactionsByType([], "all"), []);
  assert.deepEqual(filterTransactionsByType([], "income"), []);
  assert.deepEqual(filterTransactionsByType([], "expense"), []);
  const income = filterTransactionsByType(transactions, "income");
  assert.deepEqual(filterTransactionsByType(income, "expense"), []);
});

test("month and type filters work together without changing monthly totals", () => {
  const monthly = filterTransactionsByMonth(mixedMonths, "2026-09");
  const visible = filterTransactionsByType(monthly, "expense");
  assert.deepEqual(visible.map((item) => item.id), ["2", "4"]);
  assert.equal(calculateTotalIncome(monthly), 345000);
  assert.equal(calculateBalance(monthly), 338875);
});

test("filters by both year and month", () => {
  assert.deepEqual(filterTransactionsByMonth(mixedMonths, "2026-09"), transactions);
});

test("includes the first and last day of the selected month", () => {
  const dates = ["2026-08-31", "2026-09-01", "2026-09-30", "2026-10-01"];
  const items = dates.map((date) => ({
    id: date, title: "Test", amount: 100, type: "expense" as const, date,
  }));
  assert.deepEqual(filterTransactionsByMonth(items, "2026-09").map((item) => item.date),
    ["2026-09-01", "2026-09-30"]);
});

test("returns an empty array for no matches or no transactions", () => {
  assert.deepEqual(filterTransactionsByMonth(mixedMonths, "2026-07"), []);
  assert.deepEqual(filterTransactionsByMonth([], "2026-09"), []);
});

test("rejects invalid month input", () => {
  for (const month of ["", "2026-9", "2026-00", "2026-13", "2026-09-01"]) {
    assert.throws(() => filterTransactionsByMonth(mixedMonths, month), /YYYY-MM/);
  }
});

test("filtering creates a new array without changing the input", () => {
  const original = structuredClone(mixedMonths);
  const filtered = filterTransactionsByMonth(mixedMonths, "2026-09");
  assert.notEqual(filtered, mixedMonths);
  assert.deepEqual(mixedMonths, original);
});

test("monthly totals exclude transactions from other months", () => {
  const filtered = filterTransactionsByMonth(mixedMonths, "2026-09");
  assert.equal(calculateTotalIncome(filtered), 345000);
  assert.equal(calculateTotalExpense(filtered), 6125);
  assert.equal(calculateBalance(filtered), 338875);
});

test("adds income and ignores expenses", () => {
  assert.equal(calculateTotalIncome(transactions), 345000);
});

test("formats cents as USD with thousands separators", () => {
  assert.equal(formatMoney(338875), "$3,388.75");
});

test("formats zero and whole dollars with two decimal places", () => {
  assert.equal(formatMoney(0), "$0.00");
  assert.equal(formatMoney(1000), "$10.00");
});

test("formats amounts smaller than a dollar", () => {
  assert.equal(formatMoney(1), "$0.01");
  assert.equal(formatMoney(99), "$0.99");
});

test("keeps the minus sign for a negative balance", () => {
  assert.equal(formatMoney(-250), "-$2.50");
});

test("returns zero for an empty list", () => {
  assert.equal(calculateTotalIncome([]), 0);
});

test("returns zero when there are only expenses", () => {
  const expenses = transactions.filter((transaction) => transaction.type === "expense");
  assert.equal(calculateTotalIncome(expenses), 0);
});

test("does not change the original transactions", () => {
  const original = structuredClone(transactions);
  calculateTotalIncome(transactions);
  calculateTotalExpense(transactions);
  calculateBalance(transactions);
  assert.deepEqual(transactions, original);
});

test("adds expenses and ignores income", () => {
  assert.equal(calculateTotalExpense(transactions), 6125);
});

test("expense and balance are zero for an empty list", () => {
  assert.equal(calculateTotalExpense([]), 0);
  assert.equal(calculateBalance([]), 0);
});

test("an income-only list has no expenses", () => {
  const income = transactions.filter((transaction) => transaction.type === "income");
  assert.equal(calculateTotalExpense(income), 0);
  assert.equal(calculateBalance(income), 345000);
});

test("subtracts expenses from income", () => {
  assert.equal(calculateBalance(transactions), 338875);
});

test("balance can be negative with mixed income and expenses", () => {
  assert.equal(calculateBalance([
    { id: "1", title: "Gift", amount: 1000, type: "income", date: "2026-09-01" },
    { id: "2", title: "Lunch", amount: 1250, type: "expense", date: "2026-09-01" },
  ]), -250);
});

test("an expense-only list has a negative balance", () => {
  const expenses = transactions.filter((transaction) => transaction.type === "expense");
  assert.equal(calculateBalance(expenses), -6125);
});

test("equal income and expenses give a zero balance", () => {
  assert.equal(calculateBalance([
    { id: "1", title: "Gift", amount: 1000, type: "income", date: "2026-09-01" },
    { id: "2", title: "Lunch", amount: 1000, type: "expense", date: "2026-09-01" },
  ]), 0);
});
