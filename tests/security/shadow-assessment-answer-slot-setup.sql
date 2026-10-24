-- Synthetic only: NO production student IDs or keys.
\set ON_ERROR_STOP on
DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END $roles$;

CREATE TABLE public.assessment_sessions (
  id uuid PRIMARY KEY,
  student_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  current_question integer NOT NULL,
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL DEFAULT 0,
  wrong_answers integer NOT NULL DEFAULT 0,
  finished boolean NOT NULL DEFAULT false
);
CREATE TABLE public.assessment_session_answers (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.assessment_sessions(id),
  assessment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  skill text NOT NULL,
  selected_answer integer NOT NULL,
  correct_answer integer NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (session_id,assessment_id)
);
GRANT USAGE ON SCHEMA public TO authenticated,service_role;
GRANT SELECT,INSERT,UPDATE ON public.assessment_sessions TO service_role,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.assessment_session_answers TO service_role,authenticated;

INSERT INTO public.assessment_sessions
  (id,student_id,lesson_id,current_question,total_questions,correct_answers,wrong_answers)
VALUES
  ('11111111-1111-4111-8111-111111111111',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',2,3,1,0),
  ('22222222-2222-4222-8222-222222222222',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',1,3,0,0);

INSERT INTO public.assessment_session_answers
  (id,session_id,assessment_id,student_id,lesson_id,skill,
   selected_answer,correct_answer,is_correct,created_at)
VALUES
 ('99999999-9999-4999-8999-999999999999',
  '11111111-1111-4111-8111-111111111111',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'reading',1,1,true,'2026-10-24T00:00:00Z');

-- Confirm old unique(session_id,assessment_id) accepts two *different*
-- assessment IDs in the SAME unadvanced first question slot.
INSERT INTO public.assessment_session_answers
  (id,session_id,assessment_id,student_id,lesson_id,skill,
   selected_answer,correct_answer,is_correct)
VALUES
 ('77777777-7777-4777-8777-777777777777',
  '22222222-2222-4222-8222-222222222222',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','reading',1,1,true),
 ('88888888-8888-4888-8888-888888888888',
  '22222222-2222-4222-8222-222222222222',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','reading',1,1,true);
DO $baseline$
BEGIN
  IF (SELECT count(*) FROM public.assessment_session_answers
      WHERE session_id='22222222-2222-4222-8222-222222222222')<>2
  THEN RAISE EXCEPTION 'ANSWER_SLOT_OLD_UNIQUE_BYPASS_NOT_REPRODUCED'; END IF;
END $baseline$;
-- Restore valid state BEFORE rehearsing the new proposal.
DELETE FROM public.assessment_session_answers
WHERE session_id='22222222-2222-4222-8222-222222222222';
\echo SHADOW_DIFFERENT_ASSESSMENT_SAME_SLOT_REPRODUCED=PASS
