-- Disposable PostgreSQL only. DO NOT run on production.
\set ON_ERROR_STOP on
DO $roles$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
END $roles$;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid
$$;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;

CREATE TABLE public.edu_game_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  game_key text NOT NULL,
  score integer NOT NULL,
  max_score integer NOT NULL,
  xp_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.edu_game_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY game_self_read ON public.edu_game_attempts FOR SELECT
  TO authenticated USING (student_id=(SELECT auth.uid()));
CREATE POLICY game_self_insert ON public.edu_game_attempts FOR INSERT
  TO authenticated WITH CHECK (student_id=(SELECT auth.uid()));
CREATE POLICY game_self_update ON public.edu_game_attempts FOR UPDATE
  TO authenticated USING (student_id=(SELECT auth.uid()))
  WITH CHECK (student_id=(SELECT auth.uid()));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.edu_game_attempts TO authenticated;
GRANT SELECT ON public.edu_game_attempts TO anon;
GRANT INSERT (xp_earned), UPDATE (xp_earned) ON public.edu_game_attempts TO anon,authenticated;

INSERT INTO public.edu_game_attempts
 (student_id,lesson_id,game_key,score,max_score,xp_earned)
VALUES
 ('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','study-play-review',1,2,0),
 ('22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','study-play-review',1,2,0);

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DO $repro$
DECLARE visible integer; changed integer;
BEGIN
  SELECT count(*) INTO visible FROM public.edu_game_attempts;
  IF visible <> 1 THEN RAISE EXCEPTION 'GAME_OWNER_RLS_BASELINE_BROKEN'; END IF;
  UPDATE public.edu_game_attempts SET xp_earned=999 WHERE student_id=(SELECT auth.uid());
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed <> 1 THEN RAISE EXCEPTION 'GAME_XP_FORGERY_REPRODUCTION_FAILED'; END IF;
  UPDATE public.edu_game_attempts SET xp_earned=999
    WHERE student_id='22222222-2222-4222-8222-222222222222'::uuid;
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed <> 0 THEN RAISE EXCEPTION 'CROSS_STUDENT_GAME_WRITE_ALLOWED'; END IF;
END $repro$;
RESET ROLE;
\echo SHADOW_GAME_XP_FORGERY_REPRODUCED=PASS
