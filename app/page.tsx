import Link from "next/link";
import { ClipboardList, Globe2, QrCode, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="stack">
          <h1>Skapa TTPA-meddelanden för politisk reklam</h1>
          <p className="lead">
            OpenTTPA hjälper organisationer att skapa, publicera och dela transparensmeddelanden
            enligt EU:s regler för politisk reklam. Varje kampanj får en publik sida, en permanent
            länk och en QR-kod. Tjänsten lagrar meddelanden permanent och har stöd för hantering av
            anmälningar och revideringar.
          </p>
          <div className="actions">
            <Link className="button" href="/signup">
              Kom igång
            </Link>
            <Link className="button secondary" href="/ttpa">
              Läs mer om TTPA
            </Link>
          </div>
        </div>

        <div className="panel grid">
          <div className="card row">
            <div>
              <strong>Fyll i kampanjuppgifter</strong>
              <p className="muted">Fyll i den information som behövs för kampanjen steg för steg.</p>
            </div>
            <ClipboardList aria-hidden />
          </div>
          <div className="card row">
            <div>
              <strong>Publicera transparensmeddelande</strong>
              <p className="muted">Gör informationen tillgänglig på en öppen sida för varje kampanj.</p>
            </div>
            <Globe2 aria-hidden />
          </div>
          <div className="card row">
            <div>
              <strong>Dela länk och QR-kod</strong>
              <p className="muted">Använd den permanenta länken i annonser, tryck, video och sociala medier.</p>
            </div>
            <QrCode aria-hidden />
          </div>
          <div className="card row">
            <div>
              <strong>Trygg hantering</strong>
              <p className="muted">Sparar meddelanden permanent med hantering av anmälningar och revideringar.</p>
            </div>
            <ShieldCheck aria-hidden />
          </div>
        </div>
      </section>
    </main>
  );
}
