"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { NewTransaction, Transaction } from "@/types/transaction";
import { parseMoneyToCents } from "@/lib/money";

export default function TransactionForm({
  onSubmitTransaction,
  initialTransaction,
  onCancel,
}: {
  onSubmitTransaction: (input: NewTransaction) => void;
  initialTransaction?: Transaction;
  onCancel?: () => void;
}) {
  const [error, setError] = useState("");
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const type = data.get("transactionType");
      if (type !== "income" && type !== "expense")
        throw new Error("Choose income or expense.");
      onSubmitTransaction({
        title: String(data.get("title") ?? ""),
        amount: parseMoneyToCents(String(data.get("amount") ?? "")),
        type,
        date: String(data.get("date") ?? ""),
      });
      form.reset();
      setError("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save transaction.",
      );
    }
  }

  const field =
    "mt-2 block w-full rounded-lg border border-slate-300 p-2 focus-visible:outline-2 focus-visible:outline-emerald-700";
  return (
    <section id="transaction-form" className="mb-6 scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-xl font-bold">{initialTransaction ? "Edit transaction" : "Add transaction"}</h2>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Title
          <input
            name="title"
            defaultValue={initialTransaction?.title ?? ""}
            required
            maxLength={100}
            className={field}
            placeholder="e.g. Coffee"
          />
        </label>
        <label className="text-sm font-semibold">
          Amount (USD)
          <input
            name="amount"
            defaultValue={initialTransaction ? `${Math.floor(initialTransaction.amount / 100)}.${String(initialTransaction.amount % 100).padStart(2, "0")}` : ""}
            type="text"
            inputMode="decimal"
            required
            className={field}
            placeholder="4.50"
            aria-describedby="amount-help"
          />
          <span
            id="amount-help"
            className="mt-1 block font-normal text-slate-500"
          >
            Positive amount, up to 2 decimal places. No commas.
          </span>
        </label>
        <label className="text-sm font-semibold">
          Transaction type
          <select
            name="transactionType"
            defaultValue={initialTransaction?.type ?? "expense"}
            className={field}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Date
          <input name="date" type="date" required defaultValue={initialTransaction?.date ?? ""} className={field} />
        </label>
        <p role="alert" className="text-sm text-red-700 sm:col-span-2">
          {error}
        </p>
        <button
          type="submit"
          className="cursor-pointer rounded-lg bg-emerald-800 px-4 py-2 font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:col-span-2"
        >
          {initialTransaction ? "Save changes" : "Add transaction"}
        </button>
        {initialTransaction && <button type="button" onClick={onCancel} className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-50 sm:col-span-2">Cancel editing</button>}
      </form>
    </section>
  );
}
