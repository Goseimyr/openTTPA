import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="shell text-page">
      <section className="stack">
        <h1>Behandling av personuppgifter</h1>
        <p className="lead">
          OpenTTPA behandlar personuppgifter för att kunna skapa användarkonton och tillhandahålla
          transparensmeddelanden för politisk reklam.
        </p>

        <dl>
          <Info
            label="Vilka uppgifter behandlas?"
            value="E-postadress, användar-id, inloggningsmetadata samt de kontaktuppgifter och organisationsuppgifter som du själv anger i tjänsten."
          />
          <Info
            label="Varför behandlas uppgifterna?"
            value="För autentisering, kontohantering, drift av tjänsten, publicering av transparensmeddelanden och visningsstatistik."
          />
          <Info
            label="Rättslig grund"
            value="Kontouppgifter behandlas för att tillhandahålla tjänsten. Uppgifter i publicerade transparensmeddelanden behandlas för att uppfylla krav på öppenhet kring politisk reklam."
          />
          <Info
            label="Lagring"
            value="Uppgifter sparas så länge kontot eller kampanjen behövs. Publicerade transparensuppgifter och ändringshistorik kan behöva sparas längre för spårbarhet och rättsliga krav."
          />
          <Info
            label="Tredje parter"
            value="Tjänsten använder Supabase för autentisering och databas samt Vercel för hosting. Dessa leverantörer behandlar uppgifter för drift av tjänsten."
          />
          <Info
            label="Dina rättigheter"
            value="Du kan begära information, rättelse, radering, begränsning eller invända mot behandling där det är tillämpligt. Du har också rätt att lämna klagomål till Integritetsskyddsmyndigheten."
          />
          <Info
            label="Kontakt"
            value="Lägg till ansvarig organisations kontaktuppgifter här innan tjänsten används i produktion."
          />
        </dl>

        <p className="muted">
          Mer information om rätten till information finns hos{" "}
          <a href="https://www.imy.se/privatperson/dataskydd/dina-rattigheter/ratt-till-information/">
            Integritetsskyddsmyndigheten
          </a>
          .
        </p>
        <p className="muted">
          Läs även om <Link href="/cookies">användning av kakor</Link>.
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
