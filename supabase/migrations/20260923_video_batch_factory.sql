create table if not exists public.video_batch_jobs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid references auth.users(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete cascade,
  country_code text,
  prompt_text text not null,
  narration_text text,
  target_duration_seconds integer not null default 30
    check (target_duration_seconds between 30 and 60),
  scene_seconds integer not null default 6
    check (scene_seconds between 4 and 10),
  scene_count integer not null default 5
    check (scene_count between 3 and 12),
  profile text not null default 'volume'
    check (profile in ('volume','quality')),
  model_key text not null default 'cogvideox-2b',
  status text not null default 'queued'
    check (status in ('queued','claimed','rendering','uploading','completed','failed','cancelled')),
  priority integer not null default 100
    check (priority between 0 and 999),
  attempts integer not null default 0
    check (attempts >= 0),
  worker_id text,
  benchmark_batch uuid,
  output_path text,
  output_url text,
  output_duration_seconds numeric,
  render_seconds numeric,
  gpu_seconds numeric,
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  claimed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.video_batch_jobs enable row level security;

comment on table public.video_batch_jobs is
  'Server-only queue for 30-60 second Dadyoom curriculum videos rendered by external batch GPU workers such as Kaggle.';

create index if not exists video_batch_jobs_status_priority_idx
  on public.video_batch_jobs (status, priority, created_at);

create index if not exists video_batch_jobs_lesson_idx
  on public.video_batch_jobs (lesson_id);

create index if not exists video_batch_jobs_benchmark_idx
  on public.video_batch_jobs (benchmark_batch, status);

create index if not exists video_batch_jobs_created_idx
  on public.video_batch_jobs (created_at desc);

create or replace function public.claim_video_batch_job(
  p_worker_id text
)
returns setof public.video_batch_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidate as (
    select id
    from public.video_batch_jobs
    where status = 'queued'
    order by priority asc, created_at asc
    for update skip locked
    limit 1
  )
  update public.video_batch_jobs j
  set
    status = 'claimed',
    worker_id = nullif(trim(p_worker_id), ''),
    claimed_at = now(),
    attempts = attempts + 1,
    updated_at = now(),
    error_code = null,
    error_message = null
  from candidate
  where j.id = candidate.id
  returning j.*;
end;
$$;

revoke all on function public.claim_video_batch_job(text)
  from public, anon, authenticated;
grant execute on function public.claim_video_batch_job(text)
  to service_role;

revoke all on public.video_batch_jobs
  from anon, authenticated;
grant all on public.video_batch_jobs
  to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'generated-curriculum-videos',
  'generated-curriculum-videos',
  true,
  524288000,
  array['video/mp4']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
