-- The exact guarded partial unique index has already been rehearsed.
\set ON_ERROR_STOP on

DO $check$
BEGIN
 IF NOT EXISTS (
   SELECT 1
   FROM pg_index i JOIN pg_class idx ON idx.oid=i.indexrelid
   WHERE i.indrelid='public.assessment_sessions'::regclass
    AND idx.relname='assessment_sessions_one_unfinished_per_student_lesson'
    AND i.indisunique AND i.indpred IS NOT NULL
 ) THEN
  RAISE EXCEPTION 'ACTIVE_SESSION_PARTIAL_UNIQUE_INDEX_MISSING';
 END IF;
END $check$;
\echo SHADOW_ACTIVE_SESSION_PARTIAL_UNIQUE_INDEX_PRESENT=PASS

-- A duplicate active INSERT is denied even without application-layer
-- check-then-insert; the existing historical finished row is unaffected.
DO $duplicate$
DECLARE rejected boolean := false;
BEGIN
 BEGIN
  INSERT INTO public.assessment_sessions(id,student_id,lesson_id,finished)
  VALUES (
   '44444444-4444-4444-8444-444444444444',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false
  );
 EXCEPTION WHEN unique_violation THEN
   rejected := true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'SECOND_ACTIVE_SESSION_INSERT_ALLOWED'; END IF;
 IF (SELECT count(*) FROM public.assessment_sessions
  WHERE student_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    AND lesson_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    AND finished=false) <> 1
 THEN RAISE EXCEPTION 'ACTIVE_SESSION_CARDINALITY_NOT_ONE'; END IF;
END $duplicate$;
\echo SHADOW_ACTIVE_SESSION_SECOND_ACTIVE_INSERT_DENIED=PASS

-- Multiple *finished* sessions for the same student+lesson are allowed.
INSERT INTO public.assessment_sessions(id,student_id,lesson_id,finished)
VALUES (
 '44444444-4444-4444-8444-444444444444',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true
);
DO $finished$
BEGIN
 IF (SELECT count(*) FROM public.assessment_sessions
  WHERE student_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  AND lesson_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  AND finished=true) <> 2
 THEN RAISE EXCEPTION 'HISTORICAL_FINISHED_SESSIONS_BLOCKED'; END IF;
END $finished$;
\echo SHADOW_ACTIVE_SESSION_FINISHED_HISTORY_PRESERVED=PASS

-- The old active slot can transition to finished, allowing exactly one
-- later retake; turning a historical row active then fails again.
UPDATE public.assessment_sessions SET finished=true
WHERE id='11111111-1111-4111-8111-111111111111';
INSERT INTO public.assessment_sessions(id,student_id,lesson_id,finished)
VALUES (
 '55555555-5555-4555-8555-555555555555',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false
);
DO $transition$
DECLARE rejected boolean := false;
BEGIN
 BEGIN
  UPDATE public.assessment_sessions SET finished=false
  WHERE id='33333333-3333-4333-8333-333333333333';
 EXCEPTION WHEN unique_violation THEN
  rejected := true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'FINISHED_SESSION_REOPENING_BYPASSED_INDEX'; END IF;
END $transition$;
\echo SHADOW_ACTIVE_SESSION_RETAKE_TRANSITION_INTEGRITY=PASS

-- Simulate rollback of proposed INDEX only. No student data altered.
DROP INDEX public.assessment_sessions_one_unfinished_per_student_lesson;
INSERT INTO public.assessment_sessions(id,student_id,lesson_id,finished)
VALUES (
 '66666666-6666-4666-8666-666666666666',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false
);
DO $rollback$
BEGIN
 IF EXISTS (
  SELECT 1 FROM pg_indexes WHERE schemaname='public'
   AND indexname='assessment_sessions_one_unfinished_per_student_lesson'
 ) THEN RAISE EXCEPTION 'ACTIVE_SESSION_INDEX_ROLLBACK_FAILED'; END IF;
 IF (SELECT count(*) FROM public.assessment_sessions
  WHERE student_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    AND lesson_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    AND finished=false)<>2
 THEN RAISE EXCEPTION 'ACTIVE_SESSION_INDEX_ROLLBACK_BEHAVIOR_NOT_RESTORED'; END IF;
END $rollback$;
\echo SHADOW_ACTIVE_SESSION_INDEX_ROLLBACK=PASS
