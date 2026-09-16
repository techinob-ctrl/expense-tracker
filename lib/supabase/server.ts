import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Pages read cookies; Actions explicitly opt into writing them.
export async function createClient(writable = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) {
    throw new Error("Set Supabase URL and publishable key in expense-tracker/.env.local.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    // Cookies do not isolate by port. Avoid collisions with Notes App on localhost:3000.
    cookieOptions: { name: "expense-tracker-auth" },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        if (!writable) return; // Proxy handles refresh during page rendering.
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}
