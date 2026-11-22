-- Dadyoom growth audit (2026-11-05). Read-only, no PII outputs.
-- Run with authorized SQL access; do NOT interpret web sessions from these tables.
-- This must be reconciled with fresh auth and activity data before any campaigns.

select role, count(*) as profile_count,
  count(*) filter (where created_at >= now() - interval '30 days') as registrations_30d
from public.profiles group by role order by profile_count desc;

select (select count(*) from auth.users) as auth_accounts,
       (select count(*) from public.profiles) as profiles,
       (select count(*) from public.student_lesson_progress) as lesson_progress_records,
       (select count(*) from public.edu_assignments) as teacher_assignments,
       (select count(*) from public.edu_game_attempts) as game_attempts,
       (select count(*) from public.lesson_activity_attempts) as activity_attempts;

select count(distinct student_id) as unique_starters,
  count(distinct student_id) filter (where completed_at is not null or status in ('completed','mastered') or progress_percent>=100)
    as unique_completers_in_progress_table,
  count(*) filter (where completed_at is null and status in ('completed','mastered')) as inconsistent_completion_dates
from public.student_lesson_progress;

select count(distinct a.user_id) as activity_actor_ids,
  count(distinct a.user_id) filter(where p.id is null) as actors_without_profile,
  count(distinct a.user_id) filter(where u.id is null) as actors_without_auth,
  count(*) filter(where p.id is null) as attempts_without_profile,
  count(*) filter(where u.id is null) as attempts_without_auth
from public.lesson_activity_attempts a
left join public.profiles p on p.id = a.user_id
left join auth.users u on u.id = a.user_id;

select case when country in ('BH','Bahrain','البحرين') then 'BH'
    when country in ('EG','Egypt','مصر') then 'EG'
    else coalesce(nullif(country,''),'unknown') end as normalized_country,
  role, count(*) as profiles
from public.profiles group by 1,2 order by profiles desc;

select c.code as country, g.grade_number,
  count(*) as listed_lessons,
  count(*) filter(where l.status='published') as published
from public.lessons l
join public.units u on u.id=l.unit_id
join public.grades g on g.id=u.grade_id
join public.curricula cr on cr.id=g.curriculum_id
join public.countries c on c.id=cr.country_id
where g.grade_number between 1 and 3
group by c.code,g.grade_number order by c.code,g.grade_number;

-- Important: A published lesson is not proof of full official textbook coverage.
-- Do not report D1/D7/D30, visits, North Star, or page exits from these queries.
