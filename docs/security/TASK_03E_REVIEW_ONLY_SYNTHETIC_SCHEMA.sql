-- =====================================================================
-- TASK 03-E — REVIEW ONLY SYNTHETIC SCHEMA FIXTURE
-- =====================================================================
-- NOT A MIGRATION. NOT VERIFIED PRODUCTION SCHEMA. NOT APPLIED ANYWHERE.
-- Execute only inside the disposable, unlinked, loopback Supabase stack
-- created by TASK_03E_REVIEW_ONLY_ISOLATED_CI.yml after its isolation gate.
--
-- This fixture intentionally reproduces the Issue #117 vulnerable shape:
--   * a metadata-derived public.handle_new_user();
--   * broad anon/authenticated profile grants;
--   * own-row INSERT/UPDATE policies that still permit role writes.
-- It then lets the reviewed TASK 03-D SQL replace that unsafe baseline.
-- All data created against it is synthetic. No production-derived schema is
-- included, and no missing production detail is invented.
-- =====================================================================

DO $guard$
BEGIN
  IF current_database() !~ '^[a-z0-9_]+$' THEN
    RAISE EXCEPTION 'TASK03E_FIXTURE_REFUSED: unexpected database name';
  END IF;
  -- psql reaches Supabase Local through a loopback-published port, but the
  -- PostgreSQL backend reports its Docker bridge address (for example
  -- 172.18.0.2). The workflow already fails closed unless the client-side
  -- DB_URL is loopback; this guard additionally refuses public server IPs.
  IF inet_server_addr() IS NOT NULL
     AND NOT (
       inet_server_addr() <<= inet '127.0.0.0/8'
       OR inet_server_addr() <<= inet '10.0.0.0/8'
       OR inet_server_addr() <<= inet '172.16.0.0/12'
       OR inet_server_addr() <<= inet '192.168.0.0/16'
     ) THEN
    RAISE EXCEPTION 'TASK03E_FIXTURE_REFUSED: endpoint is not loopback or private container network';
  END IF;
END
$guard$;

BEGIN;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role text NOT NULL DEFAULT 'student'
    CHECK (role IN ('student','child','parent','teacher','school','admin')),
  country text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO anon, authenticated;

DROP POLICY IF EXISTS "Users select own profile" ON public.profiles;
CREATE POLICY "Users select own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Deliberately vulnerable baseline. The reviewed TASK 03-D proposal replaces
-- this function before any adversarial test is executed.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, country)
  VALUES (
    NEW.id,
    NEW.email,
    lower(btrim(coalesce(NEW.raw_user_meta_data ->> 'role', 'student'))),
    nullif(btrim(coalesce(NEW.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(upper(btrim(coalesce(NEW.raw_user_meta_data ->> 'country', ''))), '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user()
  TO postgres, service_role, supabase_auth_admin;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- Baseline inventory for the report. Values are expected to be vulnerable
-- before the review SQL and safe after it. No secret values are printed.
-- SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
--   FROM pg_policies WHERE schemaname='public' AND tablename='profiles'
--  ORDER BY policyname;
-- SELECT grantee, privilege_type, column_name
--   FROM information_schema.role_table_grants
--  WHERE table_schema='public' AND table_name='profiles'
--  ORDER BY grantee, privilege_type, column_name;
