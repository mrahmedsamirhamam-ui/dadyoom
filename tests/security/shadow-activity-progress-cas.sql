-- DISPOSABLE CI POSTGRES ONLY: exact SQL CAS predicates used by the
-- server-side activity progress writer. This file never targets Supabase.
\set ON_ERROR_STOP on

CREATE TABLE public.student_lesson_progress (
  id uuid PRIMARY KEY,
  student_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  status text NOT NULL,
  attempts integer NOT NULL,
  best_score integer NOT NULL,
  progress_percent integer NOT NULL,
  xp integer NOT NULL,
  CONSTRAINT synthetic_owner_lesson_unique UNIQUE (student_id, lesson_id)
);

INSERT INTO public.student_lesson_progress VALUES (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  'in_progress', 4, 80, 55, 0
);

DO $rehearsal$
DECLARE count_rows integer; rec record;
BEGIN
  -- Request A writes the first higher score.
  UPDATE public.student_lesson_progress SET
    attempts=5, best_score=96, progress_percent=95
  WHERE student_id='22222222-2222-4222-8222-222222222222'
    AND lesson_id='33333333-3333-4333-8333-333333333333'
    AND status='in_progress' AND attempts=4
    AND best_score<=96 AND progress_percent<=95;
  GET DIAGNOSTICS count_rows=ROW_COUNT;
  IF count_rows<>1 THEN RAISE EXCEPTION 'CAS_FIRST_WRITE_FAILED'; END IF;

  -- Request B cannot overwrite A using its stale attempts=4 snapshot.
  UPDATE public.student_lesson_progress SET
    attempts=5, best_score=90, progress_percent=75
  WHERE student_id='22222222-2222-4222-8222-222222222222'
    AND lesson_id='33333333-3333-4333-8333-333333333333'
    AND status='in_progress' AND attempts=4
    AND best_score<=90 AND progress_percent<=75;
  GET DIAGNOSTICS count_rows=ROW_COUNT;
  IF count_rows<>0 THEN RAISE EXCEPTION 'CAS_STALE_WRITE_ACCEPTED'; END IF;

  -- B rereads, merges max(saved, incoming), then increments to six.
  UPDATE public.student_lesson_progress SET
    attempts=6, best_score=96, progress_percent=95
  WHERE student_id='22222222-2222-4222-8222-222222222222'
    AND lesson_id='33333333-3333-4333-8333-333333333333'
    AND status='in_progress' AND attempts=5
    AND best_score<=96 AND progress_percent<=95;
  GET DIAGNOSTICS count_rows=ROW_COUNT;
  IF count_rows<>1 THEN RAISE EXCEPTION 'CAS_RETRY_FAILED'; END IF;

  SELECT * INTO rec FROM public.student_lesson_progress;
  IF rec.attempts<>6 OR rec.best_score<>96 OR rec.progress_percent<>95 OR rec.xp<>0
  THEN RAISE EXCEPTION 'CAS_MONOTONIC_PROGRESS_FAILED'; END IF;

  -- A separate trusted completion takes precedence even over a stale
  -- request holding a previously valid in_progress snapshot.
  UPDATE public.student_lesson_progress SET
    status='mastered', best_score=98, progress_percent=100, xp=30
  WHERE id='11111111-1111-4111-8111-111111111111';

  UPDATE public.student_lesson_progress SET
    status='in_progress', attempts=7, best_score=96, progress_percent=95
  WHERE student_id='22222222-2222-4222-8222-222222222222'
    AND lesson_id='33333333-3333-4333-8333-333333333333'
    AND status='in_progress' AND attempts=6
    AND best_score<=96 AND progress_percent<=95;
  GET DIAGNOSTICS count_rows=ROW_COUNT;
  IF count_rows<>0 THEN RAISE EXCEPTION 'CAS_MASTERED_DOWNGRADE_ALLOWED'; END IF;

  UPDATE public.student_lesson_progress SET
    status='mastered', attempts=7, best_score=98, progress_percent=100
  WHERE student_id='22222222-2222-4222-8222-222222222222'
    AND lesson_id='33333333-3333-4333-8333-333333333333'
    AND status='mastered' AND attempts=6
    AND best_score<=98 AND progress_percent<=100;
  GET DIAGNOSTICS count_rows=ROW_COUNT;
  IF count_rows<>1 THEN RAISE EXCEPTION 'CAS_MASTERED_RETRY_FAILED'; END IF;

  -- Concurrent first-lesson inserts may collide; DO NOTHING must not
  -- overwrite grades, attempts, status or XP of the winner.
  INSERT INTO public.student_lesson_progress VALUES (
    '44444444-4444-4444-8444-444444444444',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    'in_progress', 1, 55, 20, 0
  ) ON CONFLICT (student_id,lesson_id) DO NOTHING;
  GET DIAGNOSTICS count_rows=ROW_COUNT;
  IF count_rows<>0 THEN RAISE EXCEPTION 'CAS_FIRST_INSERT_REPLACED_EXISTING'; END IF;

  SELECT * INTO rec FROM public.student_lesson_progress;
  IF rec.attempts<>7 OR rec.best_score<>98 OR rec.progress_percent<>100
     OR rec.status<>'mastered' OR rec.xp<>30
  THEN RAISE EXCEPTION 'CAS_MASTERED_STATE_REGRESSED'; END IF;
END
$rehearsal$;
\echo SHADOW_ACTIVITY_PROGRESS_CAS_STATUS_XP_ATTEMPTS_AND_INSERT_RACES=PASS
