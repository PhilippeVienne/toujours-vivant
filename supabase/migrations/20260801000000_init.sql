-- Migration Supabase Initialisation Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table Utilisateurs / Profils
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    emergency_token TEXT UNIQUE NOT NULL DEFAULT md5(random()::text || clock_timestamp()::text),
    ping_frequency_minutes INT DEFAULT 30,
    status TEXT CHECK (status IN ('OK', 'WARNING', 'ALERT', 'PAUSED')) DEFAULT 'OK',
    last_ping_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table Contacts d'Urgence (Proches)
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    contact_token TEXT UNIQUE DEFAULT md5(random()::text || clock_timestamp()::text),
    notify_by_email BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrations d'ajustement si les tables existent déjà :
ALTER TABLE public.emergency_contacts ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.emergency_contacts ADD COLUMN IF NOT EXISTS contact_token TEXT UNIQUE DEFAULT md5(random()::text || clock_timestamp()::text);

-- 3. Table Historique des Check-ins & Pings
CREATE TABLE IF NOT EXISTS public.ping_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    ping_type TEXT CHECK (ping_type IN ('MANUAL', 'PASSIVE_MOTION', 'PUSH_CHECKIN')) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_name TEXT,
    message TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table Historique des Alertes
CREATE TABLE IF NOT EXISTS public.alert_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    trigger_reason TEXT NOT NULL,
    sent_to_emails TEXT[] NOT NULL,
    status TEXT DEFAULT 'SENT',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grants
GRANT ALL ON TABLE public.users TO authenticated, service_role, anon;
GRANT ALL ON TABLE public.emergency_contacts TO authenticated, service_role, anon;
GRANT ALL ON TABLE public.ping_logs TO authenticated, service_role, anon;
GRANT ALL ON TABLE public.alert_logs TO authenticated, service_role, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ping_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilisateurs peuvent lire leur propre profil" ON public.users;
CREATE POLICY "Utilisateurs peuvent lire leur propre profil" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leur propre profil" ON public.users;
CREATE POLICY "Utilisateurs peuvent modifier leur propre profil" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Gestion propres contacts" ON public.emergency_contacts;
CREATE POLICY "Gestion propres contacts" ON public.emergency_contacts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Lecture et insertion propres pings" ON public.ping_logs;
CREATE POLICY "Lecture et insertion propres pings" ON public.ping_logs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Lecture propres alertes" ON public.alert_logs;
CREATE POLICY "Lecture propres alertes" ON public.alert_logs FOR SELECT USING (auth.uid() = user_id);
