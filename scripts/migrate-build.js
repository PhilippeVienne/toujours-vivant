#!/usr/bin/env node
// Runs DB migrations automatically before `next build` — but only for real
// Production deploys. Vercel Preview builds currently share the same
// DATABASE_URL as Production (see README), so auto-migrating on every preview
// branch would let an unreviewed PR mutate the prod schema before merge.
// `npm run db:migrate` is always available to migrate deliberately elsewhere
// (local dev, or a preview you explicitly want to migrate).
if (process.env.VERCEL && process.env.VERCEL_ENV !== 'production') {
  console.log(`[migrate-build] Skipping auto-migration (Vercel env: ${process.env.VERCEL_ENV}).`);
  process.exit(0);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports -- plain CommonJS script, runs outside the Next.js bundle
const { spawnSync } = require('child_process');

const result = spawnSync('npx', ['node-pg-migrate', '--envPath', '.env.local', 'up'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
