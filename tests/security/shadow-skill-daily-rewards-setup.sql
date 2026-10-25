\set ON_ERROR_STOP on
-- Disposable PostgreSQL16 schema faithfully models relevant production
-- owner RLS and grading/XP columns. Uses only invented identities.
DO $roles$
BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $roles$;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $uid$
 SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$uid$;
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;
CREATE TABLE public.student_skill_progress(
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL,
 skill text NOT NULL,
 latest_score integer NOT NULL DEFAULT 0,
 best_score integer NOT NULL DEFAULT 0,
 attempts integer NOT NULL DEFAULT 0,
 xp integer NOT NULL DEFAULT 0,
 level text NOT NULL DEFAULT 'مبتدئ'
);
CREATE TABLE public.student_daily_challenges(
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL,
 challenge_date date NOT NULL,
 skill text NOT NULL,
 challenge_id text NOT NULL,
 title text NOT NULL,
 target_score integer NOT NULL,
 status text NOT NULL DEFAULT 'accepted',
 achieved_score integer,
 bonus_xp integer NOT NULL DEFAULT 0,
 bonus_awarded boolean NOT NULL DEFAULT false
);
ALTER TABLE public.student_skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_skill_select ON public.student_skill_progress
 FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY own_skill_insert ON public.student_skill_progress
 FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY own_skill_update ON public.student_skill_progress
 FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY own_daily_select ON public.student_daily_challenges
 FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY own_daily_insert ON public.student_daily_challenges
 FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY own_daily_update ON public.student_daily_challenges
 FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
GRANT SELECT,INSERT,UPDATE,DELETE,TRUNCATE ON
 public.student_skill_progress,public.student_daily_challenges TO anon,authenticated,service_role;
-- Simulate another privilege path: explicit per-column writes.
GRANT UPDATE(xp), INSERT(xp) ON public.student_skill_progress TO authenticated;
GRANT UPDATE(bonus_xp),UPDATE(bonus_awarded),INSERT(bonus_xp)
  ON public.student_daily_challenges TO authenticated;
INSERT INTO public.student_skill_progress VALUES
('31000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111',
 'reading',65,65,2,15,'جيد'),
('31000000-0000-4000-8000-000000000002','22222222-2222-4222-8222-222222222222',
 'reading',50,50,1,5,'مبتدئ');
INSERT INTO public.student_daily_challenges VALUES
('32000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111',
 DATE '2026-10-25','reading','2026-10-25-reading','اختبار القراءة',60,
 'accepted',NULL,0,false),
('32000000-0000-4000-8000-000000000002','22222222-2222-4222-8222-222222222222',
 DATE '2026-10-25','reading','2026-10-25-reading','اختبار القراءة',60,
 'accepted',NULL,0,false);

-- Owner-RLS only is insufficient to establish the validity of a reward.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
UPDATE public.student_skill_progress SET xp=1000000,best_score=100
 WHERE user_id=auth.uid();
UPDATE public.student_daily_challenges SET bonus_xp=1000000,bonus_awarded=true
 WHERE user_id=auth.uid();
DO $baseline$
BEGIN
 IF (SELECT xp FROM public.student_skill_progress)<>1000000
   OR (SELECT bonus_xp FROM public.student_daily_challenges)<>1000000
   OR (SELECT count(*) FROM public.student_skill_progress)<>1
   OR (SELECT count(*) FROM public.student_daily_challenges)<>1
 THEN
   RAISE EXCEPTION 'SHADOW_SKILL_DAILY_OWNER_ONLY_FORGERY_NOT_REPRODUCED';
 END IF;
END $baseline$;
RESET ROLE;
\echo SHADOW_SKILL_DAILY_OWNER_ONLY_FORGERY_REPRODUCED=PASS
