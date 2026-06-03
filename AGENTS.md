# AGENTS.md

## Projekt

OpenTTPA är en Next.js/Vercel-applikation för att skapa, publicera och
tillhandahålla TTPA-meddelanden för politisk reklam enligt EU:s regler om
transparens och inriktning.

Tjänsten använder Supabase för auth, databas och RLS. Publicerade
transparensmeddelanden ska vara spårbara, permanenta och inte kunna ändras som
vanlig redigering.

## Viktig princip

Det här är ett juridiskt känsligt system. Ändringar ska göras försiktigt och
med fokus på spårbarhet, korrekt metadata och tydliga användarflöden.

OpenTTPA hjälper användare att skapa transparensmeddelanden, men tar inte
juridiskt ansvar för publicerad information.

## Teknik

- Next.js App Router
- React
- TypeScript
- Supabase Auth, Postgres och RLS
- Supabase SSR helpers
- Vercel Analytics
- SQL-migrationer i `supabase/migrations/`

## Lokala kommandon

Installera beroenden:

```bash
npm install
```

Starta utveckling:

```bash
npm run dev
```

Bygg och kontrollera:

```bash
npm run build
```

Kör Supabase-migrationer mot länkat projekt:

```bash
npm run db:push
```

## Git-arbetsflöde

Arbeta inte direkt på `main` om det går att undvika.

Rekommenderat flöde:

```bash
git switch main
git pull --ff-only origin main
git switch -c codex/short-description
```

Innan PR:

```bash
npm run build
git status --short
```

Pusha och skapa PR:

```bash
git add .
git commit -m "Describe the change"
git push -u origin codex/short-description
gh pr create --base main --head codex/short-description
```

Efter merge:

```bash
git switch main
git pull --ff-only origin main
```

## Databas och migrationer

Alla schemaändringar ska göras som SQL-migrationer i `supabase/migrations/`.

Ändra inte tabeller, RLS-policyer, triggers, funktioner eller vyer direkt i
Supabase Dashboard om ändringen ska leva kvar i projektet.

Tänk särskilt på:

- RLS-policyer får inte skapa rekursion.
- Publicerade meddelanden ska skyddas mot vanlig uppdatering och radering.
- Eventlogg och snapshot ska bevara spårbarhet.
- Migrationer ska vara idempotenta där det är rimligt, till exempel med
  `if not exists`.

`supabase/.temp/` ska inte committas.

## Publicerings- och versionsregler

Ett kampanjmeddelande kan vara:

- `draft`
- `active`
- `archived`

Regler:

- Utkast får redigeras.
- Publicerade meddelanden får inte redigeras direkt.
- Arkiverade meddelanden får inte redigeras direkt.
- Vill man ändra ett publicerat meddelande ska en ny version skapas.
- Ny version får bara skapas från aktuell aktiv version.
- En ersatt version ska arkiveras när ersättaren publiceras.
- Äldre versioner ska vara fortsatt tillgängliga via permanent länk.
- Om ett meddelande ersätts ska det synas i transparensmeddelandet.
- Kampanjlistor ska normalt visa senaste versionen, inte alla historiska
  versioner.

## Transparensmeddelande

Komponenten `components/TransparencyNotice.tsx` ska ligga nära mallen i
EU-kommissionens genomförandeförordning 2025/1410.

Var försiktig med att lägga till extra text i själva transparensmeddelandet. Om
extra produktinformation behövs, lägg den hellre utanför den numrerade mallen.

Viktiga principer:

- Rubriker och punkter ska vara tydliga och följa mallen.
- Obligatorisk information ska inte döljas i publicerad vy.
- Om ett fält saknas ska det framgå på ett begripligt sätt.
- Maskinläsbar version ska hållas i synk med den visuella versionen.
- Publicerade meddelanden ska renderas från snapshot när snapshot finns.

## Formulär

Kampanjformuläret ska vara lätt att använda även för personer utan juridisk
eller teknisk vana.

Principer:

- Markera obligatoriska fält med röd asterisk.
- Visa avancerade fält först när användaren kryssar i att de behövs.
- Förval ska hjälpa användaren, till exempel vald organisation som
  sponsor/betalare/utgivare.
- Testdata-knappen ska fylla i ett realistiskt komplett testfall.
- Vid fel ska användarens data helst inte försvinna.

## UI och språk

Språket i appen är svenska.

Skriv enkelt, tydligt och sakligt. Undvik onödigt juridiskt krångliga
formuleringar i användargränssnittet, men var korrekt när regelverk beskrivs.

Använd konsekventa begrepp:

- Meddelande
- Kampanj
- Organisation
- Publicera meddelande
- Redigera meddelande
- Skapa ny version

## Auth och navigation

Inloggade användare ska kunna se:

- aktuell användare
- organisationer de har åtkomst till
- kampanjer per organisation
- användare kopplade till organisationen
- eventlogg för organisation och kampanj

Breadcrumbs ska vara logiska och hjälpa användaren hitta tillbaka.

Exempel:

```text
Start > Organisationer > Organisationens namn > Kampanjens namn
```

## Säkerhet

Använd inte service role key i klientkod.

Admin/Supabase service role ska bara användas i serverkod där det verkligen
behövs.

Var särskilt försiktig med:

- RLS
- auth redirects
- publicerade meddelanden
- eventlogg
- snapshots
- personuppgifter
- permanenta länkar

## Personuppgifter och kakor

Sidorna för personuppgifter och kakor ska hållas i synk med faktisk
funktionalitet.

Om tjänsten börjar använda fler kakor, trackingteknik eller externa tjänster ska
sidan om kakor uppdateras.

Om personuppgiftsbehandlingen ändras ska sidan om behandling av personuppgifter
uppdateras.

## Vid ändringar

Innan du avslutar en ändring:

1. Kör `npm run build`.
2. Kontrollera `git diff --check`.
3. Kontrollera att ändringen inte bryter publiceringsflödet.
4. Kontrollera att berörda sidor fortfarande har logiska breadcrumbs.
5. Om databasen ändrats, lägg till migration.
6. Om publika transparensmeddelandet ändrats, kontrollera även JSON-versionen.

## Rör inte i onödan

Undvik stora refaktoriseringar om uppgiften är liten.

Behåll befintlig struktur och stil om det inte finns ett tydligt skäl att
ändra.

Ändra inte juridiska formuleringar lättvindigt. Vid osäkerhet, föreslå
ändringen först.
