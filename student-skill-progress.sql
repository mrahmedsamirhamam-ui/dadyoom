create table if not exists public.student_skill_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill text not null check (
    skill in (
      'reading',
      'writing',
      'listening',
      'speaking'
    )
  ),
  latest_score integer not null default 0 check (
    latest_score between 0 and 100
  ),
  best_score integer not null default 0 check (
    best_score between 0 and 100
  ),
  attempts integer not null default 0,
  xp integer not null default 0,
  level text not null default 'مبتدئ',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (
    user_id,
    skill
  )
);

alter table public.student_skill_progress
enable row level security;

drop policy if exists
  "students read own skill progress"
on public.student_skill_progress;

create policy
  "students read own skill progress"
on public.student_skill_progress
for select
using (
  auth.uid() = user_id
);

drop policy if exists
  "students insert own skill progress"
on public.student_skill_progress;

create policy
  "students insert own skill progress"
on public.student_skill_progress
for insert
with check (
  auth.uid() = user_id
);

drop policy if exists
  "students update own skill progress"
on public.student_skill_progress;

create policy
  "students update own skill progress"
on public.student_skill_progress
for update
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

create index if not exists
  student_skill_progress_user_id_idx
on public.student_skill_progress (
  user_id
);
