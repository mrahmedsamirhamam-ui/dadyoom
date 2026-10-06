create table if not exists public.secondary_track_terms (
  id uuid primary key default gen_random_uuid(),
  secondary_track_id uuid not null references public.secondary_tracks(id) on delete cascade,
  academic_year text not null,
  semester smallint not null check (semester between 1 and 3),
  publication_status text not null check (
    publication_status in ('published','not-published-as-of-audit','unknown')
  ),
  detail_status text not null check (
    detail_status in ('detailed-imported','partial-imported','published-pending-extraction','not-available-current-year','unknown')
  ),
  source_url text,
  audited_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(secondary_track_id,academic_year,semester)
);

alter table public.secondary_track_terms enable row level security;

drop policy if exists "secondary_track_terms_public_read" on public.secondary_track_terms;
create policy "secondary_track_terms_public_read"
on public.secondary_track_terms
for select
using (true);

create index if not exists secondary_track_terms_track_year_idx
on public.secondary_track_terms(secondary_track_id,academic_year,semester);

insert into public.secondary_track_terms (
  secondary_track_id,academic_year,semester,publication_status,detail_status,
  source_url,audited_at,notes
)
select
  st.id,'2026-2027',1,'published',
  case
    when st.track_name_ar='توحيد المسارات' then 'detailed-imported'
    when st.track_name_ar='التعليم الديني' then 'partial-imported'
    else 'published-pending-extraction'
  end,
  case
    when st.track_name_ar='توحيد المسارات' then 'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan2.pdf'
    when st.track_name_ar='التعليم الديني' then 'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan4.pdf'
    when st.track_name_ar='التعليم المستمر' then 'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan6.pdf'
    else 'https://edunet.bh/Econtent/LessonsGuide'
  end,
  date '2026-10-06',
  'Current Bahrain Edunet lessons guide lists this Arabic scope for semester 1 of 2026-2027.'
from public.secondary_tracks st
where st.country_code='BH'
  and st.academic_year='2026-2027'
  and st.is_active
on conflict (secondary_track_id,academic_year,semester)
do update set
  publication_status=excluded.publication_status,
  detail_status=excluded.detail_status,
  source_url=excluded.source_url,
  audited_at=excluded.audited_at,
  notes=excluded.notes,
  updated_at=now();

insert into public.secondary_track_terms (
  secondary_track_id,academic_year,semester,publication_status,detail_status,
  source_url,audited_at,notes
)
select
  st.id,'2026-2027',2,'not-published-as-of-audit','not-available-current-year',
  'https://edunet.bh/Econtent/LessonsGuide',
  date '2026-10-06',
  'No current 2026-2027 semester-2 Arabic plan was listed in the Ministry lessons guide at audit time; prior-year semester-2 plans are historical only.'
from public.secondary_tracks st
where st.country_code='BH'
  and st.academic_year='2026-2027'
  and st.is_active
on conflict (secondary_track_id,academic_year,semester)
do update set
  publication_status=excluded.publication_status,
  detail_status=excluded.detail_status,
  source_url=excluded.source_url,
  audited_at=excluded.audited_at,
  notes=excluded.notes,
  updated_at=now();
