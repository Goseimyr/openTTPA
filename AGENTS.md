# AGENTS.md

## Project

OpenTTPA is a Next.js/Vercel application for creating, publishing, and serving
TTPA notices for political advertising under the EU rules on transparency and
targeting.

The service uses Supabase for auth, database, and RLS. Published transparency
notices must be traceable, permanent, and protected from ordinary editing.

## Core Principle

This is a legally sensitive system. Changes should be made carefully, with a
focus on traceability, correct metadata, and clear user flows.

OpenTTPA helps users create transparency notices, but does not assume legal
responsibility for published information.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Supabase Auth, Postgres, and RLS
- Supabase SSR helpers
- Vercel Analytics
- SQL migrations in `supabase/migrations/`

## Local Commands

Install dependencies:

```bash
npm install
```

Start development:

```bash
npm run dev
```

Build and check:

```bash
npm run build
```

Run Supabase migrations against the linked project:

```bash
npm run db:push
```

## Git Workflow

Avoid working directly on `main` whenever possible.

Recommended flow:

```bash
git switch main
git pull --ff-only origin main
git switch -c codex/short-description
```

Before opening a PR:

```bash
npm run build
git status --short
```

Push and create a PR:

```bash
git add .
git commit -m "Describe the change"
git push -u origin codex/short-description
gh pr create --base main --head codex/short-description
```

After merge:

```bash
git switch main
git pull --ff-only origin main
```

## Database and Migrations

All schema changes must be made as SQL migrations in `supabase/migrations/`.

Do not change tables, RLS policies, triggers, functions, or views directly in
the Supabase Dashboard if the change is meant to persist in the project.

Pay particular attention to:

- RLS policies must not create recursion.
- Published notices must be protected from ordinary updates and deletion.
- Event logs and snapshots must preserve traceability.
- Migrations should be idempotent where reasonable, for example with
  `if not exists`.

`supabase/.temp/` must not be committed.

## Publication and Versioning Rules

A campaign notice can have one of these statuses:

- `draft`
- `active`
- `archived`

Rules:

- Drafts may be edited.
- Published notices must not be edited directly.
- Archived notices must not be edited directly.
- To change a published notice, create a new version.
- A new version may only be created from the current active version.
- A replaced version must be archived when its replacement is published.
- Older versions must remain available through permanent links.
- If a notice replaces another notice, that must be shown in the transparency
  notice.
- Campaign lists should normally show the latest version, not every historical
  version.

## Transparency Notice

The `components/TransparencyNotice.tsx` component should stay close to the
template in Commission Implementing Regulation (EU) 2025/1410.

Be careful when adding extra text inside the transparency notice itself. If
extra product information is needed, place it outside the numbered template
instead.

Important principles:

- Headings and numbered items should be clear and follow the template.
- Mandatory information must not be hidden in the published view.
- If a field is missing, that should be shown in a clear way.
- The machine-readable version must stay in sync with the visual version.
- Published notices should render from the snapshot when a snapshot exists.

## Forms

The campaign form should be easy to use for people without legal or technical
expertise.

Principles:

- Mark required fields with a red asterisk.
- Show advanced fields only when the user checks that they are needed.
- Defaults should help the user, for example using the selected organization as
  sponsor/payer/publisher.
- The test data button should fill in a realistic complete test case.
- User-entered data should preferably not disappear when an error occurs.

## UI and Language

The application UI is in Swedish.

Use simple, clear, and factual language. Avoid unnecessarily complex legal
wording in the user interface, but be accurate when describing regulations.

Use consistent product terms:

- Meddelande
- Kampanj
- Organisation
- Publicera meddelande
- Redigera meddelande
- Skapa ny version

## Auth and Navigation

Signed-in users should be able to see:

- the current user
- organizations they have access to
- campaigns per organization
- users connected to the organization
- event logs for organizations and campaigns

Breadcrumbs should be logical and help users navigate back.

Example:

```text
Start > Organisationer > Organization name > Campaign name
```

## Security

Do not use the service role key in client code.

The admin/Supabase service role should only be used in server code where it is
actually needed.

Be especially careful with:

- RLS
- auth redirects
- published notices
- event logs
- snapshots
- personal data
- permanent links

## Personal Data and Cookies

The personal data and cookie pages must stay in sync with the actual service
behavior.

If the service starts using more cookies, tracking technology, or external
services, update the cookie page.

If personal data processing changes, update the personal data processing page.

## When Making Changes

Before finishing a change:

1. Run `npm run build`.
2. Check `git diff --check`.
3. Check that the change does not break the publication flow.
4. Check that affected pages still have logical breadcrumbs.
5. If the database changed, add a migration.
6. If the public transparency notice changed, check the JSON version as well.

## Avoid Unnecessary Churn

Avoid large refactors when the task is small.

Keep the existing structure and style unless there is a clear reason to change
them.

Do not change legal wording lightly. When unsure, propose the change first.
