-- Disposable-only baseline: without unique index, two active sessions
-- for the same student and lesson coexist. All IDs are synthetic.
\set ON_ERROR_STOP on
CREATE TABLE public.assessment_sessions (
  id uuid PRIMARY KEY,
  student_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  finished boolean NOT NULL DEFAULT false,
  correct_answers integer NOT NULL DEFAULT 0,
  wrong_answers integer NOT NULL DEFAULT 0
);

INSERT INTO public.assessment_sessions(id,student_id,lesson_id,finished)
VALUES
('11111111-1111-4111-8111-111111111111',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false),
('22222222-2222-4222-8222-222222222222',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false),
('33333333-3333-4333-8333-333333333333',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
DO $baseline$
BEGIN
 IF (SELECT count(*) FROM public.assessment_sessions
  WHERE finished = false AND student_id =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') <> 2
 THEN
  RAISE EXCEPTION 'DUPLICATE_ACTIVE_SESSION_BASELINE_NOT_REPRODUCED';
 END IF;
END $baseline$;
\echo SHADOW_ACTIVE_SESSION_DUPLICATES_REPRODUCED=PASS
