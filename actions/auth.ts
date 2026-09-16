"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_previous: string, formData: FormData): Promise<string> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
    return "Enter your email and password.";
  }

  const supabase = await createClient(true);
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return "Could not sign in. Check your email, password, and email confirmation.";
  } catch {
    return "Unable to connect. Please try again.";
  }
  redirect("/");
}

export async function signOut(): Promise<string> {
  const supabase = await createClient(true);
  try {
    // Only revoke this session, not the user's separate Notes App sessions.
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return "Could not log out. Please try again.";
  } catch {
    return "Unable to connect. Please try again.";
  }
  redirect("/login");
}
