import Link from "next/link";

export default function TtpaPage() {
  return (
    <main className="shell text-page">
      <section className="stack">
        <h1>TTPA - EU:s förordning om politisk reklam</h1>
        <p className="lead">
          TTPA är Europaparlamentets och rådets förordning om transparens och inriktning när det
          gäller politisk reklam (EU) 2024/900. Syftet är att göra politiska reklammeddelanden
          lättare att identifiera och förstå.
        </p>

        <dl>
          <Info
            label="När gäller reglerna?"
            value="Förordningen började gälla den 10 oktober 2025. I Sverige gäller kompletterande nationella bestämmelser från den 1 januari 2026."
          />
          <Info
            label="Vad är syftet?"
            value="Reglerna ska öka transparensen kring politisk reklam. Mottagaren ska kunna se att ett budskap är politisk reklam, vem som står bakom det och varför mottagaren får se det."
          />
          <Info
            label="Vem berörs?"
            value="Reglerna kan beröra sponsorer, politiska partier, kandidater, kampanjorganisationer, reklambyråer, mediehus, plattformar och andra aktörer som tar fram, publicerar eller sprider politiska reklammeddelanden inom EU."
          />
          <Info
            label="Märkning"
            value="Politisk reklam ska ha tydlig märkning. Märkningen ska bland annat visa att det är politisk reklam, sponsorns identitet, eventuell kontrollerande enhet, eventuell användning av inriktningsteknik eller annonsleveransteknik och eventuell koppling till val, folkomröstning eller regleringsprocess."
          />
          <Info
            label="Transparensmeddelande"
            value="Reklamen ska innehålla eller hänvisa till ett transparensmeddelande på samma språk som reklamen. Hänvisningen kan till exempel vara en länk eller QR-kod och ska vara tydlig under hela tiden reklamen visas."
          />
          <Info
            label="Uppgifter i transparensmeddelandet"
            value="Meddelandet ska bland annat innehålla sponsor och kontaktuppgifter, publiceringsperiod, belopp, finansieringens ursprung, beräkningsmetod, eventuell politisk process, eventuell inriktningsteknik eller annonsleveransteknik, hur samtycke kan återkallas och hur brister kan anmälas till utgivaren."
          />
          <Info
            label="Tillgänglighet och bevarande"
            value="När transparensmeddelandet publiceras elektroniskt ska det vara maskinläsbart och tillgängligt. Utgivare ska spara transparensmeddelandet och ändringar i det under sju år efter publiceringen."
          />
          <Info
            label="Olika medier"
            value="Kraven anpassas efter medium. Digitala annonser kan hänvisa med länk eller QR-kod, tryckta medier kan behöva tydliga rutor, och radio eller tv har särskilda krav för ljud- och bildbaserad märkning."
          />
          <Info
            label="Tillsyn och sanktioner"
            value="Mediemyndigheten ansvarar för stora delar av tillsynen i Sverige. IMY ansvarar för delar som gäller inriktningsteknik och annonsleveransteknik med personuppgifter. Överträdelser kan leda till varning, föreläggande, vite eller sanktionsavgift."
          />
          <div className="definition">
            <dt>Centrala dokument</dt>
            <dd>
              <ul className="inline-list">
                <li>
                  <a href="https://eur-lex.europa.eu/eli/reg/2024/900/oj/swe">
                    EU-förordning 2024/900 om transparens och inriktning när det gäller politisk
                    reklam
                  </a>
                </li>
                <li>
                  <a href="https://www.imy.se/globalassets/dokument/riktlinjer-for-att-stodja-genomforandet-av-forordning-eu-2024-900.pdf">
                    Riktlinjer för att stödja genomförandet av förordning (EU) 2024/900 om
                    transparens och inriktning när det gäller politisk reklam (PDF, 724 kb)
                  </a>
                </li>
                <li>
                  <a href="https://eur-lex.europa.eu/legal-content/SV/TXT/?uri=OJ%3AL_202501410">
                    EU-kommissionens genomförandeförordning 2025/1410
                  </a>
                </li>
                <li>
                  <a href="https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-20251408-med-kompletterande-bestammelser_sfs-2025-1408/">
                    Lag (2025:1408) med kompletterande bestämmelser till EU:s förordning om
                    politisk reklam
                  </a>
                </li>
                <li>
                  <a href="https://data.riksdagen.se/dokument/sfs-2025-1410.html">
                    Förordning (2025:1410) med kompletterande bestämmelser till EU:s förordning om
                    politisk reklam
                  </a>
                </li>
              </ul>
            </dd>
          </div>
        </dl>

        <p className="muted">
          Mer information finns hos{" "}
          <a href="https://mediemyndigheten.se/europeiska-regleringar/ttpa-eus-forordning-om-politisk-reklam/">
            Mediemyndigheten
          </a>
          .
        </p>
        <p className="muted">
          OpenTTPA är ett verktyg för att skapa och publicera{" "}
          <Link href="/">transparensmeddelanden</Link>. Den som publicerar eller använder
          informationen ansvarar själv för att uppgifterna är korrekta, fullständiga och uppfyller
          tillämpliga rättsliga krav. OpenTTPA tar inte juridiskt ansvar för publicerad information.
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
