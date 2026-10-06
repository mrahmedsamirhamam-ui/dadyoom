
update public.secondary_tracks
set grades=case
      when track_name_ar in ('المسار العلمي','مسار الآداب والإنسانيات','المسار التكنولوجي')
        then array[11,12]::integer[]
      when track_name_ar='المسار الموازي'
        then array[10,11,12]::integer[]
      else array[10,11,12]::integer[]
    end,
    lesson_coverage='generic-current-grade-scoped',
    source_urls=(
      select jsonb_agg(distinct value)
      from jsonb_array_elements(
        coalesce(source_urls,'[]'::jsonb) ||
        '[
          "https://www.edu.gov.qa/ar/Content/QatariSecondaryCertificate",
          "https://www.edu.gov.qa/ar/News/Details/17493000",
          "https://www.edu.gov.qa/ar/Content/AdultEducationParallelTrack",
          "https://www.edu.gov.qa/ar/News/Details/18921000"
        ]'::jsonb
      )
    ),
    updated_at=now()
where country_code='QA'
  and academic_year='2026-2027'
  and is_active;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       'Qatar current secondary route: general pathways are used from Grade 11 onward; parallel and specialized secondary schools cover Grades 10-12. Arabic remains aligned to ministry standards unless a distinct official Arabic source is published.'
from public.secondary_tracks st
join public.countries c on c.code='QA' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية القطرية%'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'supporting',false,
       'Dadyoom core Arabic skills supporting the Qatari secondary pathway.'
from public.secondary_tracks st
join public.countries c on c.code='QA' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;
