
update public.secondary_tracks
set grades=array[10,11,12]::integer[],
    lesson_coverage='generic-or-partial-grade-scoped',
    source_urls=(
      select jsonb_agg(distinct value)
      from jsonb_array_elements(
        coalesce(source_urls,'[]'::jsonb) ||
        '[
          "https://www.crdp.org/magazine-details1/683/1164/1161",
          "https://www.crdp.org/sites/default/files/2025-11/Connection%20to%20%20vocational%20and%20technical%20education.pdf"
        ]'::jsonb
      )
    ),
    updated_at=now()
where country_code='LB'
  and academic_year='2026-2027'
  and track_name_ar='الثانوي التقني/المهني';

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       'Lebanon technical/vocational secondary is a three-year stage after basic education; numeric Dadyoom grades map to secondary years 10-12 while detailed Arabic titles remain source-dependent.'
from public.secondary_tracks st
join public.countries c on c.code='LB' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية اللبنانية%'
where st.academic_year='2026-2027'
  and st.track_name_ar='الثانوي التقني/المهني'
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'supporting',false,
       'Dadyoom core Arabic skills supporting Lebanese technical/vocational secondary.'
from public.secondary_tracks st
join public.countries c on c.code='LB' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.academic_year='2026-2027'
  and st.track_name_ar='الثانوي التقني/المهني'
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;
