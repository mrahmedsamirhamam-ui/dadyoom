-- Applied to production Supabase hvqsvtomhlxavmfqoxfz on 2026-10-28.
-- Block high-risk table-level privileges for internet-facing roles.
-- Retain anon safe-column SELECT grants, existing authenticated RLS edits,
-- and existing service_role privileges; no content or student data changes.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
 ON TABLE public.questions, public.lesson_activities
 FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER
 ON TABLE public.questions, public.lesson_activities
 FROM authenticated;

COMMENT ON TABLE public.questions IS
'Grading answers are private; anonymous students receive only safe field-level SELECT rights. No web role may TRUNCATE this table.';
COMMENT ON TABLE public.lesson_activities IS
'Private activity answers require trusted grading. Anonymous users cannot modify or TRUNCATE activities; authenticated edits remain guarded by RLS.';
