-- Applied on 2026-10-15 to Dadyoom's primary Supabase project via
-- add_dadyoom_support_tickets_private. Private data, no direct user-table API.
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid null references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) between 5 and 254),
  category text not null check (category in ('general','technical','account','curriculum','teacher','school','privacy','suggestion','other')),
  user_role text not null default 'visitor' check (user_role in ('visitor','student','child','teacher','parent','school','admin','other')),
  subject text not null check (char_length(subject) between 5 and 160),
  message text not null check (char_length(message) between 15 and 4000),
  page_url text null check (page_url is null or char_length(page_url) <= 500),
  status text not null default 'new' check (status in ('new','in_progress','resolved')),
  admin_note text not null default '' check (char_length(admin_note) <= 2000),
  submitter_hash text not null check (char_length(submitter_hash) = 64)
);
create index if not exists support_tickets_created_at_idx on public.support_tickets (created_at desc);
create index if not exists support_tickets_status_created_at_idx on public.support_tickets (status, created_at desc);
create index if not exists support_tickets_throttle_idx on public.support_tickets (submitter_hash, created_at desc);
alter table public.support_tickets enable row level security;
-- Intentionally no direct client RLS policy. All operations require service role
-- on the server AND application-level admin role checks for reading/updating.
revoke all on table public.support_tickets from public, anon, authenticated;
grant select, insert, update on table public.support_tickets to service_role;
comment on table public.support_tickets is
  'Private Dadyoom contact/support requests. Access only via server routes and protected admin UI.';
