-- Disposable PostgreSQL fixture for private AI answer-key rehearsal.
-- No production roles/data/SQL migrations are modified.
\set ON_ERROR_STOP on
DO $roles$
BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='anon') THEN
  CREATE ROLE anon NOLOGIN;
 END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN
  CREATE ROLE authenticated NOLOGIN;
 END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='service_role') THEN
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
 END IF;
END $roles$;

CREATE SCHEMA auth;
CREATE FUNCTION auth.email() RETURNS text LANGUAGE sql STABLE AS $fn$
 SELECT current_setting('request.jwt.claim.email',true)
$fn$;
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION auth.email() TO anon,authenticated;

CREATE TABLE public.ai_assessments(
 id uuid PRIMARY KEY, student_email text NOT NULL,
 title text NOT NULL,passage text NOT NULL,question text NOT NULL,
 choices jsonb NOT NULL,correct_answer integer NOT NULL,
 explanation text,skill text,difficulty text,created_at timestamptz DEFAULT now(),
 completed boolean DEFAULT false,lesson_id uuid,question_hash text
);
ALTER TABLE public.ai_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_select ON public.ai_assessments FOR SELECT
 TO authenticated USING (student_email=auth.email());
CREATE POLICY student_update ON public.ai_assessments FOR UPDATE
 TO authenticated USING (student_email=auth.email())
 WITH CHECK(student_email=auth.email());
CREATE POLICY student_insert ON public.ai_assessments FOR INSERT
 TO authenticated WITH CHECK(student_email=auth.email());
GRANT SELECT,INSERT,UPDATE,DELETE,TRUNCATE ON public.ai_assessments
 TO anon,authenticated,service_role;
INSERT INTO public.ai_assessments(
 id,student_email,title,passage,question,choices,
 correct_answer,explanation,skill,difficulty,lesson_id)
VALUES(
 '11111111-1111-4111-8111-111111111111','first@example.invalid',
 'صورة اختبار','مقطع قصير','أي حرف؟','["ألف","باء"]',1,
 'التفسير السري','القراءة','easy','33333333-3333-4333-8333-333333333333'),
(
 '22222222-2222-4222-8222-222222222222','second@example.invalid',
 'درس آخر','نص آخر','سؤال آخر','["جيم","دال"]',0,
 'إجابة خاصة','الكتابة','hard','33333333-3333-4333-8333-333333333333');

-- Confirm real design flaw: own-record row policy still permits forged
-- answer keys and reveals the real key directly to a learner token.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.email','first@example.invalid',false);
DO $reproduce$
BEGIN
 IF (SELECT count(*) FROM public.ai_assessments) <> 1 THEN
  RAISE EXCEPTION 'BASELINE_OWNER_RLS_MISSING';
 END IF;
 IF (SELECT correct_answer FROM public.ai_assessments) <> 1 THEN
  RAISE EXCEPTION 'BASELINE_RAW_SECRET_READ_NOT_REPRODUCED';
 END IF;
 UPDATE public.ai_assessments SET correct_answer=0;
 IF (SELECT correct_answer FROM public.ai_assessments) <> 0 THEN
  RAISE EXCEPTION 'BASELINE_OWN_ANSWER_FORGERY_NOT_REPRODUCED';
 END IF;
END $reproduce$;
RESET ROLE;
UPDATE public.ai_assessments SET correct_answer=1
 WHERE student_email='first@example.invalid';
\echo SHADOW_AI_KEYS_RAW_READ_AND_OWN_FORGERY_REPRODUCED=PASS
