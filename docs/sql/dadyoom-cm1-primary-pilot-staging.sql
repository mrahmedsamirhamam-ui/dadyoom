-- REVIEW-ONLY PROPOSAL: apply to a separately identified isolated STAGING DB only.
-- Requires existing lesson-review dadyoom_lq1_* migration and Supabase roles.
-- No UPDATE/DELETE to public.lessons. Do not apply to production.
BEGIN;

CREATE TABLE public.dadyoom_cm1_primary_evidence (
  lesson_id uuid PRIMARY KEY REFERENCES public.lessons(id) ON DELETE RESTRICT,
  content_kind text NOT NULL CHECK (content_kind IN ('official_candidate','original_enrichment')),
  lesson_updated_at timestamptz NOT NULL,
  source_url text,
  source_document text,
  source_edition text,
  source_page text,
  source_checked_by text,
  source_checked_at timestamptz,
  content_evidence_ref text,
  content_checked_by text,
  content_checked_at timestamptz,
  runtime_evidence_ref text,
  runtime_checked_by text,
  runtime_checked_at timestamptz,
  final_evidence_ref text,
  final_checked_by text,
  final_checked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.dadyoom_cm1_primary_decisions (
  lesson_id uuid PRIMARY KEY REFERENCES public.lessons(id) ON DELETE RESTRICT,
  review_state text NOT NULL CHECK (review_state IN ('official_verified','editorial_enrichment','needs_completion')),
  official_syllabus_match text NOT NULL CHECK (official_syllabus_match IN ('VERIFIED','NOT_VERIFIED')),
  proposed_summary text,
  reviewer_id uuid NOT NULL,
  reviewer_name text NOT NULL CHECK (btrim(reviewer_name) <> ''),
  notes text NOT NULL CHECK (length(btrim(notes)) >= 20),
  decided_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((review_state='official_verified' AND official_syllabus_match='VERIFIED' AND proposed_summary IS NULL)
    OR (review_state='editorial_enrichment' AND official_syllabus_match='NOT_VERIFIED' AND proposed_summary IS NOT NULL)
    OR (review_state='needs_completion' AND official_syllabus_match='NOT_VERIFIED' AND proposed_summary IS NULL))
);

CREATE TABLE public.dadyoom_cm1_primary_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('approve_official','mark_enrichment','keep_draft')),
  reviewer_id uuid NOT NULL,
  reviewer_name text NOT NULL,
  notes text NOT NULL,
  previous_decision jsonb,
  new_decision jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dadyoom_cm1_primary_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dadyoom_cm1_primary_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dadyoom_cm1_primary_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.dadyoom_cm1_primary_evidence,
  public.dadyoom_cm1_primary_decisions,public.dadyoom_cm1_primary_events
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.dadyoom_cm1_primary_evidence,
  public.dadyoom_cm1_primary_decisions TO service_role;
GRANT SELECT, INSERT ON public.dadyoom_cm1_primary_events TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.dadyoom_cm1_primary_events_id_seq TO service_role;

