-- Sortie de Supabase Auth : l'app gère désormais elle-même l'OAuth Google et
-- ses propres sessions (cookie JWT), et se connecte à Postgres directement en
-- tant que rôle unique de confiance. Il n'y a donc plus de JWT par-requête que
-- Postgres puisse vérifier (auth.uid() serait toujours NULL) — garder RLS
-- serait un faux sentiment de sécurité. La protection reste au niveau
-- applicatif (chaque requête filtre déjà explicitement par user_id).

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS google_sub TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ping_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilisateurs peuvent lire leur propre profil" ON public.users;
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leur propre profil" ON public.users;
DROP POLICY IF EXISTS "Gestion propres contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Lecture et insertion propres pings" ON public.ping_logs;
DROP POLICY IF EXISTS "Lecture propres alertes" ON public.alert_logs;
DROP POLICY IF EXISTS "Gestion propres abonnements push" ON public.push_subscriptions;
