---
name: supabase
description: Use whenever touching Supabase in this project — auth, database schema/migrations, RLS policies, or the client in src/lib/supabase.ts. Covers this project's specific setup (PKCE Google OAuth, service-role admin client, RLS-first security model).
---

# Supabase in this project

Supabase provides Postgres, Auth, and RLS for this app. There is no self-hosted Supabase — it's the hosted service, configured via env vars.

## Client setup (`src/lib/supabase.ts`)

- `supabase` — public client using `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, PKCE flow, session persistence. Use this for anything running in the browser or on behalf of a logged-in user.
- `supabaseAdmin` — service-role client using `SUPABASE_SERVICE_ROLE_KEY`. **Server-only** (API routes). Bypasses RLS — only use it where RLS bypass is actually required (e.g. cron jobs, admin operations), never expose it to client code.
- `isSupabaseConfigured` — guards against running with placeholder/example env values. Both clients are `null` if not configured; always check before use, following the existing pattern (`if (!supabase) throw new Error(...)`).
- Auth: Google OAuth via `signInWithGoogle()`, redirect to `/auth/callback`.

## Schema & migrations

- Canonical schema: `supabase/schema.sql` — this is what a fresh project runs via the Supabase SQL Editor (see `README.md` section 3).
- Incremental changes go in `supabase/migrations/YYYYMMDDHHMMSS_description.sql`. Existing examples:
  - `20260801000000_init.sql`
  - `20260802000000_revoke_anon_grants.sql`
- When adding a migration, also update `supabase/schema.sql` to stay the source of truth for fresh installs, unless the two are meant to diverge (check recent git history first).

## Row Level Security

This project is **RLS-first**: `users`, `emergency_contacts`, and `ping_logs` all have RLS enabled (see README section 3, step 4). Any new table holding user data must:
1. Have RLS enabled.
2. Have explicit policies scoping rows to `auth.uid()` (or the appropriate owner column).
3. Avoid relying on `supabaseAdmin` to work around missing policies from client code — fix the policy instead, and only use the admin client server-side where bypass is intentional.

Before writing new queries or policies, read `supabase/schema.sql` and the migrations directory to see current table shapes and existing policy patterns rather than guessing.
