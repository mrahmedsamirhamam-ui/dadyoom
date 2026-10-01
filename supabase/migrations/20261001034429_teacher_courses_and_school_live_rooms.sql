alter table public.edu_marketplace_courses
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists schedule_note text,
  add column if not exists max_students integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.edu_marketplace_courses'::regclass
      and conname = 'edu_marketplace_courses_schedule_check'
  ) then
    alter table public.edu_marketplace_courses
      add constraint edu_marketplace_courses_schedule_check
      check (ends_at is null or starts_at is null or ends_at > starts_at);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.edu_marketplace_courses'::regclass
      and conname = 'edu_marketplace_courses_max_students_check'
  ) then
    alter table public.edu_marketplace_courses
      add constraint edu_marketplace_courses_max_students_check
      check (max_students is null or (max_students >= 1 and max_students <= 10000));
  end if;
end
$$;

alter table public.edu_live_sessions
  add column if not exists school_id uuid references public.schools(id) on delete cascade;

alter table public.edu_live_sessions
  drop constraint if exists edu_live_sessions_check;

alter table public.edu_live_sessions
  add constraint edu_live_sessions_check
  check (
    course_id is not null
    or class_id is not null
    or school_id is not null
  );

create index if not exists edu_live_sessions_school_idx
  on public.edu_live_sessions (school_id, starts_at desc)
  where school_id is not null;

drop policy if exists "live sessions teacher manage"
  on public.edu_live_sessions;

drop policy if exists "live sessions host insert"
  on public.edu_live_sessions;
create policy "live sessions host insert"
  on public.edu_live_sessions
  for insert
  to authenticated
  with check (
    teacher_id = (select auth.uid())
    and (
      class_id is null
      or exists (
        select 1
        from public.teacher_classes tc
        where tc.id = class_id
          and tc.teacher_id = (select auth.uid())
      )
    )
    and (
      course_id is null
      or exists (
        select 1
        from public.edu_marketplace_courses mc
        where mc.id = course_id
          and mc.teacher_id = (select auth.uid())
      )
    )
    and (
      school_id is null
      or exists (
        select 1
        from public.schools s
        where s.id = school_id
          and s.owner_id = (select auth.uid())
          and s.is_active = true
      )
    )
  );

drop policy if exists "live sessions host update"
  on public.edu_live_sessions;
create policy "live sessions host update"
  on public.edu_live_sessions
  for update
  to authenticated
  using (teacher_id = (select auth.uid()))
  with check (
    teacher_id = (select auth.uid())
    and (
      class_id is null
      or exists (
        select 1
        from public.teacher_classes tc
        where tc.id = class_id
          and tc.teacher_id = (select auth.uid())
      )
    )
    and (
      course_id is null
      or exists (
        select 1
        from public.edu_marketplace_courses mc
        where mc.id = course_id
          and mc.teacher_id = (select auth.uid())
      )
    )
    and (
      school_id is null
      or exists (
        select 1
        from public.schools s
        where s.id = school_id
          and s.owner_id = (select auth.uid())
          and s.is_active = true
      )
    )
  );

drop policy if exists "live sessions host delete"
  on public.edu_live_sessions;
create policy "live sessions host delete"
  on public.edu_live_sessions
  for delete
  to authenticated
  using (teacher_id = (select auth.uid()));

create or replace function public.edu_can_join_live_session(
  p_session uuid,
  p_user uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_requester uuid := auth.uid();
  v_is_service boolean :=
    coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
begin
  if p_session is null or p_user is null then
    return false;
  end if;

  if not v_is_service then
    if v_requester is null then
      return false;
    end if;

    if p_user <> v_requester and not public.is_admin() then
      return false;
    end if;
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
              and p.status in ('active','completed')
          )
        )
        or (
          s.school_id is not null
          and (
            exists (
              select 1
              from public.schools school
              where school.id = s.school_id
                and school.owner_id = p_user
                and school.is_active = true
            )
            or exists (
              select 1
              from public.school_teachers st
              where st.school_id = s.school_id
                and st.teacher_id = p_user
                and st.is_active = true
            )
          )
        )
      )
  );
end;
$function$;

revoke all on function public.edu_can_join_live_session(uuid, uuid) from public;
revoke all on function public.edu_can_join_live_session(uuid, uuid) from anon;
grant execute on function public.edu_can_join_live_session(uuid, uuid) to authenticated;
grant execute on function public.edu_can_join_live_session(uuid, uuid) to service_role;
