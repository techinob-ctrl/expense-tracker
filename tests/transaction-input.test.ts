import test from "node:test";
import assert from "node:assert/strict";
import { validateTransactionInput } from "../lib/transactions.ts";

const input = { title: " Coffee ", amount: 450, type: "expense", date: "2026-09-15", category: null };

test("insert payload only includes editable fields and trims title", () => {
  assert.deepEqual(validateTransactionInput({ ...input, user_id: "someone-else", id: "forged", created_at: "forged" }), {
    title: "Coffee", amount: 450, type: "expense", date: "2026-09-15", category: null,
  });
});

test("server boundary rejects malformed input instead of trusting TypeScript", () => {
  for (const value of [null, undefined, [], "invalid", { ...input, title: 123 }, { ...input, amount: "450" }, { ...input, date: null }]) {
    assert.throws(() => validateTransactionInput(value));
  }
});

test("rejects year zero and invalid amounts before inserting", () => {
  for (const patch of [{ date: "0000-01-01", category: null }, { date: "2026-02-30", category: null }, { amount: 0 }, { amount: -1 }, { amount: 1.5 }, { amount: Infinity }]) {
    assert.throws(() => validateTransactionInput({ ...input, ...patch }));
  }
});
