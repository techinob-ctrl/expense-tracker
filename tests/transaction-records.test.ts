import test from "node:test";
import assert from "node:assert/strict";
import { parseTransactionRecords } from "../lib/transaction-records.ts";

const record = { id: "sample-id", title: "Lunch", amount: 1250, type: "expense", date: "2026-09-14", category: null };

test("reads database cents and calendar date without conversion", () => {
  assert.deepEqual(parseTransactionRecords([record]), [record]);
});
test("accepts an empty database result", () => {
  assert.deepEqual(parseTransactionRecords([]), []);
});
test("rejects malformed responses and rows", () => {
  for (const value of [null, {}, [null], [{ ...record, title: null }], [{ ...record, id: "" }]]) {
    assert.throws(() => parseTransactionRecords(value));
  }
});
test("rejects unsafe money, invalid types, and impossible dates", () => {
  for (const patch of [{ amount: "1250" }, { amount: 1.5 }, { amount: Number.MAX_SAFE_INTEGER + 1 }, { type: "other" }, { date: "2026-02-30", category: null }]) {
    assert.throws(() => parseTransactionRecords([{ ...record, ...patch }]));
  }
});
test("strips fields not needed by the dashboard without mutating input", () => {
  const input = { ...record, user_id: "private-owner" };
  assert.deepEqual(parseTransactionRecords([input]), [record]);
  assert.equal(input.user_id, "private-owner");
});
