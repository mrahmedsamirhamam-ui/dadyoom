-- P0 test fixture for a freshly initialized LOCAL SUPABASE stack ONLY.
-- Never run against a hosted Supabase instance; contains intentionally vulnerable
-- baseline permissions for proving the proposed cutover's deny behavior.
\set ON_ERROR_STOP on
DO $guard$
BEGIN
 IF current_database()<>'postgres'
 OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticator')
 OR to_regclass('auth.users') IS NULL
 OR to_regclass('public.profiles') IS NOT NULL
 THEN RAISE EXCEPTION 'LOCAL_SUPABASE_FIXTURE_GUARD_REFUSED'; END IF;
END $guard$;
CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL DEFAULT 'student', full_name text, country text, email text
);
CREATE TABLE public.countries (id uuid PRIMARY KEY, code text NOT NULL);
CREATE TABLE public.curricula (id uuid PRIMARY KEY, country_id uuid NOT NULL REFERENCES public.countries(id));
CREATE TABLE public.grades (id uuid PRIMARY KEY, curriculum_id uuid NOT NULL REFERENCES public.curricula(id), grade_number int NOT NULL);
CREATE TABLE public.units (id uuid PRIMARY KEY, grade_id uuid NOT NULL REFERENCES public.grades(id));
CREATE TABLE public.lessons (
 id uuid PRIMARY KEY, unit_id uuid NOT NULL REFERENCES public.units(id),
 title text NOT NULL, status text NOT NULL, is_free boolean NOT NULL DEFAULT true,
 published_at timestamptz, summary text, source_pdf_url text, content text
);
CREATE TABLE public.questions (
 id uuid PRIMARY KEY, lesson_id uuid NOT NULL REFERENCES public.lessons(id),
 question_order int, question text, question_type text, options jsonb,
 points int, correct_answer text, explanation text
);
CREATE TABLE public.question_attempts (
 user_id uuid NOT NULL REFERENCES auth.users(id),
 question_id uuid NOT NULL REFERENCES public.questions(id),
 selected_answer text, is_correct boolean, answered_at timestamptz,
 PRIMARY KEY(user_id, question_id)
);
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$ BEGIN RETURN NEW; END; $fn$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
 FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
-- Deliberately emulate pre-fix broad permissions, NOT safe deployment defaults.
GRANT SELECT,INSERT,UPDATE,DELETE ON public.profiles,public.questions,public.question_attempts
 TO anon,authenticated;
GRANT SELECT ON public.lessons TO anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.profiles,public.questions,public.question_attempts,
 public.lessons,public.countries,public.curricula,public.grades,public.units TO service_role;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
 WITH CHECK(id=(SELECT auth.uid()));
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
 USING(id=(SELECT auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
 USING(id=(SELECT auth.uid())) WITH CHECK(id=(SELECT auth.uid()));
CREATE POLICY "Old published questions read" ON public.questions FOR SELECT TO anon,authenticated
 USING(true);
CREATE POLICY "Old question editor can write" ON public.questions FOR UPDATE TO authenticated
 USING(true) WITH CHECK(true);
CREATE POLICY "Old attempts read" ON public.question_attempts FOR SELECT TO authenticated
 USING(true);
CREATE POLICY "Old attempts write" ON public.question_attempts FOR ALL TO authenticated
 USING(true) WITH CHECK(true);
CREATE POLICY "Published lessons" ON public.lessons FOR SELECT TO anon,authenticated
 USING(status='published');
INSERT INTO public.countries(id,code)
 VALUES('33333333-3333-4333-8333-333333333333','BH');
INSERT INTO public.curricula(id,country_id)
 VALUES('44444444-4444-4444-8444-444444444444','33333333-3333-4333-8333-333333333333');
INSERT INTO public.grades(id,curriculum_id,grade_number)
 VALUES('55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444',2);
INSERT INTO public.units(id,grade_id)
 VALUES('66666666-6666-4666-8666-666666666666','55555555-5555-4555-8555-555555555555');
INSERT INTO public.lessons(id,unit_id,title,status,is_free,published_at,summary,source_pdf_url,content)
 VALUES('11111111-1111-4111-8111-111111111111','66666666-6666-4666-8666-666666666666',
 'synthetic QA only','published',false,'2026-01-01','preserve summary','https://example.invalid/source','preserve content');
\echo P0_LOCAL_SUPABASE_FIXTURE_READY
