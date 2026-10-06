
update public.secondary_tracks
set grades=array[9,10,11,12]::integer[],
    lesson_coverage='generic-book-bundle-grade-scoped',
    source_urls=(
      select jsonb_agg(distinct value)
      from jsonb_array_elements(
        coalesce(source_urls,'[]'::jsonb) ||
        '[
          "https://moe.gov.so/wp-content/uploads/2026/02/National-Assessment-Framework-for-Somalia-Final-1.pdf",
          "https://moe.gov.so/wp-content/uploads/2022/07/ESSP-2022-2026.pdf"
        ]'::jsonb
      )
    ),
    updated_at=now()
where country_code='SO'
  and academic_year='2026-2027'
  and track_name_ar in ('الثانوي العام','الثانوي التقني');

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       'Somalia secondary Level 2 is a four-year stage spanning Grades 9-12; this mapping preserves the current official Arabic bundle without inventing track-specific lesson titles.'
from public.secondary_tracks st
join public.countries c on c.code='SO' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية الصومالية%'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'supporting',false,
       'Dadyoom core Arabic skills supporting the Somali secondary pathway.'
from public.secondary_tracks st
join public.countries c on c.code='SO' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;
