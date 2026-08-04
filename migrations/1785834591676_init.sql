-- Up Migration

-- Consolidated schema for Toujours Vivant. Written to be idempotent so it
-- runs identically against a fresh local Postgres (Docker) and against the
-- already-provisioned production database (previously bootstrapped by hand
-- via the Supabase CLI, see supabase/migrations/ for that history). Uses the
-- core `gen_random_uuid()` (built into Postgres 13+) instead of the
-- `uuid-ossp` extension so it needs nothing beyond a stock Postgres image —
-- no Supabase-specific extensions schema or roles.

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    google_sub TEXT UNIQUE,
    emergency_token TEXT UNIQUE NOT NULL DEFAULT md5(random()::text || clock_timestamp()::text),
    ping_frequency_minutes INT DEFAULT 720,
    status TEXT CHECK (status IN ('OK', 'WARNING', 'ALERT', 'PAUSED')) DEFAULT 'OK',
    offline_until TIMESTAMPTZ,
    last_ping_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS google_sub TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    contact_token TEXT UNIQUE DEFAULT md5(random()::text || clock_timestamp()::text),
    notify_by_email BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.emergency_contacts ALTER COLUMN id SET DEFAULT gen_random_uuid();

CREATE TABLE IF NOT EXISTS public.ping_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    ping_type TEXT CHECK (ping_type IN ('MANUAL', 'PASSIVE_MOTION', 'PUSH_CHECKIN')) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_name TEXT,
    message TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ping_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();

CREATE TABLE IF NOT EXISTS public.alert_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    trigger_reason TEXT NOT NULL,
    sent_to_emails TEXT[] NOT NULL,
    status TEXT DEFAULT 'SENT',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.alert_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.push_subscriptions ALTER COLUMN id SET DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_token ON public.users(emergency_token);
CREATE INDEX IF NOT EXISTS idx_ping_logs_user_date ON public.ping_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);

-- No RLS, no Supabase auth/PostgREST roles: this app connects as a single
-- trusted role and enforces per-user access in application code (see
-- src/lib/db.ts) — see supabase/migrations/20260803000000_drop_supabase_auth.sql
-- for the reasoning when this changed on the production database.

-- Down Migration

DROP TABLE IF EXISTS public.push_subscriptions;
DROP TABLE IF EXISTS public.alert_logs;
DROP TABLE IF EXISTS public.ping_logs;
DROP TABLE IF EXISTS public.emergency_contacts;
DROP TABLE IF EXISTS public.users;
