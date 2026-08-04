---
name: supabase
description: Use whenever touching the database in this project — schema/migrations, or the Postgres client in src/lib/db.ts. Supabase here is just Postgres hosting; there is no Supabase Auth, RLS, or JS SDK involved.
---

# Database in this project

Postgres is hosted on Supabase, but the app talks to it **directly** (via [`postgres`](https://github.com/porsager/postgres) / `postgres.js`) — no Supabase Auth, no PostgREST, no RLS, no `@supabase/supabase-js`. Authentication is a separate, self-hosted Google OAuth flow (see the `vercel:auth`-adjacent code in `src/lib/googleOAuth.ts` and `src/lib/session.ts` — not a skill topic, just app code).

## Client setup (`src/lib/db.ts`)

- `sql` — the single module-scope `postgres.js` client, built from `DATABASE_URL`. `null` if not configured (`isDbConfigured` guards this, following the existing pattern used throughout the file).
- `getAuthenticatedUserId()` — reads the session cookie (see `src/lib/session.ts`), **not** a Postgres concern but lives here for historical/import-convenience reasons.
- Since there's no RLS, every query function in this file is the actual security boundary — always filter explicitly by `user_id` (or equivalent) rather than trusting a client-supplied id blindly. Never build query strings by concatenation; always use `sql` tagged templates so values are parameterized.

## Schema & migrations

- Migration tool: **node-pg-migrate**, config-free (reads `DATABASE_URL`, migration dir defaults to `migrations/`).
  - `npm run db:migrate` — apply pending migrations (loads `.env.local` via `--envPath`).
  - `npm run db:migrate:create <name>` — scaffold a new `-- Up Migration` / `-- Down Migration` SQL file in `migrations/`.
  - `npm run db:migrate:down` — roll back the last migration.
- `migrations/` is the live source of truth. `supabase/migrations/*.sql` is a **frozen historical record** of what was run by hand via the Supabase CLI before this tooling existed — do not add new files there (see `supabase/migrations/README.md`).
- Migrations must stay idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, etc.) — they run unattended on every Production deploy (see `scripts/migrate-build.js`, wired into `npm run build` / `vercel.json`'s `buildCommand`), and the same files also bootstrap a fresh local Postgres from empty.
- UUIDs use the built-in `gen_random_uuid()` (Postgres 13+) — not the `uuid-ossp` extension, so schema setup needs nothing beyond a stock Postgres image.

## Local development

`docker-compose.yml` runs a local Postgres on `localhost:5432`, fully separate from production. Standard loop:
```bash
docker-compose up -d
npm run db:migrate
npm run dev
```
`.env.local`'s `DATABASE_URL` points here by default. The production connection string (Vercel-only) is commented out at the top of `.env.local` for occasional manual use — don't point local dev at it.

## Auto-migration on deploy

`npm run build` runs `scripts/migrate-build.js` first. On Vercel, it skips itself unless `VERCEL_ENV === 'production'` — Preview deployments currently share the Production `DATABASE_URL` (see README), and auto-migrating from an unreviewed PR branch would be able to mutate the prod schema before merge. Use `npm run db:migrate` (with `DATABASE_URL` pointed at whatever you intend) to migrate deliberately outside that guarded path.
