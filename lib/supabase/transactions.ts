import "server-only";
import type { createClient } from "./server";
import { parseTransactionRecords } from "../transaction-records";

export async function readTransactions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  // userId comes from verified claims, never from form input.
  // This filter complements the database's owner RLS policy; it does not replace it.
  const { data, error, count } = await supabase
    .from("expense_transactions")
    .select("id, title, amount, type, date, category", { count: "exact" })
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("id", { ascending: false })
    .limit(1000);

  if (error) throw new Error("Could not load transactions.");
  // Never show incomplete totals when the API row limit is reached.
  if (count === null || !data || count !== data.length) {
    throw new Error("Transaction result is incomplete. Pagination is required.");
  }
  return parseTransactionRecords(data);
}
