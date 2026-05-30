import Link from "next/link";

export default async function SignupSuccessPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="shell">
      <section className="grid two" style={{ alignItems: "start", paddingTop: 48 }}>
        <div className="stack">
          <h1>Kontot är skapat</h1>
          <p className="lead">
            Kontrollera din e-post och verifiera kontot innan du loggar in.
          </p>
        </div>

        <div className="panel grid">
          <h2>Verifiera e-postadressen</h2>
          <p className="muted">
            Vi har skickat ett bekräftelsemeddelande
            {params.email ? <> till <strong>{params.email}</strong></> : null}. Följ länken i
            meddelandet för att aktivera kontot.
          </p>
          <p className="muted">
            När kontot är verifierat kan du fortsätta till inloggningen.
          </p>
          <div className="actions">
            <Link className="button" href="/login">
              Logga in
            </Link>
            <Link className="button secondary" href="/signup">
              Skapa ett annat konto
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
