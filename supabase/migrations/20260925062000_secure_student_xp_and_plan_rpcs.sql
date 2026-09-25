-- Harden exposed SECURITY DEFINER helpers without breaking legitimate
-- student / parent / teacher / school-owner access paths.
-- Applied to production on 2026-09-25.

create or replace function public.edu_total_xp(p_student uuid)
returns integer
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_requester uuid := auth.uid();
  v_role text := coalesce(auth.role(), '');
  v_authorized boolean := false;
  v_total integer := 0;
begin
  if p_student is null then
    raise exception 'STUDENT_REQUIRED';
  end if;

  if v_role = 'service_role' then
    v_authorized := true;
  elsif v_requester is null then
    raise exception 'AUTH_REQUIRED';
  elsif p_student = v_requester or public.is_admin() then
    v_authorized := true;
  elsif exists (
    select 1
    from public.parent_students ps
    where ps.parent_id = v_requester
      and ps.student_id = p_student
      and ps.is_active = true
  ) then
    v_authorized := true;
  elsif exists (
    select 1
    from public.teacher_class_students tcs
    join public.teacher_classes tc
      on tc.id = tcs.class_id
    where tc.teacher_id = v_requester
      and tc.is_active = true
      and tcs.student_id = p_student
      and tcs.is_active = true
  ) then
    v_authorized := true;
  elsif exists (
    select 1
    from public.schools s
    join public.school_teachers st
      on st.school_id = s.id
    join public.teacher_classes tc
      on tc.teacher_id = st.teacher_id
    join public.teacher_class_students tcs
      on tcs.class_id = tc.id
    where s.owner_id = v_requester
      and s.is_active = true
      and st.is_active = true
      and tc.is_active = true
      and tcs.student_id = p_student
      and tcs.is_active = true
  ) then
    v_authorized := true;
  end if;

  if not v_authorized then
    raise exception 'XP_ACCESS_DENIED';
  end if;

  select (
    coalesce((select sum(xp) from public.student_lesson_progress where student_id = p_student), 0)
    + coalesce((select sum(xp) from public.student_skill_progress where user_id = p_student), 0)
    + coalesce((select sum(bonus_xp) from public.student_daily_challenges where user_id = p_student and bonus_awarded = true), 0)
    + coalesce((select sum(points) from public.edu_rewards where student_id = p_student), 0)
    + coalesce((select sum(xp_earned) from public.edu_game_attempts where student_id = p_student), 0)
  )::integer
  into v_total;

  return coalesce(v_total, 0);
end;
$function$;

create or replace function public.edu_current_plan(p_user uuid)
returns text
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_requester uuid := auth.uid();
  v_role text := coalesce(auth.role(), '');
begin
  if p_user is null then
    raise exception 'USER_REQUIRED';
  end if;

  if v_role <> 'service_role' then
    if v_requester is null then
      raise exception 'AUTH_REQUIRED';
    end if;

    if p_user <> v_requester and not public.is_admin() then
      raise exception 'PLAN_ACCESS_DENIED';
    end if;
  end if;

  if exists (
    select 1
    from public.profiles p
    where p.id = p_user
      and lower(trim(p.role)) = 'admin'
  ) then
    return 'plus';
  end if;

  if exists (
    select 1
    from public.edu_subscriptions s
    where s.user_id = p_user
      and s.plan_id = 'plus'
      and s.status = 'active'
      and (
        s.current_period_end is null
        or s.current_period_end > now()
      )
  ) then
    return 'plus';
  end if;

  return 'free';
end;
$function$;

revoke execute on function public.edu_total_xp(uuid) from anon;
revoke execute on function public.edu_current_plan(uuid) from anon;
grant execute on function public.edu_total_xp(uuid) to authenticated, service_role;
grant execute on function public.edu_current_plan(uuid) to authenticated, service_role;
