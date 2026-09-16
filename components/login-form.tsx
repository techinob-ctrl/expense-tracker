"use client";

import { useActionState } from "react";
import { signIn } from "@/actions/auth";

export default function LoginForm() {
  const [error, action, pending] = useActionState(signIn, "");
  return (
    <form action={action} className="mt-6 space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block font-medium">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required
          className="w-full rounded-xl border border-slate-300 px-4 py-3" />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block font-medium">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required
          className="w-full rounded-xl border border-slate-300 px-4 py-3" />
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending}
        className="w-full cursor-pointer rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
