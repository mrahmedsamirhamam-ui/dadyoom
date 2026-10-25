-- SHADOW-ONLY, NOT A DEPLOYABLE PRODUCTION MIGRATION.
-- Atomically insert a trusted-server graded attempt and update its owner
-- lesson progress in one PostgreSQL transaction. Never grant to browser roles.
\set ON_ERROR_STOP on
DO $guard$
BEGIN
  IF current_database() <> 'shadow_activity_atomic'
    OR current_setting('dadyoom.atomic_activity_rehearsal', true) IS DISTINCT FROM 'enabled'
  THEN RAISE EXCEPTION 'PRODUCTION_ATOMIC_ACTIVITY_COMMIT_BLOCKED'; END IF;
END $guard$;

BEGIN;
CREATE OR REPLACE FUNCTION public.dadyoom_commit_activity_attempt(
  p_student_id uuid,
  p_lesson_id uuid,
  p_activity_id uuid,
  p_selected_answer jsonb,
  p_is_correct boolean,
  p_is_gradable boolean,
  p_earned_points integer,
  p_max_points integer,
  p_lesson_score integer,
  p_progress_percent integer
) RETURNS TABLE(
  saved_attempt_number integer,
  saved_best_score integer,
  saved_progress_percent integer
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $commit$
DECLARE
  v_activity_points integer;
  v_attempt_number integer;
  v_best_score integer;
  v_progress_percent integer;
BEGIN
  IF p_student_id IS NULL OR p_lesson_id IS NULL OR p_activity_id IS NULL
    OR p_is_correct IS NULL OR p_is_gradable IS NULL
    OR p_earned_points IS NULL OR p_max_points IS NULL
    OR p_lesson_score IS NULL OR p_progress_percent IS NULL
    OR p_lesson_score NOT BETWEEN 0 AND 100
    OR p_progress_percent NOT BETWEEN 0 AND 100
    OR p_earned_points < 0 OR p_max_points < 0 OR p_earned_points > p_max_points
    OR pg_catalog.jsonb_typeof(p_selected_answer) IS DISTINCT FROM 'array'
    OR pg_catalog.jsonb_array_length(p_selected_answer) > 64
  THEN RAISE EXCEPTION 'INVALID_TRUSTED_ACTIVITY_RESULT'; END IF;

  -- Protect grade/XP from other concurrent trusted activity commits.
  -- A 64-bit advisory hash collision only serializes unrelated students.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_student_id::text || ':' || p_lesson_id::text, 0)
  );

  SELECT a.points INTO v_activity_points
  FROM public.lesson_activities a
  JOIN public.lessons l ON l.id = a.lesson_id
  WHERE a.id = p_activity_id AND a.lesson_id = p_lesson_id
    AND a.is_published IS TRUE AND l.status = 'published'
  FOR SHARE OF a,l;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ACTIVITY_IS_NOT_PUBLISHED_OR_GRADE_WEIGHT_CHANGED';
  END IF;
  IF (p_is_gradable AND p_max_points <> v_activity_points)
    OR (NOT p_is_gradable AND p_max_points <> 0)
    OR (NOT p_is_correct AND p_earned_points <> 0)
    OR (p_is_gradable AND p_is_correct AND p_earned_points <> p_max_points)
    OR (NOT p_is_gradable AND p_earned_points <> 0)
  THEN
    RAISE EXCEPTION 'ACTIVITY_IS_NOT_PUBLISHED_OR_GRADE_WEIGHT_CHANGED';
  END IF;

  SELECT COALESCE(MAX(a.attempt_number), 0) + 1 INTO v_attempt_number
  FROM public.lesson_activity_attempts a
  WHERE a.user_id = p_student_id AND a.activity_id = p_activity_id;
  IF v_attempt_number IS NULL OR v_attempt_number < 1 THEN
    RAISE EXCEPTION 'INVALID_NEXT_ACTIVITY_ATTEMPT'; END IF;

  INSERT INTO public.lesson_activity_attempts (
    user_id, activity_id, selected_answer, is_correct,
    earned_points, max_points, attempt_number
  ) VALUES (
    p_student_id, p_activity_id, p_selected_answer, p_is_correct,
    p_earned_points, p_max_points, v_attempt_number
  );

  INSERT INTO public.student_lesson_progress (
    student_id, lesson_id, status, progress_percent, last_score,
    best_score, attempts, xp, time_spent_seconds, started_at, updated_at
  ) VALUES (
    p_student_id, p_lesson_id, 'in_progress', p_progress_percent, p_lesson_score,
    p_lesson_score, 1, 0, 0, now(), now()
  )
  ON CONFLICT (student_id, lesson_id) DO UPDATE
  SET
    attempts = public.student_lesson_progress.attempts + 1,
    last_score = EXCLUDED.last_score,
    best_score = GREATEST(public.student_lesson_progress.best_score, EXCLUDED.best_score),
    progress_percent = GREATEST(
      public.student_lesson_progress.progress_percent, EXCLUDED.progress_percent
    ),
    status = CASE
      WHEN public.student_lesson_progress.status IN ('mastered','completed')
      THEN public.student_lesson_progress.status
      ELSE 'in_progress'
    END,
    updated_at = now()
  RETURNING best_score, progress_percent INTO v_best_score, v_progress_percent;

  RETURN QUERY SELECT v_attempt_number, v_best_score, v_progress_percent;
END;
$commit$;

-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default.
REVOKE ALL ON FUNCTION public.dadyoom_commit_activity_attempt(
  uuid,uuid,uuid,jsonb,boolean,boolean,integer,integer,integer,integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dadyoom_commit_activity_attempt(
  uuid,uuid,uuid,jsonb,boolean,boolean,integer,integer,integer,integer
) TO service_role;

DO $verify$
DECLARE f regprocedure;
BEGIN
  f := 'public.dadyoom_commit_activity_attempt(uuid,uuid,uuid,jsonb,boolean,boolean,integer,integer,integer,integer)'::regprocedure;
  IF has_function_privilege('anon',f,'EXECUTE')
    OR has_function_privilege('authenticated',f,'EXECUTE')
    OR NOT has_function_privilege('service_role',f,'EXECUTE')
  THEN RAISE EXCEPTION 'ATOMIC_COMMIT_BROWSER_EXECUTION_NOT_BLOCKED'; END IF;
END $verify$;
COMMIT;
