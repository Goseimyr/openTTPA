import { signIn, signUp } from "./actions";

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
          <h1>Kom igång</h1>
          <p className="lead">
            Registrera dig eller logga in med Supabase Auth. Efter inloggning kan du skapa
            organisation, kampanjer och publika TTPA-meddelanden.
          </p>
          {params.message ? <p className="notice">{params.message}</p> : null}
        </div>

        <div className="panel grid">
          <form className="grid" action={signIn}>
            <h2>Logga in</h2>
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

          <form className="grid" action={signUp}>
            <h2>Skapa konto</h2>
            <label>
              E-post
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Lösenord
              <input name="password" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            <button type="submit" className="secondary">
              Registrera
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
