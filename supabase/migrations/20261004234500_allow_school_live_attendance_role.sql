-- Align attendance role validation with edu_can_join_live_session().
-- School owners are explicitly allowed to join school-scoped live sessions,
-- so their attendance row must accept the profile role "school".
alter table public.edu_live_attendance
  drop constraint if exists edu_live_attendance_role_check;

alter table public.edu_live_attendance
  add constraint edu_live_attendance_role_check
  check (role = any (array['teacher'::text,'student'::text,'assistant'::text,'school'::text]));
