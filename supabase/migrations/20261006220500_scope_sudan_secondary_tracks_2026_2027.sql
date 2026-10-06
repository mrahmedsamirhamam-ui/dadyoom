
update public.secondary_tracks
set grades=array[11,12]::integer[],
    lesson_coverage='partial-detailed-grade-scoped',
    source_urls=(
      select jsonb_agg(distinct value)
      from jsonb_array_elements(
        coalesce(source_urls,'[]'::jsonb) ||
        '[
          "https://gmoe.gov.sd/?page_id=2251",
          "https://gmoe.gov.sd/wp-content/uploads/2025/08/%D8%AF%D9%84%D9%8A%D9%84-%D8%A7%D9%85%D8%AA%D8%AD%D8%A7%D9%86%D8%A7%D8%AA-%D8%A7%D9%84%D8%B4%D9%87%D8%A7%D8%AF%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%88%D9%8A%D8%A9-2025%D9%85.pdf"
        ]'::jsonb
      )
    ),
    updated_at=now()
where country_code='SD'
  and academic_year='2026-2027'
  and track_name_ar in ('المساق العلمي','المساق الأدبي');

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       'Sudan current Grade 10 curriculum is published as a common first-secondary syllabus; scientific/literary certificate tracks are scoped to Grades 11-12.'
from public.secondary_tracks st
join public.countries c on c.code='SD' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية السودانية%'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'supporting',false,
       'Dadyoom core Arabic skills supporting the Sudanese secondary track.'
from public.secondary_tracks st
join public.countries c on c.code='SD' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;
