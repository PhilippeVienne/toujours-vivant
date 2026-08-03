-- Script DDL Supabase Database pour Toujours Vivant
-- À exécuter dans l'éditeur SQL de Supabase (SQL Editor)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table Utilisateurs / Profils
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    emergency_token TEXT UNIQUE NOT NULL DEFAULT md5(random()::text || clock_timestamp()::text),
    ping_frequency_minutes INT DEFAULT 720,
    status TEXT CHECK (status IN ('OK', 'WARNING', 'ALERT', 'PAUSED')) DEFAULT 'OK',
    offline_until TIMESTAMPTZ,
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
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS offline_until TIMESTAMPTZ;
ALTER TABLE public.users ALTER COLUMN ping_frequency_minutes SET DEFAULT 720;

-- Grant privileges for Supabase roles (PostgREST). RLS is the real enforcement
-- layer; the unauthenticated 'anon' role does not need direct table privileges.
GRANT ALL ON TABLE public.users TO authenticated, service_role;
GRANT ALL ON TABLE public.emergency_contacts TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;

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

-- 4. Table Historique des Alertes Déclenchées
CREATE TABLE IF NOT EXISTS public.alert_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    trigger_reason TEXT NOT NULL,
    sent_to_emails TEXT[] NOT NULL,
    status TEXT DEFAULT 'SENT',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON TABLE public.ping_logs TO authenticated, service_role;
GRANT ALL ON TABLE public.alert_logs TO authenticated, service_role;

-- 4bis. Table des abonnements Web Push (rappels & alertes envoyés directement
-- à l'appareil de l'utilisateur, en complément des e-mails proches)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON TABLE public.push_subscriptions TO authenticated, service_role;

-- 5. Index de performance
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_token ON public.emergency_token;
CREATE INDEX IF NOT EXISTS idx_ping_logs_user_date ON public.ping_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);

--------------------------------------------------------------------------------
-- TRIGGER SUPABASE AUTH : Synchronisation automatique Google Auth -> public.users
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, emergency_token)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    md5(random()::text || clock_timestamp()::text)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur la table système auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES (STRICT PER-USER ISOLATION)
--------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ping_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table 'users'
DROP POLICY IF EXISTS "Utilisateurs peuvent lire leur propre profil" ON public.users;
CREATE POLICY "Utilisateurs peuvent lire leur propre profil"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leur propre profil" ON public.users;
CREATE POLICY "Utilisateurs peuvent modifier leur propre profil"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Politiques pour la table 'emergency_contacts'
DROP POLICY IF EXISTS "Gestion propres contacts" ON public.emergency_contacts;
CREATE POLICY "Gestion propres contacts"
  ON public.emergency_contacts FOR ALL
  USING (auth.uid() = user_id);

-- Politiques pour la table 'ping_logs'
DROP POLICY IF EXISTS "Lecture et insertion propres pings" ON public.ping_logs;
CREATE POLICY "Lecture et insertion propres pings"
  ON public.ping_logs FOR ALL
  USING (auth.uid() = user_id);

-- Politiques pour la table 'alert_logs' ON public.alert_logs;
DROP POLICY IF EXISTS "Lecture propres alertes" ON public.alert_logs;
CREATE POLICY "Lecture propres alertes"
  ON public.alert_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Politiques pour la table 'push_subscriptions'
DROP POLICY IF EXISTS "Gestion propres abonnements push" ON public.push_subscriptions;
CREATE POLICY "Gestion propres abonnements push"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id);
