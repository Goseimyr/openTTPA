# OpenTTPA

OpenTTPA är en Next.js/Vercel-app för att skapa, publicera och tillhandahålla
transparensmeddelanden för politisk reklam enligt TTPA, EU:s förordning om
politisk reklam.

Tjänsten hjälper organisationer att samla TTPA-metadata, publicera en öppen
informationssida och dela länken som URL eller QR-kod.

## Funktioner

- Registrering, e-postverifiering, inloggning och lösenordsåterställning via Supabase Auth.
- Samtycke till behandling av personuppgifter vid registrering.
- Profilvy för inloggad användare.
- Organisationer och kampanjer.
- Formulär för TTPA-uppgifter: sponsor, kontaktuppgifter, publiceringsperiod, finansiering, beräkningsmetod, koppling till politisk process, targeting/annonsleverans, samtyckesåterkallelse och anmälningsväg.
- Publik transparenssida på `/t/[slug]`.
- QR-kod på `/api/qr/[slug]`.
- Visningsräkning och ändringshistorik i databasen.
- Supabase RLS-policyer för organisationsdata och publik läsning av publicerade meddelanden.
- Informationssidor om TTPA, behandling av personuppgifter, kakor och öppen källkod.
- Vercel Analytics.

## Teknik

- Next.js 16 App Router
- React 19
- Supabase Auth, database och RLS
- Supabase SSR helpers med `proxy.ts` för session refresh
- Vercel Analytics
- TypeScript

## Kom igång lokalt

1. Installera beroenden:

```bash
npm install
```

2. Kopiera miljövariabler:

```bash
cp .env.example .env.local
```

3. Fyll i `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Starta utvecklingsservern:

```bash
npm run dev
```

5. Öppna:

```text
http://localhost:3000
```

## Supabase

Databasschemat hanteras med Supabase CLI och SQL-migrationer i
`supabase/migrations/`.

Första gången mot ett Supabase-projekt:

```bash
npx supabase login
npx supabase link
npx supabase db push
```

Lokal Supabase-utveckling:

```bash
npm run db:start
npm run db:reset
```

Skapa en ny migration:

```bash
npm run db:migration -- describe_change
```

Efter att en PR med migrationer har mergats till `main`:

```bash
git switch main
git pull --ff-only origin main
npm run db:push
```

Ändra inte tabeller, RLS-policyer, triggers, funktioner eller vyer direkt i remote
Supabase Dashboard när migrationer används. Lägg schemaändringar i
`supabase/migrations/` och låt dem gå via PR.

`supabase/.temp/` ska inte committas.

## Viktiga sidor

- `/signup` - skapa konto.
- `/signup/success` - bekräftelse efter registrering.
- `/login` - logga in.
- `/forgot-password` - återställ lösenord.
- `/dashboard` - skapa organisation och hantera kampanjer.
- `/profile` - konto/profil.
- `/t/[slug]` - publikt transparensmeddelande.
- `/ttpa` - information om TTPA.
- `/privacy` - behandling av personuppgifter.
- `/cookies` - användning av kakor.
- `/open-source` - öppen källkod och hur man bidrar.

## Arbetsflöde med git

Håll `main` deploybar. Skapa en branch per ändring:

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/my-change
```

Kör relevanta kontroller innan PR:

```bash
npm run build
```

Pusha och öppna PR:

```bash
git add .
git commit -m "Describe the change"
git push -u origin feature/my-change
```

Efter merge:

```bash
git switch main
git pull --ff-only origin main
git branch -d feature/my-change
```

## Bidra

Källkoden finns publikt på GitHub:

```text
https://github.com/Goseimyr/openTTPA
```

Du kan bidra genom att öppna issues, föreslå förbättringar, förbättra
dokumentation eller skicka pull requests.

Projektet är licensierat enligt GNU General Public License version 3. Se
`LICENSE`.

## TTPA-källor

Läs alltid primärkällorna innan tjänsten används i produktion:

- Mediemyndighetens information om TTPA.
- EU-förordning 2024/900.
- EU-kommissionens riktlinjer för genomförande av förordningen.
- EU-kommissionens genomförandeförordning 2025/1410.
- Lag (2025:1408) med kompletterande bestämmelser till EU:s förordning om politisk reklam.
- Förordning (2025:1410) med kompletterande bestämmelser till EU:s förordning om politisk reklam.

OpenTTPA är ett verktyg för att skapa och publicera transparensmeddelanden. Den
som publicerar eller använder informationen ansvarar själv för att uppgifterna är
korrekta, fullständiga och uppfyller tillämpliga rättsliga krav. OpenTTPA tar
inte juridiskt ansvar för publicerad information.
