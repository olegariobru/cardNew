CREATE TABLE IF NOT EXISTS public.member_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 160),
  registration TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS member_profiles_registration_ci_uq
  ON public.member_profiles (LOWER(registration));

CREATE INDEX IF NOT EXISTS member_profiles_name_idx
  ON public.member_profiles (LOWER(name));

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  member_id UUID REFERENCES public.member_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON public.admin_audit_log (created_at DESC);

ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.member_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.member_profiles TO authenticated;
GRANT ALL ON TABLE public.member_profiles TO service_role;

REVOKE ALL ON TABLE public.admin_audit_log FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.admin_audit_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.admin_audit_log_id_seq TO service_role;

DROP POLICY IF EXISTS "Read own active member profile or admin list" ON public.member_profiles;
CREATE POLICY "Read own active member profile or admin list"
  ON public.member_profiles
  FOR SELECT
  TO authenticated
  USING (
    (id = (SELECT auth.uid()) AND active = TRUE)
    OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  );

DROP POLICY IF EXISTS "No direct client access to audit log" ON public.admin_audit_log;
