create index if not exists idx_grades_curriculum_grade_number
  on public.grades (curriculum_id, grade_number)
  where is_active = true;

create or replace function public.get_student_dashboard_lessons(
  p_country_code text,
  p_grade_number integer,
  p_limit integer default 24
)
returns table (
  id uuid,
  title text,
  estimated_minutes integer,
  lesson_number integer,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $function$
  select
    l.id,
    l.title,
    l.estimated_minutes,
    l.lesson_number,
    count(*) over () as total_count
  from public.lessons l
  join public.units u
    on u.id = l.unit_id
  join public.grades g
    on g.id = u.grade_id
   and g.is_active = true
  join public.curricula cu
    on cu.id = g.curriculum_id
   and cu.is_active = true
  join public.countries c
    on c.id = cu.country_id
   and c.is_active = true
  where l.status = 'published'
    and g.grade_number = p_grade_number
    and c.code = upper(trim(p_country_code))
  order by l.lesson_number asc nulls last, l.id
  limit greatest(1, least(coalesce(p_limit, 24), 50));
$function$;

revoke all on function public.get_student_dashboard_lessons(text, integer, integer)
  from public, anon;

grant execute on function public.get_student_dashboard_lessons(text, integer, integer)
  to authenticated, service_role;
