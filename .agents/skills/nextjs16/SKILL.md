---
name: nextjs16
description: Use whenever writing or modifying Next.js code in this project (routes, layouts, server components, API routes, config). This project pins Next.js 16.2.12, which has breaking changes versus older Next.js training data — always check the local docs before assuming an API/convention still applies.
---

# Next.js 16 in this project

This repo runs Next.js **16.2.12** with React **19.2.4**. Do not rely on memorized Next.js conventions (App Router behavior, API routes, config options, caching defaults) without checking — several things changed across major versions.

## Before writing Next.js code

1. Check `node_modules/next/dist/docs/` for the relevant guide:
   - `01-app/` — App Router (routing, layouts, server/client components, data fetching, caching)
   - `02-pages/` — Pages Router (likely unused here, this project uses `src/app/`)
   - `03-architecture/` — internals, rendering model
   - `04-community/`
   - `index.md` — top-level index of all docs
2. Search for the specific API/convention you're about to use, e.g.:
   ```
   grep -rl "route.ts" node_modules/next/dist/docs/01-app
   ```
3. Heed any deprecation notices found — this project's `AGENTS.md` explicitly requires this.

## Project conventions observed

- App Router only, under `src/app/`.
- API routes live in `src/app/api/**/route.ts` (see `src/app/api/contacts/route.ts`, `src/app/api/ping/route.ts`, `src/app/api/user/settings/route.ts`, `src/app/api/user/token/route.ts`).
- Cron-triggered route: `src/app/api/check-alerts` (invoked by Vercel Cron, see `vercel.json` — [[vercel]] skill).
- Styling via Tailwind v4 (`@tailwindcss/postcss`).

When in doubt about whether an API still works the same way (e.g. route handler signatures, caching directives, `fetch` defaults, config keys in `next.config.*`), grep the local docs rather than assuming.
