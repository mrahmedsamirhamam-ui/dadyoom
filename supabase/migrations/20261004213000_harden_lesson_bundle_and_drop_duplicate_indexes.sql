-- Security/performance hardening verified against Supabase advisors on 2026-10-04.
--
-- 1) get_lesson_page_bundle only reads tables that already expose the required
--    rows through RLS (published public content + caller-owned private rows).
--    SECURITY INVOKER therefore preserves behavior while removing unnecessary
--    privilege escalation.
-- 2) The indexes/constraints below were verified byte-for-byte equivalent by
--    pg_indexes. None of the two plain indexes backs a constraint, and no FK
--    references student_progress. Keep one canonical copy of each definition.

alter function public.get_lesson_page_bundle(uuid)
  security invoker;

comment on function public.get_lesson_page_bundle(uuid) is
  'Public/auth lesson bundle. Runs as caller so existing RLS governs published content and caller-owned progress/attempt/tutor rows.';

drop index if exists public.idx_lesson_activities_lesson;
drop index if exists public.idx_student_memory_student_updated;

alter table public.student_progress
  drop constraint if exists student_progress_email_lesson_unique;

alter table public.student_progress
  drop constraint if exists student_progress_student_lesson_unique;
