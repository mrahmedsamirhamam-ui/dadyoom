-- Dadyoom lesson quality governance, REVIEW-ONLY proposal.
-- DO NOT APPLY to production without explicit approval and isolated staging validation.
-- Intentionally keeps lessons.status, public pages and SEO unchanged.
BEGIN;

CREATE TABLE IF NOT EXISTS public.lesson_review_workflows (
  lesson_id uuid PRIMARY KEY REFERENCES public.lessons(id) ON DELETE RESTRICT,
  stage text NOT NULL CHECK(stage IN ('draft','language_review','curriculum_review','limited_trial','approved','published')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_quality_axis_reviews (
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE RESTRICT,
  axis text NOT NULL CHECK(axis IN ('language','curriculum','audio','four_skills','mastery','usability')),
  state text NOT NULL CHECK(state IN ('unreviewed','in_review','approved','needs_changes')),
  notes text NOT NULL DEFAULT '',
  reviewer_id uuid REFERENCES auth.users(id),
  reviewer_name text,
  reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lesson_id, axis),
  CHECK (state = 'unreviewed' OR
    (reviewer_id IS NOT NULL AND nullif(btrim(reviewer_name),'') IS NOT NULL
     AND reviewed_at IS NOT NULL AND nullif(btrim(notes),'') IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS public.lesson_review_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE RESTRICT,
  from_stage text NOT NULL,
  to_stage text NOT NULL,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  reviewer_name text NOT NULL CHECK(btrim(reviewer_name) <> ''),
  notes text NOT NULL CHECK(btrim(notes) <> ''),
  version_number integer NOT NULL CHECK(version_number >= 1),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lesson_id,version_number)
);

CREATE TABLE IF NOT EXISTS public.lesson_review_versions (
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE RESTRICT,
  version_number integer NOT NULL CHECK(version_number >= 1),
  lesson_snapshot jsonb NOT NULL,
  stage text NOT NULL,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  captured_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(lesson_id, version_number)
);

-- Auditable changes to each axis, append-only for reviewer accountability.
CREATE TABLE IF NOT EXISTS public.lesson_quality_axis_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE RESTRICT,
  axis text NOT NULL,
  from_state text,
  to_state text NOT NULL,
  notes text NOT NULL,
  reviewer_id uuid REFERENCES auth.users(id),
  reviewer_name text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION public.log_lesson_quality_axis()
RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 INSERT INTO public.lesson_quality_axis_events
   (lesson_id,axis,from_state,to_state,notes,reviewer_id,reviewer_name)
 VALUES(NEW.lesson_id,NEW.axis, CASE WHEN TG_OP='UPDATE' THEN OLD.state ELSE NULL END,
        NEW.state,NEW.notes,NEW.reviewer_id,NEW.reviewer_name);
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_lesson_quality_axis_audit ON public.lesson_quality_axis_reviews;
CREATE TRIGGER trg_lesson_quality_axis_audit
AFTER INSERT OR UPDATE ON public.lesson_quality_axis_reviews
FOR EACH ROW EXECUTE FUNCTION public.log_lesson_quality_axis();

-- Only the server service_role may read/write these private review records.
-- Do not expose through anon or authenticated PostgREST access.
ALTER TABLE public.lesson_review_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_quality_axis_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_review_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_review_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_quality_axis_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lesson_review_workflows, public.lesson_quality_axis_reviews,
 public.lesson_review_events, public.lesson_review_versions, public.lesson_quality_axis_events
 FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lesson_review_workflows, public.lesson_quality_axis_reviews TO service_role;
GRANT SELECT, INSERT ON public.lesson_review_events, public.lesson_review_versions, public.lesson_quality_axis_events TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Atomic monotonic transitions. No change to lessons.status or the public site.
CREATE OR REPLACE FUNCTION public.advance_lesson_review(
 p_lesson_id uuid, p_next_stage text, p_reviewer_id uuid, p_reviewer_name text, p_notes text)
RETURNS jsonb LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE
  v_lesson public.lessons%ROWTYPE;
  v_stored text;
  v_from text;
  v_expected text;
  v_axis_count integer;
  v_version integer;
BEGIN
 IF nullif(btrim(p_reviewer_name),'') IS NULL OR nullif(btrim(p_notes),'') IS NULL OR p_reviewer_id IS NULL THEN
   RAISE EXCEPTION 'REVIEWER_ID_NAME_AND_NOTES_REQUIRED';
 END IF;
 SELECT * INTO v_lesson FROM public.lessons WHERE id=p_lesson_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'LESSON_NOT_FOUND'; END IF;
 SELECT stage INTO v_stored FROM public.lesson_review_workflows WHERE lesson_id=p_lesson_id FOR UPDATE;
 v_from:=COALESCE(v_stored, CASE WHEN v_lesson.status='published' THEN 'published_unreviewed' ELSE 'draft' END);
 v_expected:=CASE v_from
  WHEN 'published_unreviewed' THEN 'draft'
  WHEN 'draft' THEN 'language_review'
  WHEN 'language_review' THEN 'curriculum_review'
  WHEN 'curriculum_review' THEN 'limited_trial'
  WHEN 'limited_trial' THEN 'approved'
  WHEN 'approved' THEN 'published'
  ELSE NULL END;
 IF v_expected IS NULL OR p_next_stage IS DISTINCT FROM v_expected THEN
   RAISE EXCEPTION 'INVALID_STAGE_TRANSITION:%->%', v_from, p_next_stage;
 END IF;
 IF p_next_stage IN ('approved','published') THEN
   SELECT count(*) INTO v_axis_count
   FROM public.lesson_quality_axis_reviews
   WHERE lesson_id=p_lesson_id AND state='approved'
   AND reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL AND btrim(notes)<>'';
   IF v_axis_count <> 6 THEN RAISE EXCEPTION 'SIX_APPROVED_AXES_REQUIRED'; END IF;
 END IF;
 SELECT COALESCE(MAX(version_number),0)+1 INTO v_version
   FROM public.lesson_review_events WHERE lesson_id=p_lesson_id;
 INSERT INTO public.lesson_review_workflows(lesson_id,stage,updated_at)
 VALUES(p_lesson_id,p_next_stage,now())
 ON CONFLICT (lesson_id) DO UPDATE SET stage=EXCLUDED.stage,updated_at=EXCLUDED.updated_at;
 INSERT INTO public.lesson_review_events
   (lesson_id,from_stage,to_stage,reviewer_id,reviewer_name,notes,version_number)
 VALUES(p_lesson_id,v_from,p_next_stage,p_reviewer_id,btrim(p_reviewer_name),btrim(p_notes),v_version);
 INSERT INTO public.lesson_review_versions(lesson_id,version_number,lesson_snapshot,stage,reviewer_id)
 VALUES(p_lesson_id,v_version,to_jsonb(v_lesson),p_next_stage,p_reviewer_id);
 RETURN jsonb_build_object('lesson_id',p_lesson_id,'from',v_from,'to',p_next_stage,'version',v_version);
END;
$$;
REVOKE ALL ON FUNCTION public.advance_lesson_review(uuid,text,uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.advance_lesson_review(uuid,text,uuid,text,text) TO service_role;

-- Private counts + paged rows, scoped by country/grade/stage.
CREATE OR REPLACE FUNCTION public.lesson_review_dashboard(
 p_country text DEFAULT NULL,p_grade integer DEFAULT NULL,
 p_stage text DEFAULT NULL,p_limit integer DEFAULT 40,p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog,public AS $$
 WITH base AS (
 SELECT l.id,l.title,l.status AS public_status,
   c.code AS country_code,g.grade_number,
   COALESCE(w.stage,CASE WHEN l.status='published' THEN 'published_unreviewed' ELSE 'draft' END) AS review_stage,
   (w.lesson_id IS NOT NULL) AS review_started
 FROM public.lessons l
 JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula cu ON cu.id=g.curriculum_id
 JOIN public.countries c ON c.id=cu.country_id
 LEFT JOIN public.lesson_review_workflows w ON w.lesson_id=l.id
 WHERE (p_country IS NULL OR c.code=p_country)
   AND (p_grade IS NULL OR g.grade_number=p_grade)
 ), filtered AS (SELECT * FROM base WHERE p_stage IS NULL OR review_stage=p_stage),
 paged AS (SELECT * FROM filtered ORDER BY title,id LIMIT LEAST(GREATEST(p_limit,1),100) OFFSET GREATEST(p_offset,0))
 SELECT jsonb_build_object(
   'total',(SELECT COUNT(*) FROM filtered),
   'counts',COALESCE((SELECT jsonb_object_agg(review_stage,n) FROM
      (SELECT review_stage,COUNT(*) AS n FROM base GROUP BY review_stage) grouped),'{}'::jsonb),
   'items',COALESCE((SELECT jsonb_agg(to_jsonb(paged)) FROM paged),'[]'::jsonb));
$$;
REVOKE ALL ON FUNCTION public.lesson_review_dashboard(text,integer,text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_review_dashboard(text,integer,text,integer,integer) TO service_role;

COMMIT;