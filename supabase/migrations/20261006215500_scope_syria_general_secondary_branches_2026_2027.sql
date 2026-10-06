
update public.secondary_tracks
set grades=array[10,11,12]::integer[],
    lesson_coverage='book-level-general-branch-grade-scoped',
    source_urls=(
      select jsonb_agg(distinct value)
      from jsonb_array_elements(
        coalesce(source_urls,'[]'::jsonb) ||
        '["https://moed.gov.sy/news/11233"]'::jsonb
      )
    ),
    updated_at=now()
where country_code='SY'
  and academic_year='2026-2027'
  and track_name_ar in ('الفرع العلمي','الفرع الأدبي');

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       'Syria general secondary scientific/literary branches are represented across Grades 10-12; current-year textbook supply is verified, while lesson-level Arabic detail stays at the verified book scope.'
from public.secondary_tracks st
join public.countries c on c.code='SY' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية السورية%'
where st.academic_year='2026-2027'
  and st.track_name_ar in ('الفرع العلمي','الفرع الأدبي')
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'supporting',false,
       'Dadyoom core Arabic skills supporting Syrian general secondary.'
from public.secondary_tracks st
join public.countries c on c.code='SY' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.academic_year='2026-2027'
  and st.track_name_ar in ('الفرع العلمي','الفرع الأدبي')
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;
