create or replace function public.edu_consume_feature(
  p_feature text,
  p_amount integer default 1
)
returns table(
  allowed boolean,
  plan_id text,
  used_count integer,
  limit_value integer,
  remaining integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_plan text;
  v_limit integer;
  v_used integer;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_amount is null or p_amount < 1 then
    p_amount := 1;
  end if;

  v_plan := public.edu_current_plan(v_user);

  if v_plan = 'plus' then
    return query
      select true, v_plan, 0, null::integer, null::integer;
    return;
  end if;

  select nullif((p.limits ->> p_feature), '')::integer
    into v_limit
  from public.edu_subscription_plans as p
  where p.id = v_plan;

  if v_limit is null then
    return query
      select true, v_plan, 0, null::integer, null::integer;
    return;
  end if;

  insert into public.edu_feature_usage(
    user_id,
    usage_date,
    feature,
    used_count,
    updated_at
  )
  values(
    v_user,
    current_date,
    p_feature,
    0,
    now()
  )
  on conflict (user_id, usage_date, feature) do nothing;

  select u.used_count
    into v_used
  from public.edu_feature_usage as u
  where u.user_id = v_user
    and u.usage_date = current_date
    and u.feature = p_feature
  for update;

  if v_used + p_amount > v_limit then
    return query
      select
        false,
        v_plan,
        v_used,
        v_limit,
        greatest(v_limit - v_used, 0);
    return;
  end if;

  update public.edu_feature_usage as u
  set used_count = u.used_count + p_amount,
      updated_at = now()
  where u.user_id = v_user
    and u.usage_date = current_date
    and u.feature = p_feature
  returning u.used_count into v_used;

  return query
    select
      true,
      v_plan,
      v_used,
      v_limit,
      greatest(v_limit - v_used, 0);
end;
$$;

revoke execute on function public.edu_consume_feature(text, integer) from anon;
grant execute on function public.edu_consume_feature(text, integer) to authenticated;
