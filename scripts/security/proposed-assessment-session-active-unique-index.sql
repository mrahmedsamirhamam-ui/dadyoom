-- PROPOSAL ONLY: guarded rehearsal, NOT a production migration.
-- Live project 2026-10-24 read-only inventory: PK(id) and a *nonunique*
-- (student_id, lesson_id) index, but no uniqueness of unfinished sessions.
-- No duplicate active student/lesson groups detected at the time of audit.
--
-- A partial UNIQUE index is the server-authoritative concurrency boundary:
-- PostgreSQL serializes competing INSERTs; only one unfinished session for
-- the same student/lesson may commit. Finished sessions remain historical.
--
-- Actual rollout needs: Preview identity/roles, concurrent request E2E,
-- coordinated browser role DML revocation, real DB preflight and rollback.
DO $guard$
BEGIN
  IF current_database() <> 'shadow_session_start'
     OR current_setting('dadyoom.session_start_rehearsal',true)
        IS DISTINCT FROM 'enabled'
  THEN
    RAISE EXCEPTION 'PRODUCTION_SESSION_UNIQUE_INDEX_BLOCKED_DISPOSABLE_ONLY';
  END IF;
END $guard$;

-- Fail explicitly before creating the index, never silently delete
-- or close student sessions during migration.
DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.assessment_sessions
    WHERE finished = false
    GROUP BY student_id,lesson_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_ACTIVE_ASSESSMENT_SESSIONS_MANUAL_REVIEW_REQUIRED';
  END IF;
END $preflight$;

CREATE UNIQUE INDEX assessment_sessions_one_unfinished_per_student_lesson
  ON public.assessment_sessions (student_id,lesson_id)
  WHERE finished = false;
