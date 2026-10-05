-- Complete curriculum links after grade-scope refinements and add shared detailed grade-level corpora.

insert into public.secondary_track_curricula (
  secondary_track_id, curriculum_id, relation_type, is_default, notes
)
select st.id, cur.id, 'official', true,
       'Verified national Arabic baseline shared by this track unless a more specific official mapping exists.'
from public.secondary_tracks st
join public.countries c on c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
where st.is_active
  and (
    cur.name_ar like '%المطابقة الرسمية%'
    or (st.country_code='BH' and cur.name_ar='اللغة العربية')
  )
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id, curriculum_id, relation_type, is_default, notes
)
select st.id, cur.id, 'supporting', false,
       'Dadyoom core skill lessons; supporting content, not a claim of official track specificity.'
from public.secondary_tracks st
join public.countries c on c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id, curriculum_id, relation_type, is_default, notes
)
select st.id,cur.id,'official',false,
       'Official Djibouti Arabic programme published by secondary level; shared across registered series.'
from public.secondary_tracks st
join public.countries c on c.code='DJ' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like 'اللغة العربية — جيبوتي — %'
where st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id, curriculum_id, relation_type, is_default, notes
)
select st.id,cur.id,'official',false,
       'Jordan Grade 11 official Arabic book is published at grade level; shared for tracks that study the national Arabic requirement.'
from public.secondary_tracks st
join public.countries c on c.code='JO' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%الأردن — الصف الحادي عشر — الفصل الأول الرسمي التفصيلي%'
where st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id, curriculum_id, relation_type, is_default, notes
)
select st.id,cur.id,'official',false,
       'Oman Grade 12 Al-Muunis official Arabic content published at grade level.'
from public.secondary_tracks st
join public.countries c on c.code='OM' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%الصف الثاني عشر — المؤنس — الفصل الثاني%'
where st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',notes=excluded.notes;
