import Link from "next/link";

export default function CookiesPage() {
  return (
    <main className="shell text-page">
      <section className="stack">
        <h1>Användning av kakor</h1>
        <p className="lead">
          OpenTTPA använder kakor och liknande tekniker för att inloggning, säkerhet och
          grundläggande funktioner i tjänsten ska fungera.
        </p>

        <dl>
          <Info
            label="Vad är kakor?"
            value="Kakor är små textfiler som sparas i webbläsaren. De kan användas för att komma ihåg att du är inloggad, skydda sessionen och ge webbplatsen nödvändig funktionalitet."
          />
          <Info
            label="Nödvändiga kakor"
            value="OpenTTPA använder nödvändiga kakor från Supabase för autentisering och sessionshantering. Utan dessa kan du inte logga in eller använda inloggade funktioner."
          />
          <Info
            label="Analys och marknadsföring"
            value="OpenTTPA använder inte kakor för annonsering eller marknadsföring. Visningsstatistik för transparensmeddelanden sparas server-side och kräver inte att en analyskaka sätts i besökarens webbläsare."
          />
          <Info
            label="Tredje parter"
            value="Supabase kan sätta sessionsrelaterade kakor för autentisering. Vercel hostar tjänsten och kan behandla tekniska uppgifter som behövs för drift och säkerhet."
          />
          <Info
            label="Blockera eller radera kakor"
            value="Du kan blockera eller radera kakor i webbläsarens inställningar. Om du blockerar nödvändiga kakor kan inloggning och kontofunktioner sluta fungera."
          />
          <Info
            label="Kontakt"
            value="Lägg till ansvarig organisations kontaktuppgifter här innan tjänsten används i produktion."
          />
        </dl>

        <p className="muted">
          Mer information om kakor finns hos{" "}
          <a href="https://pts.se/internet-och-telefoni/kakor-cookies/">
            Post- och telestyrelsen
          </a>
          .
        </p>
        <p className="muted">
          Läs även om <Link href="/privacy">behandling av personuppgifter</Link>.
        </p>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="definition">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
