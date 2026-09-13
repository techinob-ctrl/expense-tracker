import { formatMoney } from "@/lib/money";
type Props = {
  title: string;
  amount: number;
  tone: "income" | "expense" | "balance";
};
const colors = {
  income: "text-emerald-700",
  expense: "text-rose-700",
  balance: "text-slate-900",
};
export default function SummaryCard({ title, amount, tone }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-medium text-slate-600">{title}</h2>
      <p
        className={`mt-3 break-all text-3xl font-bold tabular-nums ${colors[tone]}`}
      >
        {formatMoney(amount)}
      </p>
    </div>
  );
}
