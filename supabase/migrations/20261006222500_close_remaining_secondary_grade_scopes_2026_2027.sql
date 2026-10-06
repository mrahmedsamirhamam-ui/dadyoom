
update public.secondary_tracks
set grades=array[12]::integer[],
    lesson_coverage='national-exam-series-terminal-grade-scoped',
    updated_at=now()
where country_code='KM'
  and academic_year='2026-2027'
  and is_active;

update public.secondary_tracks
set grades=array[10,11,12]::integer[],
    lesson_coverage='book-level-stage-scoped',
    updated_at=now()
where country_code='SY'
  and academic_year='2026-2027'
  and track_name_ar in ('التجارية','الشرعي','الصناعية','النسوية');

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       'Comoros A1/A2/A4/C/D/G/STC/STI registry entries are current national Baccalaureate series evidence, so they are scoped to the terminal Grade 12 layer rather than guessed into earlier years.'
from public.secondary_tracks st
join public.countries c on c.code='KM' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية القمرية%'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       'Syria religious and vocational secondary programs are stage-level secondary routes; Grades 10-12 are exposed while detailed grade-specific Arabic titles remain limited to verified book-level evidence.'
from public.secondary_tracks st
join public.countries c on c.code='SY' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية السورية%'
where st.academic_year='2026-2027'
  and st.track_name_ar in ('التجارية','الشرعي','الصناعية','النسوية')
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;
