"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/login/actions";

type Props = {
  userEmail?: string | null;
  profileHref: string;
};

export function HeaderActions({ userEmail, profileHref }: Props) {
  const pathname = usePathname();

  if (pathname.startsWith("/t/")) return null;

  return (
    <nav className="actions" aria-label="Huvudmeny">
      {userEmail ? (
        <>
          <Link className="button secondary user-link" href={profileHref} title={userEmail}>
            {userEmail}
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
  );
}
