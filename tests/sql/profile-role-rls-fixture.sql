-- Disposable Postgres fixture only. Never run against production.
CREATE SCHEMA auth;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE anon NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA auth TO authenticated, anon, service_role;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
CREATE TABLE auth.users (
  id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  email text,
  role text NOT NULL DEFAULT 'student',
  country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  grade_number integer,
  interests text[],
  learning_goal text,
  preferred_learning_style text,
  onboarding_completed boolean,
  grade_academic_year text,
  country_source text,
  onboarding_updated_at timestamptz
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.profiles TO authenticated, anon, service_role;
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "Users read allowed profiles" ON public.profiles
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);
CREATE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path='public' AS $$
BEGIN
 INSERT INTO public.profiles(id,full_name,role,country,email)
 VALUES(NEW.id, 'legacy', COALESCE(NEW.raw_user_meta_data->>'role','student'), 'BH', NEW.email);
 RETURN NEW;
END;$$;
CREATE FUNCTION public.protect_profile_role_escalation() RETURNS trigger LANGUAGE plpgsql
AS $$ BEGIN RETURN NEW; END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER trg_protect_profile_role_escalation BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role_escalation();
