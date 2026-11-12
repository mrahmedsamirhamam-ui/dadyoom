-- READ ONLY; manually run by authorized DBA in a private SQL console AFTER
-- an approved deployment. Do NOT print/export to public CI or GitHub logs.
-- No data is changed and no direct end-user security probes are performed.
SELECT pg_get_functiondef('public.handle_new_user()'::regprocedure);
SELECT policyname, cmd, roles, qual, with_check
 FROM pg_policies WHERE schemaname='public' AND tablename IN
 ('profiles','profile_role_requests','question_attempts','questions')
 ORDER BY tablename, policyname;
SELECT grantee, privilege_type, column_name
 FROM information_schema.column_privileges WHERE table_schema='public'
 AND table_name IN ('profiles','questions','question_attempts')
 AND grantee IN ('anon','authenticated')
 ORDER BY table_name, grantee, column_name;
-- Use auth.users.created_at: profiles.created_at is not guaranteed.
SELECT p.id, p.role, u.created_at
 FROM public.profiles p JOIN auth.users u ON u.id=p.id
 WHERE p.role IN ('teacher','school','admin')
 ORDER BY u.created_at DESC;
SELECT p.id, p.role, u.raw_user_meta_data->>'role' AS requested_role,
 u.created_at FROM public.profiles p
 JOIN auth.users u ON u.id=p.id
 WHERE u.raw_user_meta_data ? 'role'
 ORDER BY u.created_at DESC;
SELECT requested_role, status, count(*) AS total
 FROM public.profile_role_requests
 GROUP BY requested_role, status ORDER BY requested_role, status;
SELECT requested_role, decision, count(*) AS total
 FROM public.profile_role_review_audit
 GROUP BY requested_role, decision ORDER BY requested_role, decision;
