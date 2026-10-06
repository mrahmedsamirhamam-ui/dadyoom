-- Jordan: grade-specific current-year Arabic term status.
-- Grade 11 current 2026-2027 catalog exposes semester 1, but extraction is partial.
-- Grade 12 current 2026-2027 semester-1 Arabic books are fully represented by
-- the imported literature and grammar/prosody lessons. No semester-2 current-year
-- status is asserted here.

insert into public.secondary_track_grade_terms (
  secondary_track_id,grade_number,academic_year,semester,
  publication_status,detail_status,source_url,audited_at,notes
)
select
  st.id,11,'2026-2027',1,
  'published','partial-imported',
  'https://nccd.gov.jo/ar/pages/TextBooksGrade/118',
  date '2026-10-06',
  'Jordan NCCD current Grade 11 2026-2027 catalog exposes Arabic semester 1. Imported detail remains partial.'
from public.secondary_tracks st
where st.country_code='JO'
  and st.academic_year='2026-2027'
  and st.is_active
  and 11=any(st.grades)
on conflict (secondary_track_id,grade_number,academic_year,semester)
do update set
  publication_status=excluded.publication_status,
  detail_status=excluded.detail_status,
  source_url=excluded.source_url,
  audited_at=excluded.audited_at,
  notes=excluded.notes,
  updated_at=now();

insert into public.secondary_track_grade_terms (
  secondary_track_id,grade_number,academic_year,semester,
  publication_status,detail_status,source_url,audited_at,notes
)
select
  st.id,12,'2026-2027',1,
  'published','detailed-imported',
  'https://nccd.gov.jo/ar/pages/TextBooksGrade/143',
  date '2026-10-06',
  'Jordan NCCD current Grade 12 2026-2027 catalog lists Arabic literature and grammar/prosody for semester 1; all 23 imported official lessons are semester-classified.'
from public.secondary_tracks st
where st.country_code='JO'
  and st.academic_year='2026-2027'
  and st.is_active
  and 12=any(st.grades)
on conflict (secondary_track_id,grade_number,academic_year,semester)
do update set
  publication_status=excluded.publication_status,
  detail_status=excluded.detail_status,
  source_url=excluded.source_url,
  audited_at=excluded.audited_at,
  notes=excluded.notes,
  updated_at=now();
