import Link from "next/link";
import { signIn } from "./actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="shell">
      <section className="grid two" style={{ alignItems: "start", paddingTop: 48 }}>
        <div className="stack">
          <h1>Välkommen tillbaka</h1>
          <p className="lead">
            Fortsätt till din organisation, dina kampanjer och publicerade
            transparensmeddelanden.
          </p>
        </div>

        <div className="panel grid">
          <form className="grid" action={signIn}>
            <h2>Logga in</h2>
            {params.message ? <p className="form-message">{params.message}</p> : null}
            <label>
              E-post
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Lösenord
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            <button type="submit">Logga in</button>
          </form>
          <div className="auth-links">
            {params.message ? (
              <p className="muted">
                Har du glömt lösenordet? <Link href="/forgot-password">Återställ lösenord</Link>.
              </p>
            ) : null}
            <p className="muted">
              Har du inget konto? <Link href="/signup">Kom igång</Link>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
