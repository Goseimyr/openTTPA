import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { HeaderActions } from "@/components/HeaderActions";
import { createClient, hasSupabaseEnv } from "@/utils/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenTTPA",
  description: "Skapa och publicera transparensmeddelanden för politisk reklam."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionHeader();
  const user = session?.user || null;
  const profileHref = session?.profileHref || "/dashboard";

  return (
    <html lang="sv">
      <body>
        <header className="shell topbar">
          <Link href="/" className="brand">
            <span className="mark">T</span>
            <span>OpenTTPA</span>
          </Link>
          <HeaderActions userEmail={user?.email || null} profileHref={profileHref} />
        </header>
        {user ? (
          <nav className="shell subnav" aria-label="Plats">
            <Breadcrumb />
          </nav>
        ) : null}
        {children}
        <footer className="shell footer">
          <Link href="/ttpa">TTPA - EU:s förordning om politisk reklam</Link>
          <Link href="/privacy">Behandling av personuppgifter</Link>
          <Link href="/cookies">Användning av kakor</Link>
          <Link href="/open-source">Öppen källkod</Link>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}

async function getSessionHeader() {
  if (!hasSupabaseEnv()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    return {
      user,
      profileHref: membership?.organization_id
        ? `/dashboard/organizations/${membership.organization_id}/users/${user.id}`
        : "/dashboard"
    };
  } catch {
    return null;
  }
}
