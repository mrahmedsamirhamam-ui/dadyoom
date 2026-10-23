-- Synthetic PostgreSQL 16-only RLS fixture. Must never run on production.
\set ON_ERROR_STOP on
DO $roles$
BEGIN
 IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN
  CREATE ROLE anon NOLOGIN;
 END IF;
 IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN
  CREATE ROLE authenticated NOLOGIN;
 END IF;
END $roles$;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$
 SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$fn$;
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;

CREATE TABLE public.adaptive_learning_steps(
 id uuid PRIMARY KEY,student_id uuid NOT NULL,lesson_id uuid NOT NULL,
 step_type text NOT NULL,status text NOT NULL,
 completed_at timestamptz
);
CREATE TABLE public.student_skills(
 student_email text NOT NULL,skill text NOT NULL,score integer NOT NULL,
 PRIMARY KEY (student_email,skill)
);
CREATE TABLE public.student_mistakes(
 student_email text NOT NULL,category text NOT NULL,mistake_count integer NOT NULL,
 PRIMARY KEY (student_email,category)
);
ALTER TABLE public.adaptive_learning_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_mistakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_adaptive ON public.adaptive_learning_steps
 FOR ALL TO authenticated
 USING (student_id=auth.uid()) WITH CHECK (student_id=auth.uid());
CREATE POLICY own_skills ON public.student_skills
 FOR ALL TO authenticated
 USING (student_email=current_setting('request.jwt.claim.email',true))
 WITH CHECK (student_email=current_setting('request.jwt.claim.email',true));
CREATE POLICY own_mistakes ON public.student_mistakes
 FOR ALL TO authenticated
 USING (student_email=current_setting('request.jwt.claim.email',true))
 WITH CHECK (student_email=current_setting('request.jwt.claim.email',true));
GRANT SELECT,INSERT,UPDATE,DELETE,TRUNCATE ON
 public.adaptive_learning_steps,public.student_skills,public.student_mistakes
TO anon,authenticated;

INSERT INTO public.adaptive_learning_steps(id,student_id,lesson_id,step_type,status)
VALUES
 ('10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111',
 '20000000-0000-4000-8000-000000000001','practice','not_started'),
 ('10000000-0000-4000-8000-000000000002','22222222-2222-4222-8222-222222222222',
 '20000000-0000-4000-8000-000000000001','practice','not_started');
INSERT INTO public.student_skills(student_email,skill,score) VALUES
 ('first@example.invalid','القراءة',10),('second@example.invalid','القراءة',20);
INSERT INTO public.student_mistakes(student_email,category,mistake_count) VALUES
 ('first@example.invalid','spelling',4),('second@example.invalid','spelling',6);

-- Prove owner-only RLS does not protect a user's *own* canonical grades.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SELECT set_config('request.jwt.claim.email','first@example.invalid',false);
UPDATE public.adaptive_learning_steps SET status='completed',completed_at=now()
 WHERE student_id=auth.uid();
UPDATE public.student_skills SET score=100 WHERE student_email='first@example.invalid';
UPDATE public.student_mistakes SET mistake_count=0 WHERE student_email='first@example.invalid';
DO $assert$
BEGIN
 IF (SELECT count(*) FROM public.adaptive_learning_steps)<>1 OR
  (SELECT status FROM public.adaptive_learning_steps) <> 'completed' OR
  (SELECT score FROM public.student_skills)<>100 OR
  (SELECT mistake_count FROM public.student_mistakes)<>0
 THEN RAISE EXCEPTION 'SHADOW_ADAPTIVE_OWN_STATE_FORGERY_NOT_REPRODUCED'; END IF;
 IF EXISTS (SELECT FROM public.adaptive_learning_steps WHERE student_id<>
 '11111111-1111-4111-8111-111111111111'::uuid)
 THEN RAISE EXCEPTION 'SHADOW_ADAPTIVE_CROSS_OWNER_RLS_BROKEN'; END IF;
END $assert$;
RESET ROLE;
\echo SHADOW_ADAPTIVE_OWN_PROGRESS_FORGERY_REPRODUCED=PASS
