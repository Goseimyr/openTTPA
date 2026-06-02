export default function OpenSourcePage() {
  return (
    <main className="shell text-page">
      <section className="stack">
        <h1>Öppen källkod</h1>
        <p className="lead">
          OpenTTPA är ett öppet källkodsprojekt. Källkoden är publik och kan granskas,
          användas och vidareutvecklas av andra.
        </p>

        <dl>
          <Info
            label="Källkod"
            value={
              <>
                Källkoden finns publikt på GitHub:{" "}
                <a href="https://github.com/Goseimyr/openTTPA">Goseimyr/openTTPA</a>.
              </>
            }
          />
          <Info
            label="Licens"
            value={
              <>
                Projektet är licensierat enligt GNU General Public License version 3. Licensen finns
                i repo:t och hos{" "}
                <a href="https://www.gnu.org/licenses/gpl-3.0.html">Free Software Foundation</a>.
              </>
            }
          />
          <Info
            label="Bidra"
            value="Du kan bidra genom att rapportera fel, föreslå förbättringar, förbättra dokumentation eller skicka pull requests med kodändringar."
          />
          <Info
            label="Så börjar du"
            value={
              <>
                Öppna ett issue eller skapa en fork av repo:t, gör ändringen i en egen branch och
                skicka en pull request mot <code>main</code>.
              </>
            }
          />
          <Info
            label="Ansvar"
            value="Bidrag bör vara testade, tydligt beskrivna och inte innehålla hemligheter, personuppgifter eller upphovsrättsskyddat material som inte får delas."
          />
          <Info
            label="Kontakt"
            value={
              <>
                Kontakta OpenTTPA på <a href="mailto:gustaf@seimyr.se">gustaf@seimyr.se</a>.
              </>
            }
          />
        </dl>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="definition">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
