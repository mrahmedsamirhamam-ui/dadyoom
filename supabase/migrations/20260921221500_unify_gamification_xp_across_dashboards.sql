-- Dadyoom unified gamification XP.
-- Applied to production on 2026-09-21 and stored here for source control.
-- Canonical XP = lessons + four skills + daily challenges + teacher/school rewards + games.

create or replace function public.edu_total_xp(p_student uuid)
returns integer
language sql
stable
security definer
set search_path to 'public'
as $function$
  select (
    coalesce((select sum(xp) from public.student_lesson_progress where student_id = p_student), 0)
    + coalesce((select sum(xp) from public.student_skill_progress where user_id = p_student), 0)
    + coalesce((select sum(bonus_xp) from public.student_daily_challenges where user_id = p_student and bonus_awarded = true), 0)
    + coalesce((select sum(points) from public.edu_rewards where student_id = p_student), 0)
    + coalesce((select sum(xp_earned) from public.edu_game_attempts where student_id = p_student), 0)
  )::integer;
$function$;

create or replace function public.get_parent_children()
returns table(
  student_id uuid,
  full_name text,
  email text,
  relationship text,
  completed_lessons bigint,
  mastered_lessons bigint,
  average_score numeric,
  total_xp bigint
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_role text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'يجب تسجيل الدخول أولًا.';
  end if;

  select lower(trim(role))
  into v_role
  from public.profiles
  where id = v_user_id;

  if v_role <> 'parent' and v_role <> 'admin' then
    raise exception 'هذه الصفحة متاحة لولي الأمر فقط.';
  end if;

  return query
  select
    student.id,
    student.full_name,
    student.email,
    ps.relationship,
    coalesce(progress.completed_lessons, 0)::bigint,
    coalesce(progress.mastered_lessons, 0)::bigint,
    coalesce(progress.average_score, 0)::numeric,
    public.edu_total_xp(student.id)::bigint
  from public.parent_students ps
  join public.profiles student
    on student.id = ps.student_id
  left join lateral (
    select
      count(slp.id) filter (
        where slp.status in ('completed', 'mastered')
      )::bigint as completed_lessons,
      count(slp.id) filter (
        where slp.status = 'mastered'
      )::bigint as mastered_lessons,
      coalesce(round(avg(slp.best_score)::numeric, 1), 0) as average_score
    from public.student_lesson_progress slp
    where slp.student_id = student.id
  ) progress on true
  where ps.parent_id = v_user_id
    and ps.is_active = true
  order by student.full_name;
end;
$function$;

create or replace function public.get_teacher_class_roster(p_class_id uuid)
returns table(
  student_id uuid,
  full_name text,
  email text,
  completed_lessons bigint,
  mastered_lessons bigint,
  average_best_score numeric,
  total_xp bigint,
  joined_at timestamp with time zone
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_role text;
  v_teacher_id uuid;
  v_school_authorized boolean := false;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'يجب تسجيل الدخول أولًا.';
  end if;

  select lower(trim(p.role))
  into v_role
  from public.profiles as p
  where p.id = v_user_id;

  select tc.teacher_id
  into v_teacher_id
  from public.teacher_classes as tc
  where tc.id = p_class_id;

  if v_teacher_id is null then
    raise exception 'الفصل غير موجود.';
  end if;

  if coalesce(v_role, '') = 'school' then
    select exists (
      select 1
      from public.schools as s
      join public.school_teachers as st
        on st.school_id = s.id
      where s.owner_id = v_user_id
        and s.is_active = true
        and st.teacher_id = v_teacher_id
        and st.is_active = true
    )
    into v_school_authorized;
  end if;

  if (
    v_teacher_id <> v_user_id
    and coalesce(v_role, '') <> 'admin'
    and not v_school_authorized
  ) then
    raise exception 'غير مصرح لك بعرض طلاب هذا الفصل.';
  end if;

  return query
  select
    student.id,
    student.full_name,
    student.email,
    coalesce(progress.completed_lessons, 0)::bigint,
    coalesce(progress.mastered_lessons, 0)::bigint,
    coalesce(progress.average_best_score, 0)::numeric,
    public.edu_total_xp(student.id)::bigint,
    membership.joined_at
  from public.teacher_class_students as membership
  join public.profiles as student
    on student.id = membership.student_id
  left join lateral (
    select
      count(slp.id) filter (
        where slp.status in ('completed', 'mastered')
      )::bigint as completed_lessons,
      count(slp.id) filter (
        where slp.status = 'mastered'
      )::bigint as mastered_lessons,
      coalesce(round(avg(slp.best_score)::numeric, 1), 0) as average_best_score
    from public.student_lesson_progress slp
    where slp.student_id = student.id
  ) progress on true
  where membership.class_id = p_class_id
    and membership.is_active = true
  order by student.full_name;
end;
$function$;

create or replace function public.get_school_teacher_class_analytics_v1()
returns table(
  teacher_id uuid,
  teacher_name text,
  teacher_email text,
  class_id uuid,
  class_name text,
  academic_year text,
  student_count bigint,
  active_student_count bigint,
  completed_lessons bigint,
  mastered_lessons bigint,
  average_best_score numeric,
  total_xp bigint
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_role text;
  v_school_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'يجب تسجيل الدخول أولًا.';
  end if;

  select lower(trim(p.role))
  into v_role
  from public.profiles as p
  where p.id = v_user_id;

  if coalesce(v_role, '') not in ('school', 'admin') then
    raise exception 'هذه العملية متاحة لحساب المدرسة فقط.';
  end if;

  select s.id
  into v_school_id
  from public.schools as s
  where s.owner_id = v_user_id
    and s.is_active = true
  limit 1;

  if v_school_id is null then
    raise exception 'لم يتم العثور على ملف المدرسة.';
  end if;

  return query
  with school_teachers_cte as (
    select distinct st.teacher_id
    from public.school_teachers as st
    where st.school_id = v_school_id
      and st.is_active = true
  ),
  classes_cte as (
    select
      tc.id,
      tc.teacher_id,
      tc.name,
      tc.academic_year
    from public.teacher_classes as tc
    join school_teachers_cte as st
      on st.teacher_id = tc.teacher_id
    where tc.is_active = true
  ),
  memberships_cte as (
    select distinct
      tcs.class_id,
      tcs.student_id
    from public.teacher_class_students as tcs
    join classes_cte as c
      on c.id = tcs.class_id
    where tcs.is_active = true
  ),
  progress_by_class as (
    select
      m.class_id,
      count(distinct slp.student_id) filter (
        where slp.status in ('in_progress', 'completed', 'mastered')
      )::bigint as active_student_count,
      count(slp.id) filter (
        where slp.status in ('completed', 'mastered')
      )::bigint as completed_lessons,
      count(slp.id) filter (
        where slp.status = 'mastered'
      )::bigint as mastered_lessons,
      coalesce(round(avg(slp.best_score)::numeric, 1), 0) as average_best_score
    from memberships_cte m
    left join public.student_lesson_progress slp
      on slp.student_id = m.student_id
    group by m.class_id
  ),
  xp_by_class as (
    select
      m.class_id,
      coalesce(sum(public.edu_total_xp(m.student_id)), 0)::bigint as total_xp
    from memberships_cte m
    group by m.class_id
  )
  select
    teacher.id,
    teacher.full_name,
    teacher.email,
    c.id,
    c.name,
    c.academic_year,
    count(distinct m.student_id)::bigint,
    coalesce(p.active_student_count, 0)::bigint,
    coalesce(p.completed_lessons, 0)::bigint,
    coalesce(p.mastered_lessons, 0)::bigint,
    coalesce(p.average_best_score, 0)::numeric,
    coalesce(x.total_xp, 0)::bigint
  from classes_cte c
  join public.profiles teacher
    on teacher.id = c.teacher_id
  left join memberships_cte m
    on m.class_id = c.id
  left join progress_by_class p
    on p.class_id = c.id
  left join xp_by_class x
    on x.class_id = c.id
  group by
    teacher.id,
    teacher.full_name,
    teacher.email,
    c.id,
    c.name,
    c.academic_year,
    p.active_student_count,
    p.completed_lessons,
    p.mastered_lessons,
    p.average_best_score,
    x.total_xp
  order by teacher.full_name, c.name;
end;
$function$;

create or replace function public.get_school_analytics_v1()
returns table(
  total_teachers bigint,
  total_classes bigint,
  total_students bigint,
  active_students bigint,
  completed_lessons bigint,
  mastered_lessons bigint,
  average_best_score numeric,
  total_xp bigint
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_role text;
  v_school_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'يجب تسجيل الدخول أولًا.';
  end if;

  select lower(trim(p.role))
  into v_role
  from public.profiles as p
  where p.id = v_user_id;

  if coalesce(v_role, '') not in ('school', 'admin') then
    raise exception 'هذه العملية متاحة لحساب المدرسة فقط.';
  end if;

  select s.id
  into v_school_id
  from public.schools as s
  where s.owner_id = v_user_id
    and s.is_active = true
  limit 1;

  if v_school_id is null then
    raise exception 'لم يتم العثور على ملف المدرسة.';
  end if;

  return query
  with school_teacher_ids as (
    select distinct st.teacher_id
    from public.school_teachers as st
    where st.school_id = v_school_id
      and st.is_active = true
  ),
  school_classes as (
    select distinct tc.id
    from public.teacher_classes as tc
    join school_teacher_ids as sti
      on sti.teacher_id = tc.teacher_id
    where tc.is_active = true
  ),
  school_students as (
    select distinct tcs.student_id
    from public.teacher_class_students tcs
    join school_classes sc
      on sc.id = tcs.class_id
    where tcs.is_active = true
  ),
  progress as (
    select slp.*
    from public.student_lesson_progress slp
    join school_students ss
      on ss.student_id = slp.student_id
  )
  select
    (select count(*)::bigint from school_teacher_ids),
    (select count(*)::bigint from school_classes),
    (select count(*)::bigint from school_students),
    (
      select count(distinct p.student_id)::bigint
      from progress p
      where p.status in ('in_progress', 'completed', 'mastered')
    ),
    (
      select count(*)::bigint
      from progress p
      where p.status in ('completed', 'mastered')
    ),
    (
      select count(*)::bigint
      from progress p
      where p.status = 'mastered'
    ),
    coalesce(
      (
        select round(avg(p.best_score)::numeric, 1)
        from progress p
        where p.best_score is not null
      ),
      0
    ),
    coalesce(
      (
        select sum(public.edu_total_xp(ss.student_id))::bigint
        from school_students ss
      ),
      0
    );
end;
$function$;
