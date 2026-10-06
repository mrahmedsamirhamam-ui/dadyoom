-- Grade-aware secondary curriculum audit.
-- Unlike the track summary, every numeric grade is calculated independently.

create or replace view public.secondary_track_grade_audit_report
with (security_invoker = true)
as
select
  st.id as secondary_track_id,
  st.country_code,
  st.country_name_ar as country,
  st.system_name_ar as system,
  scoped_grade.grade,
  st.track_name_ar as track,
  st.academic_year,
  coalesce(official_stats.official_semesters, '{}'::smallint[]) as official_semesters,
  coalesce(official_stats.official_curricula, 0)::integer as official_curricula,
  coalesce(official_stats.official_units, 0)::integer as official_units,
  coalesce(official_stats.official_lessons, 0)::integer as official_lessons,
  coalesce(supporting_stats.supporting_lessons, 0)::integer as supporting_lessons,
  coalesce(official_stats.unclassified_lessons, 0)::integer as unclassified_lessons,
  coalesce(src.source_urls, '{}'::text[]) as source_urls,
  st.last_audited_date,
  case
    when st.lesson_coverage = 'current-detailed-source-nonstandard-levels'
      then 'PARTIAL'
    when scoped_grade.grade is null
      then 'PARTIAL'
    when coalesce(official_stats.official_units, 0) = 0
      or coalesce(official_stats.official_lessons, 0) = 0
      then 'PENDING OFFICIAL SOURCE'
    when coalesce(official_stats.unclassified_lessons, 0) > 0
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
    when st.lesson_coverage in ('detailed-current-semester-1', 'detailed')
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
cross join lateral (
  select grade
  from unnest(
    case
      when coalesce(cardinality(st.grades), 0) > 0 then st.grades
      else array[null]::integer[]
    end
  ) as grade
) scoped_grade
left join lateral (
  select
    count(distinct cur.id) as official_curricula,
    count(distinct u.id) as official_units,
    count(distinct l.id) filter (where l.status = 'published') as official_lessons,
    count(distinct l.id) filter (
      where l.status = 'published' and l.semester is null
    ) as unclassified_lessons,
    array_remove(
      array_agg(distinct l.semester order by l.semester)
        filter (where l.status = 'published'),
      null
    )::smallint[] as official_semesters
  from public.secondary_track_curricula stc
  join public.curricula cur
    on cur.id = stc.curriculum_id
   and cur.is_active = true
  join public.grades gr
    on gr.curriculum_id = cur.id
   and scoped_grade.grade is not null
   and gr.grade_number = scoped_grade.grade
  join public.units u
    on u.grade_id = gr.id
  left join public.secondary_track_units stu
    on stu.secondary_track_id = st.id
   and stu.unit_id = u.id
  left join public.lessons l
    on l.unit_id = u.id
  where stc.secondary_track_id = st.id
    and stc.relation_type in ('official', 'track-specific')
    and (
      st.official_unit_scope = 'all-mapped-curriculum'
      or stu.unit_id is not null
    )
) official_stats on true
left join lateral (
  select
    count(distinct l.id) filter (where l.status = 'published') as supporting_lessons
  from public.secondary_track_curricula stc
  join public.curricula cur
    on cur.id = stc.curriculum_id
   and cur.is_active = true
  join public.grades gr
    on gr.curriculum_id = cur.id
   and scoped_grade.grade is not null
   and gr.grade_number = scoped_grade.grade
  join public.units u
    on u.grade_id = gr.id
  join public.lessons l
    on l.unit_id = u.id
  where stc.secondary_track_id = st.id
    and stc.relation_type = 'supporting'
) supporting_stats on true
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
  where nullif(trim(source_url), '') is not null
) src on true
where st.is_active;

grant select on public.secondary_track_grade_audit_report to anon, authenticated;
