# OpenTTPA

OpenTTPA is a Next.js/Vercel application for creating, publishing, and serving
transparency notices for political advertising under TTPA, the EU regulation on
political advertising.

The service helps organizations collect TTPA metadata, publish an open
information page, and share the notice as a URL or QR code.

## Features

- Registration, email verification, login, and password reset with Supabase Auth.
- Consent to personal data processing during registration.
- Profile view for the signed-in user.
- Organizations and campaigns.
- Form for TTPA data: sponsor, contact details, publication period, funding,
  calculation method, connection to a political process, targeting/ad delivery,
  consent withdrawal, and reporting channel.
- Public transparency page at `/t/[slug]`.
- QR code at `/api/qr/[slug]`.
- View counts and change history in the database.
- Supabase RLS policies for organization data and public read access to
  published notices.
- Information pages about TTPA, personal data processing, cookies, and open
  source.
- Vercel Analytics.

## Tech Stack

- Next.js 16 App Router
- React 19
- Supabase Auth, database, and RLS
- Supabase SSR helpers with `proxy.ts` for session refresh
- Vercel Analytics
- TypeScript

## Getting Started Locally

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Start the development server:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

## Supabase

The database schema is managed with the Supabase CLI and SQL migrations in
`supabase/migrations/`.

First-time setup against a Supabase project:

```bash
npx supabase login
npx supabase link
npx supabase db push
```

Local Supabase development:

```bash
npm run db:start
npm run db:reset
```

Create a new migration:

```bash
npm run db:migration -- describe_change
```

After a PR with migrations has been merged into `main`:

```bash
git switch main
git pull --ff-only origin main
npm run db:push
```

Do not change tables, RLS policies, triggers, functions, or views directly in
the remote Supabase Dashboard when migrations are used. Put schema changes in
`supabase/migrations/` and let them go through PR review.

`supabase/.temp/` should not be committed.

## Important Pages

- `/signup` - create an account.
- `/signup/success` - confirmation after registration.
- `/login` - log in.
- `/forgot-password` - reset password.
- `/dashboard` - create organizations and manage campaigns.
- `/profile` - account/profile.
- `/t/[slug]` - public transparency notice.
- `/ttpa` - information about TTPA.
- `/privacy` - personal data processing.
- `/cookies` - cookie usage.
- `/open-source` - open source and how to contribute.

## Git Workflow

Keep `main` deployable. Create one branch per change:

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/my-change
```

Run relevant checks before opening a PR:

```bash
npm run build
```

Push and open a PR:

```bash
git add .
git commit -m "Describe the change"
git push -u origin feature/my-change
```

After merge:

```bash
git switch main
git pull --ff-only origin main
git branch -d feature/my-change
```

## Contributing

The source code is public on GitHub:

```text
https://github.com/Goseimyr/openTTPA
```

You can contribute by opening issues, suggesting improvements, improving
documentation, or submitting pull requests.

The project is licensed under the GNU General Public License version 3. See
`LICENSE`.

## TTPA Sources

Always read the primary sources before using the service in production:

- The Swedish Agency for the Media's information about TTPA.
- Regulation (EU) 2024/900.
- The European Commission's guidelines supporting implementation of the
  regulation.
- Commission Implementing Regulation (EU) 2025/1410.
- Swedish Act (2025:1408) with supplementary provisions to the EU regulation on
  political advertising.
- Swedish Ordinance (2025:1410) with supplementary provisions to the EU
  regulation on political advertising.

OpenTTPA is a tool for creating and publishing transparency notices. The person
or organization publishing or using the information is responsible for ensuring
that the information is correct, complete, and compliant with applicable legal
requirements. OpenTTPA does not assume legal responsibility for published
information.
