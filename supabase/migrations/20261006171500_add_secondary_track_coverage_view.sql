create or replace view public.secondary_track_coverage
with (security_invoker=true)
as
select
  st.id,
  st.country_code,
  st.country_name_ar,
  st.system_name_ar,
  st.track_name_ar,
  st.grades,
  st.status,
  st.lesson_coverage,
  st.academic_year,
  st.official_unit_scope,
  coalesce(o.official_units,0)::integer as official_units,
  coalesce(o.official_lessons,0)::integer as official_lessons,
  coalesce(o.unclassified_official_lessons,0)::integer as unclassified_official_lessons,
  coalesce(o.official_semesters,'{}'::smallint[]) as official_semesters,
  coalesce(s.supporting_lessons,0)::integer as supporting_lessons
from public.secondary_tracks st
left join lateral (
  select
    count(distinct u.id) as official_units,
    count(distinct l.id) filter (where l.status='published') as official_lessons,
    count(distinct l.id) filter (where l.status='published' and l.semester is null) as unclassified_official_lessons,
    array_remove(
      array_agg(distinct l.semester order by l.semester) filter (where l.status='published'),
      null
    )::smallint[] as official_semesters
  from public.secondary_track_curricula stc
  join public.curricula cur on cur.id=stc.curriculum_id and cur.is_active=true
  join public.grades g on g.curriculum_id=cur.id and g.grade_number>=10
  join public.units u on u.grade_id=g.id
  left join public.secondary_track_units stu
    on stu.secondary_track_id=st.id and stu.unit_id=u.id
  left join public.lessons l on l.unit_id=u.id
  where stc.secondary_track_id=st.id
    and stc.relation_type in ('official','track-specific')
    and (st.grades is null or cardinality(st.grades)=0 or g.grade_number=any(st.grades))
    and (st.official_unit_scope='all-mapped-curriculum' or stu.unit_id is not null)
) o on true
left join lateral (
  select count(distinct l.id) filter (where l.status='published') as supporting_lessons
  from public.secondary_track_curricula stc
  join public.curricula cur on cur.id=stc.curriculum_id and cur.is_active=true
  join public.grades g on g.curriculum_id=cur.id and g.grade_number>=10
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where stc.secondary_track_id=st.id
    and stc.relation_type='supporting'
    and (st.grades is null or cardinality(st.grades)=0 or g.grade_number=any(st.grades))
) s on true
where st.is_active=true;