-- Invoker permissions: never expose a SECURITY DEFINER API or accept an approver from public callers.
CREATE FUNCTION public.dadyoom_cm1_record_primary_decision(
  p_lesson_id uuid, p_action text, p_reviewer_id uuid,
  p_reviewer_name text, p_notes text, p_proposed_summary text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $cm1$
DECLARE
  v_lesson public.lessons%ROWTYPE;
  v_evidence public.dadyoom_cm1_primary_evidence%ROWTYPE;
  v_prev public.dadyoom_cm1_primary_decisions%ROWTYPE;
  v_state text;
  v_match text := 'NOT_VERIFIED';
  v_summary text := NULL;
  v_question_count bigint;
  v_activity_count bigint;
  v_question_modified timestamptz;
  v_activity_modified timestamptz;
  v_axes_count bigint;
  v_objectives_valid boolean;
BEGIN
  IF p_action NOT IN ('approve_official','mark_enrichment','keep_draft')
    OR p_reviewer_id IS NULL
    OR nullif(btrim(p_reviewer_name),'') IS NULL
    OR length(btrim(coalesce(p_notes,''))) < 20
    OR length(p_notes)>2000 THEN
    RAISE EXCEPTION 'CM1_INVALID_REVIEW_DECISION';
  END IF;
  -- Lock the canonical lesson before checking source data and recording the decision.
  SELECT l.* INTO v_lesson
  FROM public.lessons l
  JOIN public.units u ON u.id=l.unit_id
  JOIN public.grades g ON g.id=u.grade_id
  JOIN public.curricula cu ON cu.id=g.curriculum_id
  JOIN public.countries c ON c.id=cu.country_id
  WHERE l.id=p_lesson_id AND c.code='BH' AND g.grade_number IN (1,2,3)
  FOR UPDATE OF l;
  IF NOT FOUND THEN RAISE EXCEPTION 'CM1_PILOT_SCOPE_REJECTED'; END IF;

  SELECT * INTO v_prev FROM public.dadyoom_cm1_primary_decisions
  WHERE lesson_id=p_lesson_id FOR UPDATE;
  IF v_prev.official_syllabus_match='VERIFIED' THEN
    RAISE EXCEPTION 'CM1_APPROVAL_FROZEN_REOPEN_SEPARATELY';
  END IF;

  IF p_action='approve_official' THEN
    SELECT * INTO v_evidence FROM public.dadyoom_cm1_primary_evidence
    WHERE lesson_id=p_lesson_id FOR UPDATE;
    IF NOT FOUND OR v_evidence.content_kind IS DISTINCT FROM 'official_candidate'
       OR v_evidence.lesson_updated_at IS DISTINCT FROM v_lesson.updated_at
       OR v_lesson.status IS DISTINCT FROM 'published'
       OR coalesce(to_jsonb(v_lesson.instructions),'[]'::jsonb)
          @> '[{"kind":"dadyoom_source","source_publication_ready":false}]'::jsonb THEN
      RAISE EXCEPTION 'CM1_NOT_READY_SOURCE_OR_STALE_CONTENT';
    END IF;
    IF coalesce(v_evidence.source_url,'') !~ '^https://'
       OR nullif(btrim(v_evidence.source_document),'') IS NULL
       OR nullif(btrim(v_evidence.source_page),'') IS NULL
       OR v_evidence.source_edition IS DISTINCT FROM '2026-2027'
       OR nullif(btrim(v_evidence.source_checked_by),'') IS NULL
       OR v_evidence.source_checked_at IS NULL THEN
      RAISE EXCEPTION 'CM1_OFFICIAL_SOURCE_EVIDENCE_MISSING';
    END IF;
    v_objectives_valid := CASE
      WHEN jsonb_typeof(to_jsonb(v_lesson.learning_objectives))='array'
      THEN jsonb_array_length(to_jsonb(v_lesson.learning_objectives))>=1
      ELSE false END;
    IF length(btrim(coalesce(v_lesson.content,'')))<120
       OR length(btrim(coalesce(v_lesson.summary,'')))<30 OR NOT v_objectives_valid
       OR nullif(btrim(v_evidence.content_evidence_ref),'') IS NULL
       OR nullif(btrim(v_evidence.content_checked_by),'') IS NULL
       OR v_evidence.content_checked_at IS NULL THEN
      RAISE EXCEPTION 'CM1_CONTENT_EVIDENCE_MISSING';
    END IF;
    SELECT count(*),max(updated_at) INTO v_question_count,v_question_modified
      FROM public.questions WHERE lesson_id=p_lesson_id;
    SELECT count(*),max(updated_at) INTO v_activity_count,v_activity_modified
      FROM public.lesson_activities WHERE lesson_id=p_lesson_id AND is_published=true;
    IF v_question_count<3 OR v_activity_count<1
       OR nullif(btrim(v_evidence.runtime_evidence_ref),'') IS NULL
       OR nullif(btrim(v_evidence.runtime_checked_by),'') IS NULL
       OR v_evidence.runtime_checked_at IS NULL
       OR v_evidence.runtime_checked_at < greatest(
         coalesce(v_question_modified,v_lesson.updated_at),
         coalesce(v_activity_modified,v_lesson.updated_at),
         v_lesson.updated_at) THEN
      RAISE EXCEPTION 'CM1_RUNTIME_EVIDENCE_MISSING';
    END IF;
    IF nullif(btrim(v_evidence.final_evidence_ref),'') IS NULL
       OR nullif(btrim(v_evidence.final_checked_by),'') IS NULL
       OR v_evidence.final_checked_at IS NULL
       OR v_evidence.final_checked_at < greatest(
         v_lesson.updated_at,v_evidence.source_checked_at,
         v_evidence.content_checked_at,v_evidence.runtime_checked_at) THEN
      RAISE EXCEPTION 'CM1_INDEPENDENT_REVIEW_MISSING';
    END IF;
    SELECT count(DISTINCT axis) INTO v_axes_count
      FROM public.dadyoom_lq1_quality_axis_reviews
      WHERE lesson_id=p_lesson_id AND state='approved'
        AND reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL
        AND nullif(btrim(notes),'') IS NOT NULL;
    IF v_axes_count <> 6 THEN RAISE EXCEPTION 'CM1_SIX_QUALITY_AXES_REQUIRED'; END IF;
    v_state:='official_verified';
    v_match:='VERIFIED';
  ELSIF p_action='mark_enrichment' THEN
    IF length(btrim(coalesce(p_proposed_summary,''))) NOT BETWEEN 40 AND 500
       OR p_proposed_summary ~* '(محتوى رسمي|معتمد من الوزارة|نص كتاب الوزارة|مطابق للمنهج)' THEN
      RAISE EXCEPTION 'CM1_EDITORIAL_TEXT_REQUIRES_REVIEW';
    END IF;
    v_state:='editorial_enrichment';
    v_summary:=btrim(p_proposed_summary);
  ELSE
    v_state:='needs_completion';
  END IF;

  INSERT INTO public.dadyoom_cm1_primary_decisions
    (lesson_id,review_state,official_syllabus_match,proposed_summary,reviewer_id,reviewer_name,notes,decided_at)
  VALUES(p_lesson_id,v_state,v_match,v_summary,p_reviewer_id,btrim(p_reviewer_name),btrim(p_notes),now())
  ON CONFLICT (lesson_id) DO UPDATE SET
    review_state=EXCLUDED.review_state,official_syllabus_match=EXCLUDED.official_syllabus_match,
    proposed_summary=EXCLUDED.proposed_summary,reviewer_id=EXCLUDED.reviewer_id,
    reviewer_name=EXCLUDED.reviewer_name,notes=EXCLUDED.notes,decided_at=EXCLUDED.decided_at;
  INSERT INTO public.dadyoom_cm1_primary_events
    (lesson_id,action,reviewer_id,reviewer_name,notes,previous_decision,new_decision)
  SELECT p_lesson_id,p_action,p_reviewer_id,btrim(p_reviewer_name),btrim(p_notes),
    CASE WHEN v_prev.lesson_id IS NULL THEN NULL ELSE to_jsonb(v_prev) END,to_jsonb(d)
  FROM public.dadyoom_cm1_primary_decisions d WHERE d.lesson_id=p_lesson_id;
  RETURN jsonb_build_object('lesson_id',p_lesson_id,'review_state',v_state,
    'OFFICIAL_SYLLABUS_MATCH',v_match,'public_lesson_unchanged',true);
END;
$cm1$;
REVOKE ALL ON FUNCTION public.dadyoom_cm1_record_primary_decision(uuid,text,uuid,text,text,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dadyoom_cm1_record_primary_decision(uuid,text,uuid,text,text,text)
  TO service_role;
COMMIT;
