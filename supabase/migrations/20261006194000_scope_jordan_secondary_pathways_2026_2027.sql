
update public.secondary_tracks
set grades=array[10,11,12]::integer[],
    lesson_coverage='partial-grade-scoped',
    source_urls=(
      select jsonb_agg(distinct value)
      from jsonb_array_elements(
        coalesce(source_urls,'[]'::jsonb) ||
        '["https://www.nccd.gov.jo/EBV4.0/Root_Storage/AR/FW/%D8%A7%D9%84%D8%A5%D8%B7%D8%A7%D8%B1_%D8%A7%D9%84%D8%B9%D8%A7%D9%85_%D9%84%D9%84%D9%85%D9%86%D8%A7%D9%87%D8%AC__%D8%A7%D9%84%D8%A3%D8%B1%D8%AF%D9%86%D9%8A%D8%A9.pdf"]'::jsonb
      )
    ),
    updated_at=now()
where country_code='JO'
  and academic_year='2026-2027'
  and is_active;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       'Jordan pathways start after Grade 9 and cover Grades 10-12; Arabic is a shared common subject across academic and BTEC pathways.'
from public.secondary_tracks st
join public.countries c on c.code='JO' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية الأردنية%'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'supporting',false,
       'Dadyoom core Arabic skills supporting the Jordanian secondary pathway.'
from public.secondary_tracks st
join public.countries c on c.code='JO' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;
