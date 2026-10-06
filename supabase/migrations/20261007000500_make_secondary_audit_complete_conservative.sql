-- Make the secondary audit COMPLETE state deliberately conservative.
-- Book-level, generic, bundle, partial and pending coverage can never be COMPLETE
-- merely because a term row says detailed-imported.

create or replace view public.secondary_track_audit_report
with (security_invoker = true)
as
select
  st.id as secondary_track_id,
  st.country_code,
  st.country_name_ar as country,
  st.system_name_ar as system,
  g.grade,
  st.track_name_ar as track,
  st.academic_year,
  cov.official_semesters,
  (
    select count(distinct stc.curriculum_id)::integer
    from public.secondary_track_curricula stc
    where stc.secondary_track_id = st.id
      and stc.relation_type in ('official','track-specific')
  ) as official_curricula,
  cov.official_units,
  cov.official_lessons,
  cov.supporting_lessons,
  cov.unclassified_official_lessons as unclassified_lessons,
  coalesce(src.source_urls, '{}'::text[]) as source_urls,
  st.last_audited_date,
  case
    when st.lesson_coverage = 'current-detailed-source-nonstandard-levels'
      then 'PARTIAL'
    when coalesce(cov.official_units,0) = 0
      or coalesce(cov.official_lessons,0) = 0
      then 'PENDING OFFICIAL SOURCE'
    when coalesce(cov.unclassified_official_lessons,0) > 0
      then 'PARTIAL'
    when exists (
      select 1
      from public.secondary_track_terms t
      where t.secondary_track_id = st.id
        and t.academic_year = st.academic_year
        and t.publication_status = 'published'
        and t.detail_status <> 'detailed-imported'
    )
      then 'PARTIAL'
    when st.lesson_coverage in ('detailed-current-semester-1','detailed')
      and exists (
        select 1
        from public.secondary_track_terms t
        where t.secondary_track_id = st.id
          and t.academic_year = st.academic_year
          and t.publication_status = 'published'
          and t.detail_status = 'detailed-imported'
      )
      then 'COMPLETE'
    else 'PARTIAL'
  end as audit_status,
  st.lesson_coverage
from public.secondary_tracks st
join public.secondary_track_coverage cov
  on cov.id = st.id
cross join lateral (
  select grade
  from unnest(
    case
      when coalesce(cardinality(st.grades),0) > 0 then st.grades
      else array[null]::integer[]
    end
  ) as grade
) g
left join lateral (
  select array_agg(distinct source_url order by source_url) as source_urls
  from (
    select jsonb_array_elements_text(
      case
        when jsonb_typeof(st.source_urls) = 'array' then st.source_urls
        else '[]'::jsonb
      end
    ) as source_url
    union all
    select t.source_url
    from public.secondary_track_terms t
    where t.secondary_track_id = st.id
      and t.academic_year = st.academic_year
      and t.source_url is not null
  ) urls
  where nullif(trim(source_url),'') is not null
) src on true
where st.is_active;

grant select on public.secondary_track_audit_report to anon, authenticated;
