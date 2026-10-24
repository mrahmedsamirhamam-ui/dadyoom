\set ON_ERROR_STOP on
-- Verify existing valid historical answer was backfilled into slot 1.
DO $backfill$
BEGIN
  IF (SELECT assessment_id FROM public.assessment_answer_slots
      WHERE session_id='11111111-1111-4111-8111-111111111111'
        AND question_number=1) IS DISTINCT FROM
        'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid
  THEN RAISE EXCEPTION 'HISTORICAL_ANSWER_SLOT_BACKFILL_FAILED'; END IF;
  IF has_table_privilege('authenticated',
       'public.assessment_answer_slots','INSERT') THEN
    RAISE EXCEPTION 'STUDENT_ROLE_CAN_INSERT_SERVER_SLOT'; END IF;
  IF NOT has_table_privilege('service_role',
       'public.assessment_answer_slots','INSERT') THEN
    RAISE EXCEPTION 'SERVER_WRITER_CANNOT_CLAIM_SLOT'; END IF;
END $backfill$;
\echo SHADOW_SLOT_LEGACY_BACKFILL_AND_GRANTS=PASS

-- Synthetic server role (not credentials) inserts one answer for slot #1.
SET ROLE service_role;
INSERT INTO public.assessment_session_answers
 (id,session_id,assessment_id,student_id,lesson_id,skill,
  selected_answer,correct_answer,is_correct)
VALUES
 ('44444444-4444-4444-8444-444444444444',
  '22222222-2222-4222-8222-222222222222',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'reading',1,1,true);

-- Different assessment ID cannot claim the same pending slot.
DO $blocked$
DECLARE stopped boolean := false;
BEGIN
  BEGIN
    INSERT INTO public.assessment_session_answers
     (id,session_id,assessment_id,student_id,lesson_id,skill,
      selected_answer,correct_answer,is_correct)
    VALUES
     ('55555555-5555-4555-8555-555555555555',
      '22222222-2222-4222-8222-222222222222',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'reading',0,1,false);
  EXCEPTION WHEN check_violation OR unique_violation THEN
    stopped:=true;
  END;
  IF NOT stopped THEN
    RAISE EXCEPTION 'SECOND_ASSESSMENT_WAS_CREDITED_FOR_SAME_SLOT';
  END IF;
  IF (SELECT count(*) FROM public.assessment_session_answers
      WHERE session_id='22222222-2222-4222-8222-222222222222')<>1 THEN
    RAISE EXCEPTION 'DUPLICATE_ANSWER_ROW_WAS_PERSISTED';
  END IF;
END $blocked$;
\echo SHADOW_DISTINCT_ASSESSMENT_SAME_SLOT_DENIED=PASS

-- Advancing the owned session permits exactly one next question.
UPDATE public.assessment_sessions
 SET current_question=2,correct_answers=1
 WHERE id='22222222-2222-4222-8222-222222222222';
INSERT INTO public.assessment_session_answers
 (id,session_id,assessment_id,student_id,lesson_id,skill,
  selected_answer,correct_answer,is_correct)
VALUES
 ('66666666-6666-4666-8666-666666666666',
  '22222222-2222-4222-8222-222222222222',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'reading',0,1,false);

DO $slots$
BEGIN
  IF (SELECT count(*) FROM public.assessment_answer_slots
      WHERE session_id='22222222-2222-4222-8222-222222222222')<>2
    OR NOT EXISTS (
      SELECT 1 FROM public.assessment_answer_slots
      WHERE session_id='22222222-2222-4222-8222-222222222222'
        AND question_number=2
        AND assessment_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    )
  THEN
    RAISE EXCEPTION 'ADVANCED_SESSION_QUESTION_SLOT_MISMATCH';
  END IF;
END $slots$;
\echo SHADOW_NEXT_QUESTION_AFTER_AUTHORIZED_ADVANCE=PASS

-- Foreign owner and already-finished session cannot insert another answer.
DO $foreign$
DECLARE stopped boolean:=false;
BEGIN
  BEGIN
    INSERT INTO public.assessment_session_answers
     (id,session_id,assessment_id,student_id,lesson_id,skill,
      selected_answer,correct_answer,is_correct)
    VALUES (
      '77777777-7777-4777-8777-777777777777',
      '11111111-1111-4111-8111-111111111111',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'reading',0,1,false);
  EXCEPTION WHEN check_violation THEN stopped:=true;
  END;
  IF NOT stopped THEN RAISE EXCEPTION 'FOREIGN_STUDENT_INSERT_ALLOWED'; END IF;
END $foreign$;
\echo SHADOW_FOREIGN_SESSION_ANSWER_DENIED=PASS
RESET ROLE;

-- Roll back only the candidate objects (no user rows edited here).
DROP TRIGGER dadyoom_rehearsal_answer_slot_before_insert
  ON public.assessment_session_answers;
DROP FUNCTION public.dadyoom_rehearsal_claim_answer_slot();
DROP TABLE public.assessment_answer_slots;

-- Without candidate, old constraint once again allows a *third* distinct
-- assessment in the same unadvanced slot. This proves genuine rollback.
INSERT INTO public.assessment_session_answers
 (id,session_id,assessment_id,student_id,lesson_id,skill,
  selected_answer,correct_answer,is_correct)
VALUES (
 '88888888-8888-4888-8888-888888888888',
 '22222222-2222-4222-8222-222222222222',
 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','reading',1,1,true);
DO $rollback$
BEGIN
  IF (SELECT count(*) FROM public.assessment_session_answers
      WHERE session_id='22222222-2222-4222-8222-222222222222')<>3
    OR to_regclass('public.assessment_answer_slots') IS NOT NULL
  THEN RAISE EXCEPTION 'ANSWER_SLOT_GUARD_ROLLBACK_FAILED'; END IF;
END $rollback$;
\echo SHADOW_ANSWER_SLOT_GUARD_ROLLBACK=PASS
