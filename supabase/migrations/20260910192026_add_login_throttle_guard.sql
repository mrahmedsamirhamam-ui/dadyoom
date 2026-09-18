-- DADYOOM_LOGIN_THROTTLE_GUARD_V1
-- Remote migration with this exact version/name was applied on 2026-09-10.
-- Six failures inside 15 minutes -> 15-minute cooldown.
-- Raw email/IP values are NOT stored; application supplies SHA-256 keys.

create table if not exists public.auth_login_throttle (
  key_hash text primary key,
  failed_count integer not null default 0 check (failed_count >= 0),
  window_started_at timestamptz not null default now(),
  locked_until timestamptz null,
  updated_at timestamptz not null default now()
);

alter table public.auth_login_throttle enable row level security;
revoke all on table public.auth_login_throttle from public, anon, authenticated;
grant select, insert, update, delete on table public.auth_login_throttle to service_role;

create or replace function public.auth_login_gate_check(p_key text)
returns table(allowed boolean, remaining_attempts integer, retry_after_seconds integer)
language plpgsql security definer set search_path = public
as $$
declare
  r public.auth_login_throttle%rowtype;
  now_ts timestamptz := now();
begin
  select * into r from public.auth_login_throttle where key_hash = p_key;
  if not found then
    return query select true, 6, 0;
    return;
  end if;

  if r.locked_until is not null and r.locked_until > now_ts then
    return query select false, 0, greatest(1, ceil(extract(epoch from (r.locked_until - now_ts)))::integer);
    return;
  end if;

  if r.window_started_at < now_ts - interval '15 minutes' then
    update public.auth_login_throttle
       set failed_count=0, window_started_at=now_ts, locked_until=null, updated_at=now_ts
     where key_hash=p_key;
    return query select true, 6, 0;
    return;
  end if;

  return query select true, greatest(0,6-r.failed_count), 0;
end;
$$;

create or replace function public.auth_login_gate_record_failure(p_key text)
returns table(locked boolean, remaining_attempts integer, retry_after_seconds integer)
language plpgsql security definer set search_path = public
as $$
declare
  r public.auth_login_throttle%rowtype;
  now_ts timestamptz := now();
begin
  insert into public.auth_login_throttle(key_hash,failed_count,window_started_at,locked_until,updated_at)
  values(p_key,1,now_ts,null,now_ts)
  on conflict(key_hash) do update
  set failed_count=case
        when public.auth_login_throttle.locked_until is not null
         and public.auth_login_throttle.locked_until > now_ts
          then public.auth_login_throttle.failed_count
        when public.auth_login_throttle.window_started_at < now_ts - interval '15 minutes'
          then 1
        else public.auth_login_throttle.failed_count + 1
      end,
      window_started_at=case
        when public.auth_login_throttle.window_started_at < now_ts - interval '15 minutes'
          then now_ts
        else public.auth_login_throttle.window_started_at
      end,
      locked_until=case
        when public.auth_login_throttle.locked_until is not null
         and public.auth_login_throttle.locked_until > now_ts
          then public.auth_login_throttle.locked_until
        when (case
          when public.auth_login_throttle.window_started_at < now_ts - interval '15 minutes'
            then 1
          else public.auth_login_throttle.failed_count + 1
        end) >= 6
          then now_ts + interval '15 minutes'
        else null
      end,
      updated_at=now_ts
  returning * into r;

  if r.locked_until is not null and r.locked_until > now_ts then
    return query select true,0,greatest(1,ceil(extract(epoch from (r.locked_until-now_ts)))::integer);
  else
    return query select false,greatest(0,6-r.failed_count),0;
  end if;
end;
$$;

create or replace function public.auth_login_gate_record_success(p_key text)
returns void
language sql security definer set search_path = public
as $$
  delete from public.auth_login_throttle where key_hash=p_key;
$$;

revoke all on function public.auth_login_gate_check(text) from public,anon,authenticated;
revoke all on function public.auth_login_gate_record_failure(text) from public,anon,authenticated;
revoke all on function public.auth_login_gate_record_success(text) from public,anon,authenticated;
grant execute on function public.auth_login_gate_check(text) to service_role;
grant execute on function public.auth_login_gate_record_failure(text) to service_role;
grant execute on function public.auth_login_gate_record_success(text) to service_role;
