-- Applied to production and independently role-tested on 2026-10-25.
-- Deny anonymous direct SELECT of private lesson-activity solution payloads.
-- Public lesson bundles use only listed safe columns. Authenticated author
-- and service_role permissions remain unchanged pending authenticated E2E.
-- Break-glass rollback only after review:
-- GRANT SELECT ON public.lesson_activities TO anon;
DO $preflight$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_class c WHERE c.oid='public.lesson_activities'::regclass
     AND c.relrowsecurity
 ) THEN RAISE EXCEPTION 'ACTIVITY_RLS_REQUIRED'; END IF;
 IF NOT EXISTS (
   SELECT 1 FROM pg_policies WHERE schemaname='public'
     AND tablename='lesson_activities' AND 'anon'=ANY(roles)
     AND cmd='SELECT'
 ) THEN RAISE EXCEPTION 'ANON_PUBLISHED_ACTIVITY_POLICY_REQUIRED'; END IF;
END $preflight$;
REVOKE SELECT ON TABLE public.lesson_activities FROM anon;
GRANT SELECT (
 id,lesson_id,title,activity_type,instructions,content,activity_order,
 points,is_published,created_at,updated_at,section,prompt,is_required
) ON TABLE public.lesson_activities TO anon;
DO $verify$
BEGIN
 IF has_column_privilege('anon','public.lesson_activities','answer','SELECT')
 OR NOT has_column_privilege('anon','public.lesson_activities','content','SELECT')
 OR NOT has_column_privilege('anon','public.lesson_activities','id','SELECT')
 OR NOT has_column_privilege('authenticated','public.lesson_activities','answer','SELECT')
 OR NOT has_column_privilege('service_role','public.lesson_activities','answer','SELECT')
 THEN RAISE EXCEPTION 'ANON_ACTIVITY_ANSWER_KEY_CUTOVER_FAILED'; END IF;
END $verify$;