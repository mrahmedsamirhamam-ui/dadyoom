\set ON_ERROR_STOP on
-- Run ONLY in freshly created ephemeral PostgreSQL service named as below.
DO $$
BEGIN
 IF current_database() <> 'dadyoom_lq1_ci_isolated' THEN
   RAISE EXCEPTION 'ISOLATION_GUARD: expected dadyoom_lq1_ci_isolated, got %', current_database();
 END IF;
END;
$$;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE TABLE public.countries (id uuid PRIMARY KEY, code text NOT NULL);
CREATE TABLE public.curricula (id uuid PRIMARY KEY, country_id uuid NOT NULL REFERENCES public.countries(id));
CREATE TABLE public.grades (id uuid PRIMARY KEY, curriculum_id uuid NOT NULL REFERENCES public.curricula(id), grade_number integer NOT NULL);
CREATE TABLE public.units (id uuid PRIMARY KEY, grade_id uuid NOT NULL REFERENCES public.grades(id));
CREATE TABLE public.lessons (
 id uuid PRIMARY KEY,
 unit_id uuid NOT NULL REFERENCES public.units(id),
 title text NOT NULL,
 status text NOT NULL,
 is_free boolean NOT NULL DEFAULT true,
 published_at timestamptz,
 summary text,
 source_pdf_url text,
 content text
);
INSERT INTO auth.users(id) VALUES ('22222222-2222-4222-8222-222222222222');
INSERT INTO public.countries(id,code) VALUES('33333333-3333-4333-8333-333333333333','BH');
INSERT INTO public.curricula(id,country_id) VALUES('44444444-4444-4444-8444-444444444444','33333333-3333-4333-8333-333333333333');
INSERT INTO public.grades(id,curriculum_id,grade_number) VALUES('55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444',2);
INSERT INTO public.units(id,grade_id) VALUES('66666666-6666-4666-8666-666666666666','55555555-5555-4555-8555-555555555555');
INSERT INTO public.lessons(id,unit_id,title,status,is_free,published_at,summary,source_pdf_url,content) VALUES(
 '11111111-1111-4111-8111-111111111111','66666666-6666-4666-8666-666666666666',
 'fixture lesson, never production','published',false,'2026-01-01T00:00:00Z','untouched summary','https://example.test/source','untouched content');
\echo FIXTURE_SETUP_PASS
