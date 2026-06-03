import Link from "next/link";
import { resetPassword } from "../login/actions";

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; email?: string }>;
}) {
  const params = await searchParams;
  const isSuccess = params.message === "Om e-postadressen finns skickas en återställningslänk.";

  return (
    <main className="shell">
      <section className="grid two" style={{ alignItems: "start", paddingTop: 48 }}>
        <div className="stack">
          <h1>Återställ lösenord</h1>
          <p className="lead">
            Ange e-postadressen för ditt konto så skickar vi en länk för att återställa lösenordet.
          </p>
        </div>

        <div className="panel grid">
          <form className="grid" action={resetPassword}>
            <h2>Återställ lösenord</h2>
            {params.message ? (
              <p className={`form-message${isSuccess ? " success" : ""}`}>{params.message}</p>
            ) : null}
            <label>
              E-post
              <input name="email" type="email" autoComplete="email" defaultValue={params.email || ""} required />
            </label>
            <button type="submit">Skicka återställningslänk</button>
          </form>
          <div className="auth-links">
            <p className="muted">
              Kommer du ihåg lösenordet? <Link href="/login">Logga in</Link>.
            </p>
            <p className="muted">
              Har du inget konto? <Link href="/signup">Kom igång</Link>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
