"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(authFormUrl("/login", formatAuthError(error.message), { email }));
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const privacyConsent = formData.get("privacy_consent") === "on";
  const supabase = await createClient();

  if (!privacyConsent) {
    redirect(authFormUrl("/signup", "Du behöver godkänna hanteringen av personuppgifter.", { email }));
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/dashboard`
    }
  });

  if (error) {
    redirect(authFormUrl("/signup", formatAuthError(error.message), { email }));
  }

  redirect(`/signup/success?email=${encodeURIComponent(email)}`);
}

export async function resetPassword(formData: FormData) {
  const email = String(formData.get("email") || "");
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/reset-password`
  });

  if (error) {
    redirect(authFormUrl("/forgot-password", formatAuthError(error.message), { email }));
  }

  redirect("/forgot-password?message=Om e-postadressen finns skickas en återställningslänk.");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");
  const supabase = await createClient();

  if (password.length < 8) {
    redirect("/reset-password?message=Lösenordet behöver vara minst 8 tecken.");
  }

  if (password !== confirmPassword) {
    redirect("/reset-password?message=Lösenorden matchar inte.");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password?message=${encodeURIComponent(formatAuthError(error.message))}`);
  }

  redirect(`/dashboard?message=${encodeURIComponent("Lösenordet har uppdaterats.")}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

function formatAuthError(message: string) {
  if (message === "Invalid login credentials") {
    return "Felaktiga inloggningsuppgifter";
  }

  return message;
}

function authFormUrl(path: string, message: string, values: Record<string, string>) {
  const params = new URLSearchParams({ message });

  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  return `${path}?${params.toString()}`;
}
