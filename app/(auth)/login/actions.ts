"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(formatAuthError(error.message))}`);
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const privacyConsent = formData.get("privacy_consent") === "on";
  const supabase = await createClient();

  if (!privacyConsent) {
    redirect("/signup?message=Du behöver godkänna hanteringen av personuppgifter.");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/dashboard`
    }
  });

  if (error) {
    redirect(`/signup?message=${encodeURIComponent(formatAuthError(error.message))}`);
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
    redirect(`/forgot-password?message=${encodeURIComponent(formatAuthError(error.message))}`);
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
