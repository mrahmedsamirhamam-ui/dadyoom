-- P0 QUESTION KEY + PUBLIC PREVIEW FIX. REVIEW-ONLY: local isolated Supabase.
-- Do NOT apply to production. No data, students, roles, or lessons are changed.
-- Intentional: all question modifications use authenticated SERVER service-role
-- routes; never client-side authenticated/anon, even if an account says "admin".
-- Must be tested against actual published-lesson RPC and question editors.
BEGIN;

-- The previously published view is explicitly published-only and projects
-- only id/text for each option. These assertions fail closed on schema drift.
DO $guard$
DECLARE v text;
BEGIN
 IF to_regclass('public.dadyoom_student_questions') IS NULL
 OR to_regclass('public.lessons') IS NULL
 OR to_regclass('public.questions') IS NULL
 THEN RAISE EXCEPTION 'P0_Q57_REQUIRED_SCHEMA_MISSING'; END IF;
 SELECT pg_get_viewdef('public.dadyoom_student_questions'::regclass, true) INTO v;
 IF position('published' IN lower(v))=0
 OR position('jsonb_build_object' IN lower(v))=0
 OR position('lesson_id' IN lower(v))=0
 THEN RAISE EXCEPTION 'P0_Q57_SAFE_VIEW_DEFINITION_NOT_REVIEWED'; END IF;
END $guard$;

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Table privileges and column privileges are independent in PostgreSQL.
-- Both must be removed; only REVOKE SELECT ON TABLE misses old column GRANTs.
REVOKE ALL ON TABLE public.questions FROM PUBLIC, anon, authenticated;
DO $revoke_columns$
DECLARE c record;
BEGIN
 FOR c IN SELECT attname FROM pg_catalog.pg_attribute
  WHERE attrelid='public.questions'::regclass AND attnum>0 AND NOT attisdropped
 LOOP
  EXECUTE format(
    'REVOKE SELECT (%I), INSERT (%I), UPDATE (%I), REFERENCES (%I) ON TABLE public.questions FROM PUBLIC, anon, authenticated',
    c.attname,c.attname,c.attname,c.attname);
 END LOOP;
END $revoke_columns$;

-- Survives any forgotten historical permissive policy or accidental
-- re-GRANT to anon/authenticated; privileged server_role bypasses RLS.
CREATE POLICY p0_q57_deny_direct_question_api
ON public.questions AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);

-- SECURITY-INVOKER would require granting raw SELECT on options to visitors
-- and would immediately disclose embedded grading flags. Explicitly use
-- a carefully audited OWNER-rights view instead; ensure its SELECT contains
-- the published-only WHERE clause and hard-coded option-key allowlist.
-- Owner-rights views bypass RLS. This is therefore a release-gated exception
-- and MUST be regression-tested for unpublished question/option disclosure.
ALTER VIEW public.dadyoom_student_questions
SET (security_invoker = false, security_barrier = true);
REVOKE ALL ON TABLE public.dadyoom_student_questions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.dadyoom_student_questions TO anon, authenticated;
COMMENT ON VIEW public.dadyoom_student_questions IS
 'OWNER-rights, security-barrier public preview: published lessons only; options allowlist id/text. Never expose raw grading keys.';

-- Compatibility alias for clients that use v_secure_questions.
-- Real schema uses question, not question_text, and no proven created_at.
CREATE VIEW public.v_secure_questions WITH (security_barrier = true) AS
SELECT id, lesson_id, question AS question_text, question_type,
       options AS safe_options, points
FROM public.dadyoom_student_questions;
REVOKE ALL ON TABLE public.v_secure_questions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.v_secure_questions TO anon, authenticated;

COMMIT;
