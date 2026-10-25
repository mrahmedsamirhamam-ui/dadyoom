\set ON_ERROR_STOP on
-- Disposable PostgreSQL 16 only. No real identifiers or student data.
DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $roles$;
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY,
  status text NOT NULL
);
CREATE TABLE public.lesson_activities (
  id uuid PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id),
  is_published boolean NOT NULL,
  points integer NOT NULL
);
CREATE TABLE public.lesson_activity_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  activity_id uuid NOT NULL REFERENCES public.lesson_activities(id),
  selected_answer jsonb NOT NULL,
  is_correct boolean NOT NULL,
  earned_points integer NOT NULL,
  max_points integer NOT NULL,
  attempt_number integer NOT NULL,
  CONSTRAINT lesson_activity_attempts_user_activity_attempt_number_key
    UNIQUE(user_id, activity_id, attempt_number)
);
CREATE TABLE public.student_lesson_progress (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id),
  status text NOT NULL,
  progress_percent integer NOT NULL,
  last_score integer NOT NULL,
  best_score integer NOT NULL,
  attempts integer NOT NULL,
  xp integer NOT NULL,
  time_spent_seconds integer NOT NULL,
  started_at timestamptz,
  updated_at timestamptz,
  UNIQUE(student_id,lesson_id)
);
INSERT INTO public.lessons VALUES
('22222222-2222-4222-8222-222222222222', 'published');
INSERT INTO public.lesson_activities VALUES
('33333333-3333-4333-8333-333333333333',
 '22222222-2222-4222-8222-222222222222', true, 5);
GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE ON
 public.lessons,public.lesson_activities,public.lesson_activity_attempts,
 public.student_lesson_progress TO service_role;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
\echo SHADOW_ATOMIC_FIXTURE=PASS
