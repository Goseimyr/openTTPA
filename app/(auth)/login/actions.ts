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
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`
    }
  });

  if (error) {
    redirect(`/signup?message=${encodeURIComponent(formatAuthError(error.message))}`);
  }

  redirect("/dashboard?message=Kontot är skapat. Kontrollera e-posten om bekräftelse krävs.");
}

export async function resetPassword(formData: FormData) {
  const email = String(formData.get("email") || "");
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login`
  });

  if (error) {
    redirect(`/forgot-password?message=${encodeURIComponent(formatAuthError(error.message))}`);
  }

  redirect("/forgot-password?message=Om e-postadressen finns skickas en återställningslänk.");
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
