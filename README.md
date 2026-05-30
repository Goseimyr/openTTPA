# OpenTTPA

En Next.js/Vercel-app för att skapa och tillhandahålla TTPA-transparensmeddelanden för politisk reklam.

## Funktioner

- Supabase Auth för registrering och inloggning.
- Organisationer med kampanjer.
- Formulär för TTPA-metadata: sponsor, kontaktuppgifter, publiceringsperiod, finansiering, beräkningsmetod, koppling till politisk process, targeting/annonsleverans, samtycke och anmälningsväg.
- Publik transparenssida på `/t/[slug]`.
- QR-kod på `/api/qr/[slug]`.
- Visningsräkning och ändringshistorik i databasen.
- RLS-policyer för organisationernas data och publik läsning av publicerade meddelanden.

## Kom igång

1. Skapa ett Supabase-projekt.
2. Kopiera `.env.example` till `.env.local` och fyll i värdena.
3. Installera beroenden och starta:

```bash
npm install
npm run dev
```

## Databasmigrationer

Databasschemat hanteras med Supabase CLI och SQL-filer i `supabase/migrations/`.
Ändra inte tabeller, RLS-policyer, triggers eller funktioner direkt i remote Supabase
Dashboard när migrations används.

Första gången:

```bash
npx supabase login
npx supabase link
npx supabase db push
```

Lokal utveckling:

```bash
npx supabase start
npx supabase db reset
```

Ny schemaändring:

```bash
npx supabase migration new describe_change
# redigera den skapade SQL-filen i supabase/migrations/
npx supabase db reset
npm run build
```

Efter att PR:en med migrationen är mergad till `main`:

```bash
git switch main
git pull --ff-only origin main
npx supabase db push
```

Använd `supabase/seed.sql` endast för lokal demo- och testdata, inte för riktig
kampanjdata.

## TTPA-källor

Mediemyndigheten anger att politisk reklam ska ha tydlig märkning och ett transparensmeddelande med bland annat sponsor, kontaktuppgifter, publiceringsperiod, ersättning, medlens ursprung, beräkningsmetod, koppling till val eller regleringsprocess, targeting/annonsleverans, samtyckesåterkallelse och anmälningsväg. Sidan ska hållas uppdaterad, vara maskinläsbar vid elektronisk publicering och tillgänglig.

Läs alltid de primära källorna innan produktion: Mediemyndighetens vägledning, EU-förordning 2024/900 och genomförandeförordning 2025/1410.
