insert into public.secondary_track_terms (
  secondary_track_id,
  academic_year,
  semester,
  publication_status,
  detail_status,
  source_url,
  audited_at,
  notes
)
select
  cov.id,
  cov.academic_year,
  s.semester,
  'published',
  case
    when cov.lesson_coverage ilike '%detailed%'
         and cov.unclassified_official_lessons=0
      then 'detailed-imported'
    else 'partial-imported'
  end,
  case
    when jsonb_typeof(st.source_urls)='array'
         and jsonb_array_length(st.source_urls)>0
      then st.source_urls->>0
    else null
  end,
  date '2026-10-06',
  'Term status derived only from verified imported official semester-tagged coverage; no missing lesson titles are inferred.'
from public.secondary_track_coverage cov
join public.secondary_tracks st on st.id=cov.id
cross join lateral unnest(cov.official_semesters) as s(semester)
where cov.academic_year='2026-2027'
  and cov.official_lessons>0
on conflict (secondary_track_id,academic_year,semester)
do update set
  publication_status=excluded.publication_status,
  detail_status=case
    when public.secondary_track_terms.detail_status='detailed-imported'
      then public.secondary_track_terms.detail_status
    else excluded.detail_status
  end,
  source_url=coalesce(public.secondary_track_terms.source_url,excluded.source_url),
  audited_at=excluded.audited_at,
  notes=case
    when public.secondary_track_terms.notes ilike '%Bahrain Edunet%'
      then public.secondary_track_terms.notes
    else excluded.notes
  end,
  updated_at=now();

insert into public.secondary_track_terms (
  secondary_track_id,academic_year,semester,publication_status,detail_status,
  source_url,audited_at,notes
)
select
  st.id,
  '2026-2027',
  s.semester,
  'published',
  'published-pending-extraction',
  case
    when jsonb_typeof(st.source_urls)='array' and jsonb_array_length(st.source_urls)>0
      then st.source_urls->>0
    else 'https://www.moe.gov.ae/'
  end,
  date '2026-10-06',
  'UAE official 2026-2027 Arabic structure verifies Terms 1, 2 and 3 for secondary grades; detailed track-specific lesson titles remain pending official extraction.'
from public.secondary_tracks st
cross join (values (1),(2),(3)) as s(semester)
where st.country_code='AE'
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
