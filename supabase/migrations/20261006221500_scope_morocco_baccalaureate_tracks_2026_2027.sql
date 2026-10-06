
update public.secondary_tracks
set grades=array[11,12]::integer[],
    lesson_coverage='partial-digital-course-post-common-core',
    updated_at=now()
where country_code='MA'
  and academic_year='2026-2027'
  and is_active;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       'Morocco Grade 10 is the common-core year. Registered baccalaureate streams are exposed across Grades 11-12 as post-common-core pathways; finer year-specific substream splits remain source-level and are not invented.'
from public.secondary_tracks st
join public.countries c on c.code='MA' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية المغربية%'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'supporting',false,
       'Dadyoom core Arabic skills supporting the Moroccan baccalaureate pathway.'
from public.secondary_tracks st
join public.countries c on c.code='MA' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;
