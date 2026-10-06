
update public.secondary_tracks
set grades=array[11,12]::integer[],
    lesson_coverage='generic-or-partial-grade-scoped',
    source_urls=(
      select jsonb_agg(distinct value)
      from jsonb_array_elements(
        coalesce(source_urls,'[]'::jsonb) ||
        '[
          "https://moe.gov.eg/ar/what-s-on/news/house-of-rep-3/",
          "https://moe.gov.eg/ar/what-s-on/news/bacca-1/%5C"
        ]'::jsonb
      )
    ),
    updated_at=now()
where country_code='EG'
  and academic_year='2026-2027'
  and track_name_ar in ('الطب وعلوم الحياة','الهندسة وعلوم الحاسب','الأعمال','الآداب والفنون');

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       'Egyptian Baccalaureate Grade 10 is preparatory/common; the four specialization tracks begin in Grades 11-12. Arabic remains a common core subject across all tracks.'
from public.secondary_tracks st
join public.countries c on c.code='EG' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية المصرية%'
where st.academic_year='2026-2027'
  and st.track_name_ar in ('الطب وعلوم الحياة','الهندسة وعلوم الحاسب','الأعمال','الآداب والفنون')
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'supporting',false,
       'Dadyoom core Arabic skills supporting the Egyptian Baccalaureate track.'
from public.secondary_tracks st
join public.countries c on c.code='EG' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.academic_year='2026-2027'
  and st.track_name_ar in ('الطب وعلوم الحياة','الهندسة وعلوم الحاسب','الأعمال','الآداب والفنون')
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;
