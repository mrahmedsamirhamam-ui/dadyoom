create table if not exists public.lesson_qr_scans (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid null,
  source text not null default 'printed_qr',
  scanned_at timestamptz not null default now()
);

alter table public.lesson_qr_scans enable row level security;

create index if not exists lesson_qr_scans_lesson_scanned_idx
  on public.lesson_qr_scans (lesson_id, scanned_at desc);

create index if not exists lesson_qr_scans_user_scanned_idx
  on public.lesson_qr_scans (user_id, scanned_at desc);

comment on table public.lesson_qr_scans is
  'Server-written analytics for Dadyoom Smart QR scans. No direct anon/authenticated access.';
