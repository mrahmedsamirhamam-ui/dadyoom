create table if not exists public.lesson_videos (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.lessons(id) on delete cascade,

  provider text not null default 'youtube'
    check (provider in ('youtube')),

  video_id text not null
    check (video_id ~ '^[A-Za-z0-9_-]{6,20}$'),

  video_url text not null,
  embed_url text not null,

  title text not null,
  channel_name text,
  channel_url text,

  country_code text,
  source_tier text not null
    check (source_tier in (
      'official_country',
      'same_country',
      'cartoon_fallback',
      'manual'
    )),

  source_reason text,
  confidence numeric(5,4) not null default 0
    check (confidence >= 0 and confidence <= 1),

  duration_seconds integer,
  thumbnail_url text,
  language text,
  search_query text,

  is_official boolean not null default false,
  is_cartoon boolean not null default false,

  status text not null default 'draft'
    check (status in ('draft','published','rejected')),

  verified_at timestamptz,
  last_checked_at timestamptz not null default now(),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lesson_videos_status_idx
  on public.lesson_videos(status);

create index if not exists lesson_videos_country_idx
  on public.lesson_videos(country_code);

create index if not exists lesson_videos_tier_idx
  on public.lesson_videos(source_tier);

alter table public.lesson_videos enable row level security;

revoke all on table public.lesson_videos from anon, authenticated;
grant select on table public.lesson_videos to anon, authenticated;
grant all on table public.lesson_videos to service_role;

drop policy if exists "published lesson videos are readable"
  on public.lesson_videos;

create policy "published lesson videos are readable"
on public.lesson_videos
for select
to anon, authenticated
using (status = 'published');