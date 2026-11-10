\set ON_ERROR_STOP on
DO $$
DECLARE
 v_lesson constant uuid := '11111111-1111-4111-8111-111111111111';
 v_reviewer constant uuid := '22222222-2222-4222-8222-222222222222';
 v_before jsonb;
 v_after jsonb;
 v_stage text;
 v_axis text;
 v_axes text[] := ARRAY['language','curriculum','audio','four_skills','mastery','usability'];
 v_stages text[] := ARRAY['draft','language_review','curriculum_review','limited_trial','approved','published'];
 v_result jsonb;
 v_count integer;
BEGIN
 IF current_database() <> 'dadyoom_lq1_ci_isolated' THEN RAISE EXCEPTION 'ISOLATION_GUARD'; END IF;
 SELECT to_jsonb(l) INTO v_before FROM public.lessons l WHERE id=v_lesson;

 -- The first unauthorized stage skip must fail and must not alter publication.
 BEGIN
  PERFORM public.dadyoom_lq1_advance_lesson_review(v_lesson,'approved',v_reviewer,'QA reviewer','skip attempt');
  RAISE EXCEPTION 'UNEXPECTED_SKIP_SUCCESS';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM <> 'INVALID_STAGE_TRANSITION:published_unreviewed->approved' THEN RAISE; END IF;
 END;

 -- Every separate axis decision must preserve the whole public lessons record.
 FOREACH v_axis IN ARRAY v_axes LOOP
  INSERT INTO public.dadyoom_lq1_quality_axis_reviews
    (lesson_id,axis,state,notes,reviewer_id,reviewer_name,reviewed_at)
  VALUES(v_lesson,v_axis,'approved','reviewed in isolated fixture',v_reviewer,'QA reviewer',now());
  SELECT to_jsonb(l) INTO v_after FROM public.lessons l WHERE id=v_lesson;
  IF v_before IS DISTINCT FROM v_after THEN
    RAISE EXCEPTION 'PUBLIC_LESSON_MUTATED_ON_AXIS:%',v_axis;
  END IF;
 END LOOP;

 -- Every transition is checked and versioned; publication columns never move.
 FOREACH v_stage IN ARRAY v_stages LOOP
  v_result:=public.dadyoom_lq1_advance_lesson_review(
    v_lesson,v_stage,v_reviewer,'QA reviewer','fixture decision for '||v_stage);
  IF v_result->>'to' <> v_stage THEN RAISE EXCEPTION 'WRONG_REVIEW_STAGE'; END IF;
  SELECT to_jsonb(l) INTO v_after FROM public.lessons l WHERE id=v_lesson;
  IF v_before IS DISTINCT FROM v_after THEN
    RAISE EXCEPTION 'PUBLIC_LESSON_MUTATED_ON_TRANSITION:%',v_stage;
  END IF;
 END LOOP;

 -- Approved axes cannot later be overwritten.
 BEGIN
  UPDATE public.dadyoom_lq1_quality_axis_reviews SET state='needs_changes'
   WHERE lesson_id=v_lesson AND axis='language';
  RAISE EXCEPTION 'UNEXPECTED_APPROVED_AXIS_WRITE';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM <> 'APPROVED_LESSON_AXES_ARE_FROZEN' THEN RAISE; END IF;
 END;

 SELECT count(*) INTO v_count FROM public.dadyoom_lq1_review_events WHERE lesson_id=v_lesson;
 IF v_count<>6 THEN RAISE EXCEPTION 'EVENT_COUNT_NOT_6:%',v_count; END IF;
 SELECT count(*) INTO v_count FROM public.dadyoom_lq1_review_versions WHERE lesson_id=v_lesson;
 IF v_count<>6 THEN RAISE EXCEPTION 'VERSION_COUNT_NOT_6:%',v_count; END IF;
 SELECT count(*) INTO v_count FROM public.dadyoom_lq1_quality_axis_events WHERE lesson_id=v_lesson;
 IF v_count<>6 THEN RAISE EXCEPTION 'AXIS_EVENT_COUNT_NOT_6:%',v_count; END IF;
 IF has_table_privilege('authenticated','public.dadyoom_lq1_review_events','SELECT') THEN
   RAISE EXCEPTION 'AUTHENTICATED_CAN_READ_EVENTS';
 END IF;
 IF has_function_privilege('anon','public.dadyoom_lq1_advance_lesson_review(uuid,text,uuid,text,text)','EXECUTE') THEN
   RAISE EXCEPTION 'ANON_CAN_EXECUTE_REVIEW_FUNCTION';
 END IF;
 IF has_function_privilege('anon','public.dadyoom_lq1_log_quality_axis()','EXECUTE')
    OR has_function_privilege('authenticated','public.dadyoom_lq1_guard_quality_axis()','EXECUTE') THEN
   RAISE EXCEPTION 'REVIEW_HELPER_FUNCTION_EXPOSED';
 END IF;
 RAISE NOTICE 'INTEGRATION_PASS: six axis decisions, six transitions, denied stage skip, immutable public record, six versions, frozen approvals, no anon reviewer grant';
END;
$$;
SELECT public.dadyoom_lq1_review_dashboard('BH',2,NULL,40,0) AS isolated_dashboard_snapshot;
