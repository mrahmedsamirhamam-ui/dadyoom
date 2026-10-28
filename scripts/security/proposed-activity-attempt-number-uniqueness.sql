-- NONDEPLOYABLE shadow rehearsal only. Not a Supabase migration.
-- Require a staging compatibility review and rollback before any deployment.
\set ON_ERROR_STOP on
BEGIN;
DO $guard$
BEGIN
  IF current_database() <> 'shadow_activity_sequence'
    OR current_setting('dadyoom.attempt_sequence_rehearsal', true) IS DISTINCT FROM 'enabled'
  THEN
    RAISE EXCEPTION 'PRODUCTION_ACTIVITY_SEQUENCE_DDL_BLOCKED';
  END IF;
END $guard$;

-- Do not guess numbering for existing rows: fail if any legacy duplicate
-- exists, then investigate and reconcile it before any future deployment.
DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.lesson_activity_attempts
    GROUP BY user_id, activity_id, attempt_number
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'ACTIVITY_SEQUENCE_PREEXISTING_DUPLICATES';
  END IF;
END $preflight$;

ALTER TABLE public.lesson_activity_attempts
  ADD CONSTRAINT lesson_activity_attempts_user_activity_attempt_number_key
  UNIQUE (user_id, activity_id, attempt_number);

DO $verify$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.lesson_activity_attempts'::regclass
      AND conname='lesson_activity_attempts_user_activity_attempt_number_key'
      AND contype='u'
  ) THEN RAISE EXCEPTION 'ACTIVITY_SEQUENCE_UNIQUE_MISSING'; END IF;
END $verify$;
COMMIT;
