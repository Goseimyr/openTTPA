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
2. Kör SQL:en i `supabase/schema.sql`.
3. Kopiera `.env.example` till `.env.local` och fyll i värdena.
4. Installera beroenden och starta:

```bash
npm install
npm run dev
```

## TTPA-källor

Mediemyndigheten anger att politisk reklam ska ha tydlig märkning och ett transparensmeddelande med bland annat sponsor, kontaktuppgifter, publiceringsperiod, ersättning, medlens ursprung, beräkningsmetod, koppling till val eller regleringsprocess, targeting/annonsleverans, samtyckesåterkallelse och anmälningsväg. Sidan ska hållas uppdaterad, vara maskinläsbar vid elektronisk publicering och tillgänglig.

Läs alltid de primära källorna innan produktion: Mediemyndighetens vägledning, EU-förordning 2024/900 och genomförandeförordning 2025/1410.
