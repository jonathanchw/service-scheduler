"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getLoginPath(locale: string, error?: string) {
  const path = `/${locale}/login`;

  return error ? `${path}?error=${error}` : path;
}

export async function signIn(locale: string, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(getLoginPath(locale, "missing"));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(getLoginPath(locale, "invalid"));
  }

  redirect(`/${locale}/dashboard`);
}

export async function signOut(locale: string) {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();
  redirect(getLoginPath(locale));
}
