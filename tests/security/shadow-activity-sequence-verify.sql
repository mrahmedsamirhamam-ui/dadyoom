-- Run only after the guarded candidate succeeds in disposable CI.
\set ON_ERROR_STOP on
DO $verify$
DECLARE observed_constraint text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.lesson_activity_attempts'::regclass
      AND contype='u'
      AND conname='lesson_activity_attempts_user_activity_attempt_number_key'
  ) THEN RAISE EXCEPTION 'SHADOW_ACTIVITY_SEQUENCE_CONSTRAINT_MISSING'; END IF;

  BEGIN
    INSERT INTO public.lesson_activity_attempts (user_id,activity_id,attempt_number)
    VALUES ('11111111-1111-4111-8111-111111111111',
            '22222222-2222-4222-8222-222222222222',2);
    RAISE EXCEPTION 'SHADOW_ACTIVITY_SEQUENCE_DUPLICATE_ACCEPTED';
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS observed_constraint=CONSTRAINT_NAME;
    IF observed_constraint<>'lesson_activity_attempts_user_activity_attempt_number_key'
    THEN RAISE EXCEPTION 'SHADOW_ACTIVITY_SEQUENCE_WRONG_CONSTRAINT: %', observed_constraint;
    END IF;
  END;

  -- Request B can retry with max+1 after a unique collision.
  INSERT INTO public.lesson_activity_attempts (user_id,activity_id,attempt_number)
  VALUES ('11111111-1111-4111-8111-111111111111',
          '22222222-2222-4222-8222-222222222222',3);
  IF (SELECT COUNT(*) FROM public.lesson_activity_attempts)<>3
     OR (SELECT MAX(attempt_number) FROM public.lesson_activity_attempts)<>3
  THEN RAISE EXCEPTION 'SHADOW_ACTIVITY_SEQUENCE_RETRY_FAILED'; END IF;
END $verify$;
\echo SHADOW_ACTIVITY_SEQUENCE_COLLISION_AND_RETRY=PASS

-- Rehearse exact DDL rollback. No production schema or data is touched.
ALTER TABLE public.lesson_activity_attempts
  DROP CONSTRAINT lesson_activity_attempts_user_activity_attempt_number_key;

DO $rollback$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.lesson_activity_attempts'::regclass
      AND conname='lesson_activity_attempts_user_activity_attempt_number_key'
  ) THEN RAISE EXCEPTION 'SHADOW_ACTIVITY_SEQUENCE_ROLLBACK_FAILED'; END IF;
END $rollback$;
\echo SHADOW_ACTIVITY_SEQUENCE_ROLLBACK=PASS
