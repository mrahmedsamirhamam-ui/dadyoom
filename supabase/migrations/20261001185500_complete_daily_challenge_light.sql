create or replace function public.complete_daily_challenge_light(
  p_skill text,
  p_score integer
)
returns table (
  matched boolean,
  completed boolean,
  newly_completed boolean,
  bonus_xp integer
)
language plpgsql
security invoker
set search_path = public
as $function$
declare
  v_user uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Bahrain')::date;
  v_row public.student_daily_challenges%rowtype;
  v_score integer := greatest(0, least(100, coalesce(p_score, 0)));
  v_updated integer := 0;
begin
  if v_user is null then
    return query select false, false, false, 0;
    return;
  end if;

  select *
  into v_row
  from public.student_daily_challenges
  where user_id = v_user
    and challenge_date = v_today
  limit 1;

  if not found or v_row.skill <> p_skill then
    return query select false, false, false, 0;
    return;
  end if;

  if v_row.status = 'completed' or v_row.bonus_awarded then
    return query
      select true, true, false, greatest(0, coalesce(v_row.bonus_xp, 0));
    return;
  end if;

  if v_score < v_row.target_score then
    update public.student_daily_challenges
    set achieved_score = greatest(coalesce(achieved_score, 0), v_score),
        updated_at = now()
    where id = v_row.id;

    return query select true, false, false, 0;
    return;
  end if;

  update public.student_daily_challenges
  set status = 'completed',
      achieved_score = v_score,
      completed_at = now(),
      bonus_xp = 15,
      bonus_awarded = true,
      updated_at = now()
  where id = v_row.id
    and bonus_awarded = false;

  get diagnostics v_updated = row_count;

  return query
    select true, true, (v_updated > 0), 15;
end;
$function$;

revoke all on function public.complete_daily_challenge_light(text, integer) from public;
revoke all on function public.complete_daily_challenge_light(text, integer) from anon;
grant execute on function public.complete_daily_challenge_light(text, integer) to authenticated;
grant execute on function public.complete_daily_challenge_light(text, integer) to service_role;
