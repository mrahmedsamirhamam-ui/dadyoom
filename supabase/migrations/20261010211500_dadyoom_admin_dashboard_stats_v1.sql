-- Aggregate the admin landing page's 8 RLS-filtered counts in 1 RPC.
-- SECURITY INVOKER is mandatory: do not grant the function any ability
-- to bypass table RLS, and deny calls that lack a verified admin profile.
create or replace function public.dadyoom_admin_dashboard_stats_v1()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select jsonb_build_object(
    'students',          (select count(*) from public.profiles where role = 'student'),
    'teachers',          (select count(*) from public.profiles where role = 'teacher'),
    'parents',           (select count(*) from public.profiles where role = 'parent'),
    'schools',           (select count(*) from public.profiles where role = 'school'),
    'lessons',           (select count(*) from public.lessons),
    'publishedLessons',  (select count(*) from public.lessons where status = 'published'),
    'completedLessons',  (select count(*) from public.student_lesson_progress
                           where status in ('completed', 'mastered')),
    'chats',             (select count(*) from public.chat_history)
  )
  where exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and lower(trim(role)) = 'admin'
  );
$function$;

revoke all on function public.dadyoom_admin_dashboard_stats_v1() from public;
revoke all on function public.dadyoom_admin_dashboard_stats_v1() from anon;
grant execute on function public.dadyoom_admin_dashboard_stats_v1() to authenticated;
