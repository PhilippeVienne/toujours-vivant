-- Adds "hors réseau" (offline) support and re-tunes the default check-in
-- window for the twice-daily traveler use case instead of a 30-minute dead switch.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS offline_until TIMESTAMPTZ;
ALTER TABLE public.users ALTER COLUMN ping_frequency_minutes SET DEFAULT 720;
