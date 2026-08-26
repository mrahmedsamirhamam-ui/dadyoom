
-- Dadyoom final teacher question-editor security contract.
-- Admin policies remain unchanged. Teachers may mutate only questions
-- belonging to lessons they own.

alter table public.questions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='questions' and policyname='Teachers can read own lesson questions') then
    create policy "Teachers can read own lesson questions" on public.questions for select to authenticated
      using (exists (select 1 from public.lessons l where l.id = questions.lesson_id and l.created_by = auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='questions' and policyname='Teachers can insert own lesson questions') then
    create policy "Teachers can insert own lesson questions" on public.questions for insert to authenticated
      with check (exists (select 1 from public.lessons l where l.id = questions.lesson_id and l.created_by = auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='questions' and policyname='Teachers can update own lesson questions') then
    create policy "Teachers can update own lesson questions" on public.questions for update to authenticated
      using (exists (select 1 from public.lessons l where l.id = questions.lesson_id and l.created_by = auth.uid()))
      with check (exists (select 1 from public.lessons l where l.id = questions.lesson_id and l.created_by = auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='questions' and policyname='Teachers can delete own lesson questions') then
    create policy "Teachers can delete own lesson questions" on public.questions for delete to authenticated
      using (exists (select 1 from public.lessons l where l.id = questions.lesson_id and l.created_by = auth.uid()));
  end if;
end $$;

create or replace function public.move_lesson_question_safe(p_question_id uuid, p_direction integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_lesson_id uuid;
  v_current_order integer;
  v_created_by uuid;
  v_neighbor_id uuid;
  v_neighbor_order integer;
  v_temp_order integer;
  v_is_admin boolean;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_direction not in (-1, 1) then raise exception 'INVALID_DIRECTION'; end if;

  select q.lesson_id, q.question_order, l.created_by
    into v_lesson_id, v_current_order, v_created_by
  from public.questions q
  join public.lessons l on l.id = q.lesson_id
  where q.id = p_question_id;
  if not found then raise exception 'QUESTION_NOT_FOUND'; end if;

  select exists (
    select 1 from public.profiles p
    where p.id = v_user_id and lower(trim(p.role)) = 'admin'
  ) into v_is_admin;

  if not v_is_admin and v_created_by <> v_user_id then raise exception 'QUESTION_ACCESS_DENIED'; end if;

  if p_direction = -1 then
    select q.id, q.question_order into v_neighbor_id, v_neighbor_order
    from public.questions q
    where q.lesson_id = v_lesson_id and q.question_order < v_current_order
    order by q.question_order desc limit 1;
  else
    select q.id, q.question_order into v_neighbor_id, v_neighbor_order
    from public.questions q
    where q.lesson_id = v_lesson_id and q.question_order > v_current_order
    order by q.question_order asc limit 1;
  end if;

  if v_neighbor_id is null then return; end if;

  select coalesce(min(q.question_order), 0) - 1 into v_temp_order
  from public.questions q where q.lesson_id = v_lesson_id;

  update public.questions set question_order=v_temp_order, updated_at=now() where id=p_question_id;
  update public.questions set question_order=v_current_order, updated_at=now() where id=v_neighbor_id;
  update public.questions set question_order=v_neighbor_order, updated_at=now() where id=p_question_id;
end;
$$;

create or replace function public.delete_lesson_question_safe(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_created_by uuid;
  v_is_admin boolean;
  v_attempt_count bigint;
  v_skill_count bigint;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;

  select l.created_by into v_created_by
  from public.questions q join public.lessons l on l.id = q.lesson_id
  where q.id = p_question_id;
  if not found then raise exception 'QUESTION_NOT_FOUND'; end if;

  select exists (
    select 1 from public.profiles p
    where p.id = v_user_id and lower(trim(p.role)) = 'admin'
  ) into v_is_admin;

  if not v_is_admin and v_created_by <> v_user_id then raise exception 'QUESTION_ACCESS_DENIED'; end if;

  select count(*) into v_attempt_count from public.question_attempts where question_id = p_question_id;
  select count(*) into v_skill_count from public.question_skills where question_id = p_question_id;

  if v_attempt_count > 0 or v_skill_count > 0 then
    raise exception 'QUESTION_HAS_DEPENDENCIES: attempts=%, skills=%', v_attempt_count, v_skill_count;
  end if;

  delete from public.questions where id = p_question_id;
end;
$$;

revoke all on function public.move_lesson_question_safe(uuid, integer) from public;
revoke all on function public.move_lesson_question_safe(uuid, integer) from anon;
revoke all on function public.delete_lesson_question_safe(uuid) from public;
revoke all on function public.delete_lesson_question_safe(uuid) from anon;
grant execute on function public.move_lesson_question_safe(uuid, integer) to authenticated;
grant execute on function public.delete_lesson_question_safe(uuid) to authenticated;
