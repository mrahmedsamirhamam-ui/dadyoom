alter table public.video_generation_requests
  alter column lesson_id drop not null;

alter table public.video_generation_requests
  add column if not exists prompt_text text;

comment on column public.video_generation_requests.prompt_text is
  'Optional user-authored creative prompt for prompt-only video generation requests.';
