"use client";

import { useActionState } from "react";
import { signOut } from "@/actions/auth";

export default function LogoutButton() {
  const [error, action, pending] = useActionState(signOut, "");
  return (
    <form action={action}>
      <button type="submit" disabled={pending}
        className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60">
        {pending ? "Logging out…" : "Log out"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </form>
  );
}
