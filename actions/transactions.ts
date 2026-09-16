"use server";

import { createClient } from "@/lib/supabase/server";
import { validateTransactionInput } from "@/lib/transactions";
import { parseTransactionRecords } from "@/lib/transaction-records";
import type { Transaction } from "@/types/transaction";

type CreateResult = { transaction: Transaction; error?: never } | { error: string; transaction?: never };

export async function removeTransaction(id: unknown): Promise<{ deletedId: string; error?: never } | { error: string; deletedId?: never }> {
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { error: "Invalid transaction ID. Refresh and try again." };
  }
  try {
    const supabase = await createClient(true);
    const { data: identity, error: authError } = await supabase.auth.getClaims();
    if (authError || !identity?.claims?.sub) {
      return { error: "Please sign in again before deleting a transaction." };
    }
    const { data, error } = await supabase.from("expense_transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", identity.claims.sub)
      .select("id")
      .maybeSingle();
    if (error) return { error: "Could not delete the transaction. Check your connection and permissions." };
    if (!data) return { error: "Transaction not found or unavailable. Refresh your records." };
    if (typeof data.id !== "string" || data.id.toLowerCase() !== id.toLowerCase()) {
      return { error: "Could not confirm deletion. Refresh your records." };
    }
    return { deletedId: data.id };
  } catch {
    return { error: "Could not confirm deletion. Refresh and check your records before trying again." };
  }
}

export async function saveTransaction(id: unknown, input: unknown): Promise<CreateResult> {
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { error: "Invalid transaction ID. Refresh and try again." };
  }
  let payload;
  try {
    payload = validateTransactionInput(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid transaction." };
  }

  try {
    const supabase = await createClient(true);
    const { data: identity, error: authError } = await supabase.auth.getClaims();
    if (authError || !identity?.claims?.sub) {
      return { error: "Please sign in again before editing a transaction." };
    }
    // Match both the requested record and its verified owner, in addition to RLS.
    const { data, error } = await supabase.from("expense_transactions")
      .update(payload)
      .eq("id", id)
      .eq("user_id", identity.claims.sub)
      .select("id, title, amount, type, date, category")
      .maybeSingle();
    if (error) return { error: "Could not save changes. Check your connection and permissions." };
    if (!data) return { error: "Transaction not found or unavailable. Refresh your records." };
    const [transaction] = parseTransactionRecords([data]);
    return { transaction };
  } catch {
    return { error: "Could not confirm the update. Refresh and check your records before trying again." };
  }
}

export async function createTransaction(input: unknown): Promise<CreateResult> {
  let payload;
  try {
    // Runtime validation is required even when the form uses TypeScript.
    // Only these five editable fields survive validation; ownership is never trusted.
    payload = validateTransactionInput(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid transaction." };
  }

  try {
    const supabase = await createClient(true);
    const { data: identity, error: authError } = await supabase.auth.getClaims();
    if (authError || !identity?.claims?.sub) {
      return { error: "Please sign in again before adding a transaction." };
    }

    // Database defaults generate id and user_id; the user's session enforces RLS.
    const { data, error } = await supabase.from("expense_transactions")
      .insert(payload)
      .select("id, title, amount, type, date, category")
      .single();
    if (error) return { error: "Could not save the transaction. Check your connection and permissions." };
    const [transaction] = parseTransactionRecords([data]);
    return { transaction };
  } catch {
    // A lost response can happen after a successful write. Do not auto-retry.
    return { error: "Could not confirm the save. Refresh and check your records before trying again." };
  }
}
