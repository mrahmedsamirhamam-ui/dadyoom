-- Disposable PostgreSQL fixture ONLY (not part of a production migration).
-- Models the minimum live auth/profile schema and the policy defect.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA auth TO authenticated;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'student',
  country text,
  email text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, anon;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND role IN ('student','child','teacher','parent','school'));
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Existing live trigger definitions are more involved; the reviewed patch
-- replaces these stub functions, preserving the trigger entrypoints.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.protect_profile_role_escalation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_protect_profile_role_escalation BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role_escalation();

-- Additional isolated question and grading fixtures modeled on the repository's
-- app/api/questions/answer/route.ts and Issue #57. NOT a live-schema snapshot.
CREATE TABLE public.questions (
 id uuid PRIMARY KEY, lesson_id uuid, question_order int, question text,
 question_type text, options jsonb, points int,
 correct_answer text, explanation text
);
CREATE TABLE public.question_attempts (
 user_id uuid NOT NULL REFERENCES auth.users(id),
 question_id uuid NOT NULL REFERENCES public.questions(id),
 selected_answer text, is_correct boolean,
 answered_at timestamptz, PRIMARY KEY(user_id,question_id)
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.questions TO anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.question_attempts TO anon,authenticated;
CREATE POLICY allow_published_questions_old ON public.questions FOR SELECT TO anon, authenticated USING(true);
CREATE POLICY allow_attempts_old ON public.question_attempts FOR ALL TO anon, authenticated USING(true) WITH CHECK(true);
