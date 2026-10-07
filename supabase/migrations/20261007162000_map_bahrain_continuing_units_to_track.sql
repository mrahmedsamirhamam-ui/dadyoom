-- Scope Bahrain continuing-education track to the six imported non-standard S1 units.
-- Keep official_unit_scope='mapped-only' so generic secondary Arabic units cannot leak in.

insert into public.secondary_track_units(
  secondary_track_id,unit_id,relation_type,notes
)
select
  st.id,
  u.id,
  'official',
  'Official Bahrain continuing-education Arabic S1 unit from Plan6 2026-2027.'
from public.secondary_tracks st
join public.countries c
  on c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.academic_year=st.academic_year
join public.grades g
  on g.curriculum_id=cur.id
 and g.grade_number is null
join public.units u
  on u.grade_id=g.id
 and u.semester=1
where st.country_code='BH'
  and st.academic_year='2026-2027'
  and st.track_name_ar='التعليم المستمر'
  and cur.name_ar='اللغة العربية — التعليم المستمر'
on conflict (secondary_track_id,unit_id)
do update set
  relation_type='official',
  notes=excluded.notes;
