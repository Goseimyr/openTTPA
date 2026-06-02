import Link from "next/link";
import { signUp } from "../login/actions";

export default async function SignupPage({
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
          <div className="stack signup-info">
            <p className="lead">
              Skapa ett konto för att registrera organisationer, lägga upp kampanjer och publicera
              TTPA-transparensmeddelanden.
            </p>
            <p className="lead">
              Den som publicerar ansvarar själv för att uppgifterna är korrekta, fullständiga och
              uppfyller tillämpliga rättsliga krav. OpenTTPA tar inte juridiskt ansvar för publicerad
              information.
            </p>
            <p className="lead">
              OpenTTPA behandlar personuppgifter för att kunna skapa användarkonton och tillhandahålla
              transparensmeddelanden för politisk reklam. Uppgifter sparas så länge kontot eller
              kampanjen behövs.
            </p>
            <p className="lead">
              Publicerade transparensuppgifter och ändringshistorik lagras permanent i minst sju (7)
              år för spårbarhet och uppfyllande av krav enligt gällande förordning (EU) 2024/900.
            </p>
          </div>
          {params.message ? <p className="notice">{params.message}</p> : null}
        </div>

        <div className="panel grid">
          <form className="grid" action={signUp}>
            <h2>Skapa konto</h2>
            {params.message ? <p className="form-message">{params.message}</p> : null}
            <label>
              E-post
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Lösenord
              <input name="password" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            <label className="checkbox-row">
              <input name="privacy_consent" type="checkbox" required />
              <span>
                Jag samtycker till att OpenTTPA behandlar mina personuppgifter enligt{" "}
                <Link href="/privacy">informationen om personuppgifter</Link>.
              </span>
            </label>
            <button type="submit">Skapa konto</button>
          </form>
          <p className="muted">
            Har du redan en användare? <Link href="/login">Logga in</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
