create table if not exists public.video_provider_health (
  provider text primary key,
  consecutive_failures integer not null default 0,
  disabled_until timestamptz,
  last_error_code text,
  last_error_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.video_provider_health enable row level security;

comment on table public.video_provider_health is
  'Server-only cooldown registry for Dadyoom cinematic video provider failover.';

create index if not exists video_provider_health_disabled_until_idx
  on public.video_provider_health (disabled_until);
