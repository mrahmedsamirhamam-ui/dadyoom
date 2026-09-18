-- This migration source mirrors changes already applied remotely
-- to the active Dadyoom project.

create table if not exists public.edu_live_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.edu_marketplace_courses(id) on delete cascade,
  class_id uuid references public.teacher_classes(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  room_name text not null unique,
  status text not null default 'scheduled'
    check (status in ('draft','scheduled','live','ended','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (course_id is not null or class_id is not null),
  check (ends_at is null or ends_at > starts_at)
);

create table if not exists public.edu_live_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.edu_live_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('teacher','student','assistant')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, user_id)
);

create or replace function public.edu_grant_welcome_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.edu_subscriptions (
    user_id,
    plan_id,
    status,
    provider,
    provider_subscription_id,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    created_at,
    updated_at
  ) values (
    new.id,
    'plus',
    'active',
    'manual',
    'welcome-trial:' || new.id::text,
    now(),
    now() + interval '30 days',
    true,
    now(),
    now()
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_edu_welcome_trial on auth.users;

create trigger trg_edu_welcome_trial
after insert on auth.users
for each row
execute function public.edu_grant_welcome_trial();

revoke execute
  on function public.edu_assignment_visible_to_student(uuid, uuid)
  from anon;

revoke execute
  on function public.edu_can_access_conversation(uuid, uuid)
  from anon;

revoke execute
  on function public.edu_is_class_student(uuid, uuid)
  from anon;

revoke execute
  on function public.edu_is_class_teacher(uuid, uuid)
  from anon;

revoke execute
  on function public.edu_is_school_owner(uuid, uuid)
  from anon;

revoke execute
  on function public.edu_submit_assignment(uuid, jsonb)
  from anon;

grant execute
  on function public.edu_submit_assignment(uuid, jsonb)
  to authenticated;
