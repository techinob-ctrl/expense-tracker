import ExpenseDashboard from "@/components/expense-dashboard";
import { transactions } from "@/data/transactions";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string | string[];
    type?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const validMonth =
    typeof params.month === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month);
  const month = validMonth ? (params.month as string) : "2026-09";
  const type =
    params.type === "income" || params.type === "expense" ? params.type : "all";
  const invalidFilters =
    (params.month !== undefined && !validMonth) ||
    (params.type !== undefined &&
      params.type !== "all" &&
      params.type !== "income" &&
      params.type !== "expense");
  return (
    <ExpenseDashboard
      initialTransactions={transactions}
      initialMonth={month}
      initialType={type}
      invalidFilters={invalidFilters}
    />
  );
}
