\set ON_ERROR_STOP on
DO $roles$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$roles$;

CREATE TABLE public.edu_feature_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT current_date,
  feature text NOT NULL,
  used_count integer NOT NULL DEFAULT 0 CHECK(used_count>=0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,usage_date,feature)
);
GRANT USAGE ON SCHEMA public TO service_role,authenticated,anon;
GRANT SELECT,INSERT,UPDATE ON public.edu_feature_usage TO service_role;
GRANT SELECT ON public.edu_feature_usage TO authenticated;
