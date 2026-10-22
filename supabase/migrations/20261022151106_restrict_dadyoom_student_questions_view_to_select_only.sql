-- Applied to production 2026-10-22. Supabase auto-object grants also
-- assign broad privileges directly to anon/authenticated on CREATE VIEW.
-- REVOKE FROM PUBLIC alone does not undo those direct grants.
REVOKE ALL ON TABLE public.dadyoom_student_questions FROM anon, authenticated;
GRANT SELECT ON TABLE public.dadyoom_student_questions TO anon, authenticated;
COMMENT ON VIEW public.dadyoom_student_questions IS
 'Published-lesson, invoker-RLS student question allowlist; SELECT-only for anon/authenticated. Legacy questions table permissions unchanged.';
