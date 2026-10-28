-- DISPOSABLE CI DATABASE ONLY. Never run against Dadyoom production.
-- Proves a candidate definer-owned *published-only* sanitized projection can
-- remain readable after removing raw question-table SELECT. The real platform
-- has other consumers/RPCs requiring a separate audit, signed-in preview,
-- role/ownership testing and an approved rollback before any deployment.
\set ON_ERROR_STOP on
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE TABLE public.lessons (id uuid PRIMARY KEY, status text NOT NULL);
CREATE TABLE public.questions (
  id uuid PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id),
  question_order integer NOT NULL,
  question text NOT NULL,
  question_type text NOT NULL,
  options jsonb NOT NULL,
  correct_answer text NOT NULL,
  explanation text,
  points integer NOT NULL
);
INSERT INTO public.lessons (id,status) VALUES
  ('00000000-0000-4000-8000-000000000001','published'),
  ('00000000-0000-4000-8000-000000000002','draft');
INSERT INTO public.questions
(id,lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
VALUES
 ('00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000001',1,'سؤال تدريبي؟','multiple_choice',
  '[{"id":"a","text":"الخيار الأول","isCorrect":true,"secret_marker":"private-grader-field"},{"id":"b","text":"الخيار الثاني"}]'::jsonb,
  'a','Private explanation',1),
 ('00000000-0000-4000-8000-000000000012',
  '00000000-0000-4000-8000-000000000002',1,'مسودة سرية؟','multiple_choice',
  '[{"id":"a","text":"لا يُعرض"}]'::jsonb,'a','Private draft explanation',1);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY shadow_public_lessons ON public.lessons FOR SELECT TO anon,authenticated
  USING (status='published');
CREATE POLICY shadow_public_questions ON public.questions FOR SELECT TO anon,authenticated
  USING (EXISTS (SELECT 1 FROM public.lessons l
                 WHERE l.id = lesson_id AND l.status='published'));
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.lessons,public.questions TO anon,authenticated;

-- Mirror the current invoker-RLS projection and nested JSON allowlist.
CREATE VIEW public.dadyoom_student_questions
WITH (security_invoker=true,security_barrier=true) AS
SELECT q.id,q.lesson_id,q.question_order,q.question,q.question_type,
 COALESCE((SELECT jsonb_agg(jsonb_build_object('id', r.opt->>'id','text',r.opt->>'text')
                            ORDER BY r.ord)
           FROM jsonb_array_elements(
               CASE WHEN jsonb_typeof(q.options)='array' THEN q.options ELSE '[]'::jsonb END
           ) WITH ORDINALITY AS r(opt,ord)
           WHERE jsonb_typeof(r.opt)='object'
             AND jsonb_typeof(r.opt->'id')='string'
             AND jsonb_typeof(r.opt->'text')='string'),'[]'::jsonb) AS options,
 q.points
FROM public.questions q
JOIN public.lessons l ON l.id=q.lesson_id
WHERE l.status='published';
GRANT SELECT ON public.dadyoom_student_questions TO anon,authenticated;

SET ROLE anon;
DO $$
BEGIN
 IF (SELECT count(*) FROM public.dadyoom_student_questions)<>1 THEN
   RAISE EXCEPTION 'SHADOW_BASELINE_INVOKER_VIEW_FAILED';
 END IF;
END $$;
RESET ROLE;
\echo SHADOW_BASELINE_INVOKER_VIEW=PASS

-- Simulate the unsafe operation first: a naïve REVOKE makes the invoker view fail.
REVOKE SELECT ON public.questions FROM anon,authenticated;
SET ROLE anon;
DO $$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
   PERFORM id FROM public.dadyoom_student_questions LIMIT 1;
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'SHADOW_EXPECTED_INVOKER_BREAKAGE_NOT_OBSERVED'; END IF;
END $$;
RESET ROLE;
\echo SHADOW_INVOKER_REVOKE_BREAKAGE_CONFIRMED=PASS

-- Candidate alternative tested ONLY in CI. View owner is postgres in this
-- isolated fixture; explicit published predicate is mandatory because definer
-- views do not inherit end-user RLS. It MUST NOT be adopted on production merely
-- because this narrow fixture passes.
ALTER VIEW public.dadyoom_student_questions SET (security_invoker=false);

SET ROLE anon;
DO $$
DECLARE row_data record; denied boolean:=false;
BEGIN
 IF (SELECT count(*) FROM public.dadyoom_student_questions)<>1 THEN
   RAISE EXCEPTION 'SHADOW_PUBLIC_VIEW_VISIBILITY_FAILED';
 END IF;
 SELECT * INTO row_data FROM public.dadyoom_student_questions LIMIT 1;
 IF row_data.id<>'00000000-0000-4000-8000-000000000011'::uuid THEN
   RAISE EXCEPTION 'SHADOW_DRAFT_QUESTION_EXPOSED';
 END IF;
 IF row_data.options<>'[{"id":"a","text":"الخيار الأول"},{"id":"b","text":"الخيار الثاني"}]'::jsonb THEN
   RAISE EXCEPTION 'SHADOW_OPTIONS_NOT_SANITIZED';
 END IF;
 BEGIN
   PERFORM correct_answer FROM public.questions LIMIT 1;
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'SHADOW_ANON_RAW_KEY_STILL_READABLE'; END IF;
END $$;
RESET ROLE;
\echo SHADOW_ANON_SAFE_VIEW_RAW_KEY_BLOCKED=PASS

SET ROLE authenticated;
DO $$
DECLARE denied boolean:=false;
BEGIN
 IF (SELECT count(*) FROM public.dadyoom_student_questions)<>1 THEN
   RAISE EXCEPTION 'SHADOW_AUTH_SAFE_VIEW_FAILED';
 END IF;
 BEGIN
   PERFORM correct_answer FROM public.questions LIMIT 1;
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'SHADOW_AUTH_RAW_KEY_STILL_READABLE'; END IF;
END $$;
RESET ROLE;
\echo SHADOW_AUTH_SAFE_VIEW_RAW_KEY_BLOCKED=PASS

-- Prove simple privileges/view-mode rollback within the disposable schema.
GRANT SELECT ON public.questions TO anon,authenticated;
ALTER VIEW public.dadyoom_student_questions SET (security_invoker=true);
SET ROLE anon;
DO $$
BEGIN
 IF (SELECT count(*) FROM public.dadyoom_student_questions)<>1 THEN
   RAISE EXCEPTION 'SHADOW_ROLLBACK_INVOKER_VIEW_FAILED';
 END IF;
END $$;
RESET ROLE;
\echo SHADOW_REVOKE_ROLLBACK=PASS
