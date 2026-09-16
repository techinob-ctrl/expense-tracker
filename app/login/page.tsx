import { redirect } from "next/navigation";
import LoginForm from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (!error && data?.claims.sub) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="font-semibold text-emerald-700">Expense Tracker</p>
        <h1 className="mt-2 text-3xl font-bold">Welcome back</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sign in with your existing Notes App email and password.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
