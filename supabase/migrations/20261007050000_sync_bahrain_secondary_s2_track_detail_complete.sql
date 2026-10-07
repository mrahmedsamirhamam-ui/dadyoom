-- Bahrain secondary S2: synchronize track-level detail state with the
-- now-complete official-book curricula. This does NOT alter publication state:
-- the current 2026-2027 S2 teaching plan remains not-published-as-of-audit.

update public.secondary_track_grade_terms gt
set detail_status='detailed-imported',
    audited_at=date '2026-10-07',
    notes=concat_ws(
      ' ',
      nullif(gt.notes,''),
      'اكتمل استيراد تفاصيل كتب الجزء الثاني الرسمية المرتبطة بهذا الصف/المسار. تظل حالة النشر not-published-as-of-audit حتى تصدر خطة الفصل الثاني 2026-2027.'
    ),
    updated_at=now()
from public.secondary_tracks st
where gt.secondary_track_id=st.id
  and st.country_code='BH'
  and st.academic_year='2026-2027'
  and st.track_name_ar in (
    'توحيد المسارات',
    'التعليم الفني والمهني',
    'التعليم الديني',
    'المسار الإداري والتكنولوجي - الهندسي'
  )
  and gt.academic_year='2026-2027'
  and gt.semester=2
  and gt.publication_status='not-published-as-of-audit'
  and gt.detail_status='partial-imported';

update public.secondary_track_terms t
set detail_status='detailed-imported',
    audited_at=date '2026-10-07',
    notes=concat_ws(
      ' ',
      nullif(t.notes,''),
      'اكتمل استيراد تفاصيل كتب الجزء الثاني الرسمية للمسار. لا يعني ذلك نشر خطة الفصل الثاني 2026-2027.'
    ),
    updated_at=now()
from public.secondary_tracks st
where t.secondary_track_id=st.id
  and st.country_code='BH'
  and st.academic_year='2026-2027'
  and st.track_name_ar in (
    'توحيد المسارات',
    'التعليم الفني والمهني',
    'التعليم الديني',
    'المسار الإداري والتكنولوجي - الهندسي'
  )
  and t.academic_year='2026-2027'
  and t.semester=2
  and t.publication_status='not-published-as-of-audit'
  and t.detail_status='partial-imported';
