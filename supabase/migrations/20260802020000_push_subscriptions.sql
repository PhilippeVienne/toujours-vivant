-- Table des abonnements Web Push (notifications de rappel & d'alerte envoyées
-- directement à l'appareil de l'utilisateur, en complément des e-mails proches).
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);

GRANT ALL ON TABLE public.push_subscriptions TO authenticated, service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gestion propres abonnements push" ON public.push_subscriptions;
CREATE POLICY "Gestion propres abonnements push"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id);
