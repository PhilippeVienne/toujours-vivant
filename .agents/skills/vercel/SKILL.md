---
name: vercel
description: Use whenever touching deployment, vercel.json, or Vercel Cron config for this project. Covers this project's cron-triggered alert check and general Vercel hosting assumptions.
---

# Vercel in this project

The app is deployed to Vercel (`framework: nextjs`). Config lives in `vercel.json` at repo root.

## Vercel Cron

`vercel.json` defines a daily cron:
```json
{
  "framework": "nextjs",
  "crons": [
    { "path": "/api/check-alerts", "schedule": "0 0 * * *" }
  ]
}
```
This hits `src/app/api/check-alerts/route.ts` once a day (UTC) to check for silent users and trigger alert emails. If you change the alert-check logic or its route path, keep this in sync with `vercel.json`.

Vercel Cron only fires on production deployments — it will not fire on preview deployments or local `next dev`. `README.md` also documents an "Option A: Vercel Cron" alternative flow — check there for any manual-trigger fallback documented for environments without Vercel Cron (e.g. self-hosted).

## Env vars

Deployment requires the same env vars as local dev (Supabase, Upstash, Resend — see README "Configuration" section): these must be set in the Vercel project dashboard, not just `.env.local`. When adding a new env var to the codebase, remind the user it also needs to be added in Vercel.

## Self-hosting alternative

README.md states Vercel is not mandatory ("ou tout hébergeur compatible Node.js / Docker"). If working on deployment-adjacent code, don't assume Vercel-only APIs (e.g. Vercel KV, Edge Config, `@vercel/*` packages) are available unless they're already a dependency — this project deliberately uses portable services (Supabase, Upstash Redis, Resend) instead of Vercel-proprietary ones.
