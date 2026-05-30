import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/(auth)/login/actions";
import { createClient, hasSupabaseEnv } from "@/utils/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenTTPA",
  description: "Skapa och publicera transparensmeddelanden för politisk reklam."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <html lang="sv">
      <body>
        <header className="shell topbar">
          <Link href="/" className="brand">
            <span className="mark">T</span>
            <span>OpenTTPA</span>
          </Link>
          <nav className="actions" aria-label="Huvudmeny">
            {user ? (
              <>
                <Link className="button secondary user-link" href="/profile" title={user.email || "Profil"}>
                  {user.email}
                </Link>
                <form action={signOut}>
                  <button type="submit">Logga ut</button>
                </form>
              </>
            ) : (
              <Link className="button" href="/login">
                Logga in
              </Link>
            )}
          </nav>
        </header>
        {user ? (
          <nav className="shell subnav" aria-label="Plats">
            <Link href="/">Start</Link>
            <span aria-hidden>&gt;</span>
            <Link href="/dashboard">Skapa organisation</Link>
          </nav>
        ) : null}
        {children}
        <footer className="shell footer">
          <Link href="/privacy">Behandling av personuppgifter</Link>
          <Link href="/cookies">Användning av kakor</Link>
        </footer>
      </body>
    </html>
  );
}

async function getUser() {
  if (!hasSupabaseEnv()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
