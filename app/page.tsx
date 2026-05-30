import Link from "next/link";
import { BadgeCheck, BarChart3, QrCode, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="stack">
          <span className="pill">TTPA för politisk reklam</span>
          <h1>TTPA-meddelanden utan tung administration.</h1>
          <p className="lead">
            OpenTTPA hjälper organisationer att samla rätt metadata, publicera en öppen
            informationssida och dela länken som QR-kod i annonser, tryck och video.
          </p>
          <div className="actions">
            <Link className="button" href="/login">
              Skapa första kampanjen
            </Link>
            <Link className="button secondary" href="/dashboard">
              Till översikten
            </Link>
          </div>
        </div>

        <div className="panel grid">
          <div className="card row">
            <div>
              <strong>Tydlig märkning</strong>
              <p className="muted">Sponsor, process, targeting och hänvisning samlat.</p>
            </div>
            <BadgeCheck aria-hidden />
          </div>
          <div className="card row">
            <div>
              <strong>Länk och QR-kod</strong>
              <p className="muted">Varje kampanj får en publik, stabil transparenssida.</p>
            </div>
            <QrCode aria-hidden />
          </div>
          <div className="card row">
            <div>
              <strong>Visningsstatistik</strong>
              <p className="muted">Följ hur många gånger meddelandet har öppnats.</p>
            </div>
            <BarChart3 aria-hidden />
          </div>
          <div className="card row">
            <div>
              <strong>Ändringshistorik</strong>
              <p className="muted">Datamodellen sparar versioner för bevarande över tid.</p>
            </div>
            <ShieldCheck aria-hidden />
          </div>
        </div>
      </section>
    </main>
  );
}
