create table if not exists public.video_generation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  attempted_providers text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours')
);

alter table public.video_generation_requests enable row level security;

create index if not exists video_generation_requests_user_created_idx
  on public.video_generation_requests (user_id, created_at desc);

create index if not exists video_generation_requests_expires_idx
  on public.video_generation_requests (expires_at);

comment on table public.video_generation_requests is
  'Server-only logical video generation requests so provider failover consumes student quota once.';
