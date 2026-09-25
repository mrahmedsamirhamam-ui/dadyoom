-- Harden exposed authorization helper RPCs.
-- Applied to production on 2026-09-25.
-- SECURITY DEFINER remains intentional because these helpers are used by RLS,
-- but callers may no longer probe arbitrary user identities.

create or replace function public.edu_is_class_student(
  p_class_id uuid,
  p_student_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_requester uuid := auth.uid();
  v_role text := coalesce(auth.role(), '');
  v_allowed boolean := false;
begin
  if p_class_id is null or p_student_id is null then
    return false;
  end if;

  if v_role = 'service_role' then
    v_allowed := true;
  elsif v_requester is null then
    return false;
  elsif p_student_id = v_requester or public.is_admin() then
    v_allowed := true;
  elsif exists (
    select 1
    from public.teacher_classes tc
    where tc.id = p_class_id
      and tc.teacher_id = v_requester
      and tc.is_active = true
  ) then
    v_allowed := true;
  elsif exists (
    select 1
    from public.teacher_classes tc
    join public.school_teachers st
      on st.teacher_id = tc.teacher_id
     and st.is_active = true
    join public.schools s
      on s.id = st.school_id
     and s.is_active = true
    where tc.id = p_class_id
      and tc.is_active = true
      and s.owner_id = v_requester
  ) then
    v_allowed := true;
  end if;

  if not v_allowed then
    return false;
  end if;

  return exists (
    select 1
    from public.teacher_class_students tcs
    where tcs.class_id = p_class_id
      and tcs.student_id = p_student_id
      and tcs.is_active = true
  );
end;
$function$;

create or replace function public.edu_is_class_teacher(
  p_class_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_requester uuid := auth.uid();
  v_role text := coalesce(auth.role(), '');
  v_allowed boolean := false;
begin
  if p_class_id is null or p_user_id is null then
    return false;
  end if;

  if v_role = 'service_role' then
    v_allowed := true;
  elsif v_requester is null then
    return false;
  elsif p_user_id = v_requester or public.is_admin() then
    v_allowed := true;
  elsif exists (
    select 1
    from public.teacher_classes tc
    join public.school_teachers st
      on st.teacher_id = tc.teacher_id
     and st.is_active = true
    join public.schools s
      on s.id = st.school_id
     and s.is_active = true
    where tc.id = p_class_id
      and tc.teacher_id = p_user_id
      and tc.is_active = true
      and s.owner_id = v_requester
  ) then
    v_allowed := true;
  end if;

  if not v_allowed then
    return false;
  end if;

  return exists (
    select 1
    from public.teacher_classes tc
    where tc.id = p_class_id
      and tc.teacher_id = p_user_id
      and tc.is_active = true
  );
end;
$function$;

create or replace function public.edu_is_school_owner(
  p_school_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_requester uuid := auth.uid();
  v_role text := coalesce(auth.role(), '');
begin
  if p_school_id is null or p_user_id is null then
    return false;
  end if;

  if v_role <> 'service_role' then
    if v_requester is null then return false; end if;
    if p_user_id <> v_requester and not public.is_admin() then return false; end if;
  end if;

  return exists (
    select 1
    from public.schools s
    where s.id = p_school_id
      and s.owner_id = p_user_id
      and s.is_active = true
  );
end;
$function$;

create or replace function public.edu_assignment_visible_to_student(
  p_assignment_id uuid,
  p_student_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_requester uuid := auth.uid();
  v_role text := coalesce(auth.role(), '');
begin
  if p_assignment_id is null or p_student_id is null then return false; end if;

  if v_role <> 'service_role' then
    if v_requester is null then return false; end if;
    if p_student_id <> v_requester and not public.is_admin() then return false; end if;
  end if;

  return exists (
    select 1
    from public.edu_assignments a
    where a.id = p_assignment_id
      and a.status = 'published'
      and public.edu_is_class_student(a.class_id, p_student_id)
      and (
        a.target_mode = 'class'
        or exists (
          select 1
          from public.edu_assignment_targets t
          where t.assignment_id = a.id
            and t.student_id = p_student_id
        )
      )
  );
end;
$function$;

create or replace function public.edu_can_access_conversation(
  p_conversation_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_requester uuid := auth.uid();
  v_role text := coalesce(auth.role(), '');
begin
  if p_conversation_id is null or p_user_id is null then return false; end if;

  if v_role <> 'service_role' then
    if v_requester is null then return false; end if;
    if p_user_id <> v_requester and not public.is_admin() then return false; end if;
  end if;

  return exists (
    select 1
    from public.edu_conversations c
    where c.id = p_conversation_id
      and (c.teacher_id = p_user_id or c.student_id = p_user_id)
  );
end;
$function$;

create or replace function public.edu_can_join_live_session(
  p_session uuid,
  p_user uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_requester uuid := auth.uid();
  v_role text := coalesce(auth.role(), '');
begin
  if p_session is null or p_user is null then return false; end if;

  if v_role <> 'service_role' then
    if v_requester is null then return false; end if;
    if p_user <> v_requester and not public.is_admin() then return false; end if;
  end if;

  return exists (
    select 1
    from public.edu_live_sessions s
    where s.id = p_session
      and s.status in ('scheduled','live','ended')
      and (
        s.teacher_id = p_user
        or (
          s.class_id is not null
          and exists (
            select 1
            from public.teacher_class_students cs
            where cs.class_id = s.class_id
              and cs.student_id = p_user
              and cs.is_active = true
          )
        )
        or (
          s.course_id is not null
          and exists (
            select 1
            from public.edu_marketplace_purchases p
            where p.course_id = s.course_id
              and p.buyer_id = p_user
              and p.status = 'completed'
          )
        )
      )
  );
end;
$function$;

revoke execute on function public.edu_is_class_student(uuid, uuid) from anon;
revoke execute on function public.edu_is_class_teacher(uuid, uuid) from anon;
revoke execute on function public.edu_is_school_owner(uuid, uuid) from anon;
revoke execute on function public.edu_assignment_visible_to_student(uuid, uuid) from anon;
revoke execute on function public.edu_can_access_conversation(uuid, uuid) from anon;
revoke execute on function public.edu_can_join_live_session(uuid, uuid) from anon;
