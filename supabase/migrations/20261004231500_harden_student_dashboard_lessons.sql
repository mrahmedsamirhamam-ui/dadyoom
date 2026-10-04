-- get_student_dashboard_lessons reads only published lessons joined to active public catalog tables.
-- Existing RLS already grants authenticated users exactly that data, so elevated privileges are unnecessary.
alter function public.get_student_dashboard_lessons(text, integer, integer)
  security invoker;

comment on function public.get_student_dashboard_lessons(text, integer, integer) is
  'Returns published lessons for the authenticated student dashboard under caller RLS; no elevated privileges required.';
