import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, filterTransactionsByCategory, getCategories, getCategoryLabel, isCategoryFilter, validateCategory } from "../lib/categories.ts";
import { validateTransactionInput, updateTransaction, filterTransactionsByMonth, filterTransactionsByType, calculateBalance } from "../lib/transactions.ts";
import { parseTransactionRecords } from "../lib/transaction-records.ts";
import type { Transaction } from "../types/transaction.ts";

const old: Transaction = { id: "old", title: "Lunch", amount: 1250, type: "expense", date: "2026-09-15", category: null };

test("every supported category is accepted only for its transaction type", () => {
  for (const category of CATEGORIES) {
    assert.equal(validateCategory(category.id, category.type), category.id);
    assert.throws(() => validateCategory(category.id, category.type === "income" ? "expense" : "income"));
  }
  assert.equal(getCategories("income").length, 3);
  assert.equal(getCategories("expense").length, 6);
});

test("legacy null category preserves every original field and totals", () => {
  assert.deepEqual(parseTransactionRecords([old]), [old]);
  assert.equal(getCategoryLabel(null), "Uncategorized");
  assert.equal(calculateBalance([old]), -1250);
  for (const type of ["income", "expense"] as const) assert.equal(validateCategory(null, type), null);
});

test("input and API boundaries reject missing, malformed, unknown, and mismatched categories", () => {
  for (const category of [undefined, "", "unknown", "salary", 1, {}, []]) {
    assert.throws(() => validateTransactionInput({ ...old, category }));
    assert.throws(() => parseTransactionRecords([{ ...old, category }]));
  }
});

test("editing a legacy record adds or clears category without changing identity or money", () => {
  const categorized = updateTransaction([old], old.id, { ...old, category: "food" });
  assert.deepEqual(categorized, [{ ...old, category: "food" }]);
  assert.equal(old.category, null);
  assert.equal(calculateBalance(categorized), calculateBalance([old]));
  assert.deepEqual(updateTransaction(categorized, old.id, old), [old]);
  assert.throws(() => updateTransaction(categorized, old.id, { ...categorized[0], type: "income" }));
});

test("category filter composes with month and type; monthly totals remain unchanged", () => {
  const rows: Transaction[] = [old,
    { ...old, id: "food", category: "food" },
    { ...old, id: "salary", type: "income", category: "salary", amount: 10000 },
    { ...old, id: "next-month", category: "food", date: "2026-10-01" },
  ];
  const before = structuredClone(rows);
  const month = filterTransactionsByMonth(rows, "2026-09");
  assert.deepEqual(filterTransactionsByCategory(filterTransactionsByType(month, "expense"), "food").map((item) => item.id), ["food"]);
  assert.deepEqual(filterTransactionsByCategory(month, "uncategorized"), [old]);
  assert.deepEqual(filterTransactionsByCategory(month, "all"), month);
  assert.notEqual(filterTransactionsByCategory(month, "all"), month);
  assert.deepEqual(filterTransactionsByCategory(filterTransactionsByType(month, "income"), "food"), []);
  assert.deepEqual(filterTransactionsByCategory([], "food"), []);
  assert.equal(calculateBalance(month), 7500);
  assert.deepEqual(rows, before);
});

test("URL category validation accepts only supported scalar values", () => {
  for (const value of ["all", "uncategorized", ...CATEGORIES.map((item) => item.id)]) assert.equal(isCategoryFilter(value), true);
  for (const value of [undefined, null, "", "unknown", ["food"], 1, {}]) assert.equal(isCategoryFilter(value), false);
});
