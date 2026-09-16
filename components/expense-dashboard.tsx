"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type {
  Transaction,
  TransactionTypeFilter,
  NewTransaction,
} from "@/types/transaction";
import SummaryCard from "./summary-card";
import TransactionForm from "./transaction-form";
import { formatMoney } from "@/lib/money";
import { CATEGORIES, filterTransactionsByCategory, getCategoryLabel, isCategoryFilter } from "@/lib/categories";
import type { CategoryFilter } from "@/lib/categories";
import { createTransaction, saveTransaction, removeTransaction } from "@/actions/transactions";
import {
  calculateTotalIncome,
  calculateTotalExpense,
  calculateBalance,
  filterTransactionsByMonth,
  filterTransactionsByType,
} from "@/lib/transactions";

type Props = {
  initialTransactions: Transaction[];
  initialMonth: string;
  initialType: TransactionTypeFilter;
  initialCategory: CategoryFilter;
  invalidFilters: boolean;
};

export default function ExpenseDashboard({
  initialTransactions,
  initialMonth,
  initialType,
  initialCategory,
  invalidFilters,
}: Props) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [month, setMonth] = useState(initialMonth);
  const [type, setType] = useState<TransactionTypeFilter>(initialType);
  const [category, setCategory] = useState<CategoryFilter>(initialCategory);
  const [message, setMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const mutationInFlight = useRef(false);
  const busy = saving || deletingId !== null;
  const editingTransaction = transactions.find((transaction) => transaction.id === editingId);

  function handleEdit(transaction: Transaction) {
    if (mutationInFlight.current) return;
    setEditingId(transaction.id);
    setMessage("");
    setDeleteError("");
    document.getElementById("transaction-form")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSave(input: NewTransaction) {
    if (mutationInFlight.current) throw new Error("Please wait for the current operation.");
    if (!editingId) throw new Error("Choose a transaction to edit.");
    mutationInFlight.current = true;
    setMessage("");
    setSaving(true);
    try {
      const result = await saveTransaction(editingId, input);
      if (result.error) throw new Error(result.error);
      if (!result.transaction) throw new Error("Could not confirm the update. Refresh before retrying.");
      const updated = result.transaction;
      setTransactions((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditingId(null);
      applyFilters(updated.date.slice(0, 7), "all");
      setMessage("Changes saved to your account.");
    } finally {
      mutationInFlight.current = false;
      setSaving(false);
    }
  }

  function applyFilters(nextMonth: string, nextType: TransactionTypeFilter, nextCategory: CategoryFilter = "all") {
    setMonth(nextMonth);
    setType(nextType);
    setCategory(nextCategory);
    const url = new URL(window.location.href);
    url.searchParams.set("month", nextMonth);
    url.searchParams.set("type", nextType);
    url.searchParams.set("category", nextCategory);
    window.history.replaceState(null, "", url);
  }

  function handleFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextMonth = String(data.get("month") ?? "");
    const nextType = String(data.get("type") ?? "all");
    const nextCategory = data.get("category");
    if (!isCategoryFilter(nextCategory)) return;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(nextMonth)) return;
    if (nextType !== "all" && nextType !== "income" && nextType !== "expense")
      return;
    applyFilters(nextMonth, nextType, nextCategory);
  }

  async function handleAdd(input: NewTransaction) {
    if (mutationInFlight.current) throw new Error("Please wait for the current operation.");
    mutationInFlight.current = true;
    setSaving(true);
    try {
    setMessage("");
    const result = await createTransaction(input);
    if (result.error) throw new Error(result.error);
    if (!result.transaction) throw new Error("Could not confirm the saved transaction. Refresh before retrying.");
    const created = result.transaction;
    setTransactions((current) => [...current, created]);
    applyFilters(created.date.slice(0, 7), "all");
    setMessage(
      "Transaction saved to your account. Showing its month.",
    );
    } finally {
      mutationInFlight.current = false;
      setSaving(false);
    }
  }

  async function handleDelete(transaction: Transaction) {
    if (mutationInFlight.current) return;
    const confirmed = window.confirm(
      `Permanently delete "${transaction.title}" (${formatMoney(transaction.amount)})? This cannot be undone in the app.`,
    );
    if (!confirmed) return;
    mutationInFlight.current = true;
    setDeletingId(transaction.id);
    setMessage("");
    setDeleteError("");
    try {
      const result = await removeTransaction(transaction.id);
      if (result.error) throw new Error(result.error);
      if (!result.deletedId) throw new Error("Could not confirm deletion. Refresh your records.");
      setTransactions((current) => current.filter((item) => item.id !== result.deletedId));
      if (editingId === transaction.id) setEditingId(null);
      setDeleteError("");
      setMessage(`Deleted "${transaction.title}" from your account.`);
    } catch (error) {
      setMessage("");
      setDeleteError(error instanceof Error ? error.message : "Could not delete transaction.");
    } finally {
      mutationInFlight.current = false;
      setDeletingId(null);
    }
  }

  const monthlyTransactions = filterTransactionsByMonth(transactions, month);
  const visibleTransactions = filterTransactionsByCategory(
    filterTransactionsByType(monthlyTransactions, type),
    category,
  );
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-16">
      <header className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          Your money, made clear
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Expense Tracker
        </h1>
        <p className="mt-3 text-slate-600">
          A simple overview of what comes in and what goes out.
        </p>
        <p className="mt-5 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-900">
          Supabase · Changes are saved to your account · USD
        </p>
      </header>
      <TransactionForm
        key={editingId ?? "new"}
        initialTransaction={editingTransaction}
        disabled={busy}
        onSubmitTransaction={editingId ? handleSave : handleAdd}
        onCancel={() => setEditingId(null)}
      />
      <p role="status" className="mb-4 text-sm text-emerald-800">
        {message}
      </p>
      {deleteError && <p role="alert" className="mb-4 text-sm text-red-700">{deleteError}</p>}
      <form
        key={`${month}-${type}-${category}`}
        onSubmit={handleFilters}
        className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <div>
          <label htmlFor="month" className="mb-2 block text-sm font-semibold">
            Month
          </label>
          <input
            id="month"
            name="month"
            type="month"
            required
            defaultValue={month}
            className="rounded-lg border border-slate-300 p-2 focus-visible:outline-2 focus-visible:outline-emerald-700"
          />
        </div>
        <div>
          <label htmlFor="type" className="mb-2 block text-sm font-semibold">
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={type}
            className="cursor-pointer rounded-lg border border-slate-300 p-2 focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            <option value="all">All transactions</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
        </div>
        <div>
          <label htmlFor="category-filter" className="mb-2 block text-sm font-semibold">Category</label>
          <select id="category-filter" name="category" defaultValue={category} className="rounded-lg border border-slate-300 p-2 focus-visible:outline-2 focus-visible:outline-emerald-700">
            <option value="all">All categories</option>
            <option value="uncategorized">Uncategorized</option>
            {(["income", "expense"] as const).map((kind) => (
              <optgroup key={kind} label={kind === "income" ? "Income" : "Expense"}>
                {CATEGORIES.filter((item) => item.type === kind).map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="cursor-pointer rounded-lg bg-emerald-800 px-4 py-2 font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          Apply filters
        </button>
        <button
          type="button"
          onClick={() => applyFilters("2026-09", "all")}
          className="cursor-pointer rounded px-2 py-2 text-sm text-slate-600 underline"
        >
          Reset filters
        </button>
      </form>
      {invalidFilters && (
        <p role="status" className="mb-4 text-sm text-amber-800">
          Invalid filters were replaced with defaults: September 2026 for month,
          all transactions for type, or all categories for category.
        </p>
      )}
      <p className="mb-3 text-sm text-slate-600">
        Summary for {month}. Totals include all transaction types and categories for this
        month.
      </p>
      <section
        aria-label="Monthly financial summary"
        className="grid gap-4 sm:grid-cols-3"
      >
        <SummaryCard
          title="Monthly income"
          amount={calculateTotalIncome(monthlyTransactions)}
          tone="income"
        />
        <SummaryCard
          title="Monthly expenses"
          amount={calculateTotalExpense(monthlyTransactions)}
          tone="expense"
        />
        <SummaryCard
          title="Monthly balance"
          amount={calculateBalance(monthlyTransactions)}
          tone="balance"
        />
      </section>
      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Transactions</h2>
          <span className="text-sm text-slate-500">
            {visibleTransactions.length} entries
          </span>
        </div>
        {visibleTransactions.length === 0 && (
          <p className="py-8 text-center text-slate-600">
            No transactions match these filters. Try another month, type, or category.
          </p>
        )}
        <ul className="divide-y divide-slate-100">
          {visibleTransactions.map((transaction) => (
            <li
              key={transaction.id}
              className="flex flex-wrap items-center justify-between gap-3 py-5"
            >
              <div className="min-w-0 flex-1">
                <h3 className="wrap-anywhere font-semibold">
                  {transaction.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  <time dateTime={transaction.date}>{transaction.date}</time> ·{" "}
                  {transaction.type === "income" ? "Income" : "Expense"}
                  {" · "}{getCategoryLabel(transaction.category)}
                </p>
              </div>
              <p
                className={`font-semibold tabular-nums ${transaction.type === "income" ? "text-emerald-700" : "text-rose-700"}`}
              >
                {transaction.type === "income" ? "+" : "−"}
                {formatMoney(transaction.amount)}
              </p>
              <button
                type="button"
                onClick={() => handleEdit(transaction)}
                disabled={busy}
                aria-label={`Edit ${transaction.title}`}
                className="cursor-pointer rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(transaction)}
                disabled={busy}
                aria-label={`Delete ${transaction.title}`}
                className="cursor-pointer rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
              >
                {deletingId === transaction.id ? "Deleting…" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <footer className="mt-6 text-sm text-slate-500">
        Additions, edits, and deletions are saved to your Supabase account.
        Deleted records cannot be restored from this app.
      </footer>
    </main>
  );
}
