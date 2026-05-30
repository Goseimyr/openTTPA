import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenTTPA",
  description: "Skapa och publicera transparensmeddelanden för politisk reklam."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <header className="shell topbar">
          <Link href="/" className="brand">
            <span className="mark">T</span>
            <span>OpenTTPA</span>
          </Link>
          <nav className="actions" aria-label="Huvudmeny">
            <Link className="button secondary" href="/dashboard">
              Översikt
            </Link>
            <Link className="button" href="/login">
              Logga in
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
