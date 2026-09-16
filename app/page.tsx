import ExpenseDashboard from "@/components/expense-dashboard";
import { readTransactions } from "@/lib/supabase/transactions";
import type { Transaction } from "@/types/transaction";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logout-button";
import RetryLoadButton from "@/components/retry-load-button";
import { isCategoryFilter } from "@/lib/categories";
import { getCurrentMonth } from "@/lib/calendar";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string | string[];
    type?: string | string[];
    category?: string | string[];
  }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) redirect("/login");

  let transactions: Transaction[] = [];
  let loadFailed = false;
  try {
    transactions = await readTransactions(supabase, data.claims.sub);
  } catch {
    loadFailed = true;
  }

  const params = await searchParams;
  const validMonth =
    typeof params.month === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month);
  const month = validMonth ? (params.month as string) : getCurrentMonth();
  const type =
    params.type === "income" || params.type === "expense" ? params.type : "all";
  const invalidFilters =
    (params.category !== undefined && !isCategoryFilter(params.category)) ||
    (params.month !== undefined && !validMonth) ||
    (params.type !== undefined &&
      params.type !== "all" &&
      params.type !== "income" &&
      params.type !== "expense");
  return (
    <>
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 pt-6">
      <p className="text-sm text-slate-600">Signed in as {data.claims.email}</p>
      <LogoutButton />
    </header>
    {loadFailed ? (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-bold">Unable to load transactions</h1>
        <p role="alert" className="mt-3 text-red-700">
          Your data could not be loaded completely. No totals are shown. Please retry.
        </p>
        <RetryLoadButton />
      </main>
    ) : <ExpenseDashboard
      key={data.claims.sub}
      initialTransactions={transactions}
      initialMonth={month}
      initialType={type}
      initialCategory={isCategoryFilter(params.category) ? params.category : "all"}
      invalidFilters={invalidFilters}
    />}
    </>
  );
}
