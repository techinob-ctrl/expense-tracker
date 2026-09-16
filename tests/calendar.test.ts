import test from "node:test";
import assert from "node:assert/strict";
import { getCurrentMonth } from "../lib/calendar.ts";

test("uses New York month at UTC month and year boundaries", () => {
  assert.equal(getCurrentMonth(new Date("2026-10-01T03:59:59Z")), "2026-09");
  assert.equal(getCurrentMonth(new Date("2026-10-01T04:00:00Z")), "2026-10");
  assert.equal(getCurrentMonth(new Date("2027-01-01T04:59:59Z")), "2026-12");
  assert.equal(getCurrentMonth(new Date("2027-01-01T05:00:00Z")), "2027-01");
});

test("formats single-digit months with leading zero", () => {
  assert.equal(getCurrentMonth(new Date("2027-02-15T12:00:00Z")), "2027-02");
});
