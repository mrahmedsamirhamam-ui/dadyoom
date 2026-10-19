-- Dadyoom Care - 2026-10-19
-- Existing private support_tickets table retained. No public Data API access.
alter table public.support_tickets
  drop constraint if exists support_tickets_category_check;
alter table public.support_tickets
  add constraint support_tickets_category_check
  check (category in ('general','technical','account','curriculum','teacher','school','privacy','suggestion','complaint','other'));
alter table public.support_tickets
  add column if not exists public_reply text not null default '';
alter table public.support_tickets
  drop constraint if exists support_tickets_public_reply_check;
alter table public.support_tickets
  add constraint support_tickets_public_reply_check
  check (char_length(public_reply) <= 4000);
create index if not exists support_tickets_user_created_idx
  on public.support_tickets (user_id, created_at desc) where user_id is not null;
create index if not exists support_tickets_hash_created_idx
  on public.support_tickets (submitter_hash, created_at desc);
alter table public.support_tickets enable row level security;
revoke all on table public.support_tickets from anon, authenticated;
