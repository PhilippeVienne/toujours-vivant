-- Security hardening: the unauthenticated 'anon' PostgREST role was granted
-- full table privileges. RLS policies already restrict row access per-user,
-- but this GRANT unnecessarily widened the privilege surface. Revoke it.
REVOKE ALL ON TABLE public.users FROM anon;
REVOKE ALL ON TABLE public.emergency_contacts FROM anon;
REVOKE ALL ON TABLE public.ping_logs FROM anon;
REVOKE ALL ON TABLE public.alert_logs FROM anon;
