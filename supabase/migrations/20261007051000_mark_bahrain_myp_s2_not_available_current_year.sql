-- Bahrain Grade 8 MYP Arabic S2:
-- Current Edunet LessonsGuide exposes only the 2026-2027 semester-1 Plan7.
-- Record the absence explicitly instead of leaving an ambiguous "unknown".

update public.curriculum_grade_terms cgt
set detail_status='not-available-current-year',
    publication_status='not-published-as-of-audit',
    audited_at=date '2026-10-07',
    notes='لم تنشر وزارة التربية والتعليم عبر Edunet خطة اللغة العربية (اللغة والأدب) لبرنامج MYP للصف الثامن للفصل الثاني 2026-2027 حتى آخر مراجعة. لا تُنشأ دروس أو عناوين بالافتراض.',
    updated_at=now()
from public.curricula cur
join public.countries c on c.id=cur.country_id
where cgt.curriculum_id=cur.id
  and c.code='BH'
  and cur.name_ar='اللغة العربية — اللغة والأدب — برنامج السنوات المتوسطة MYP'
  and cur.academic_year='2026-2027'
  and cgt.grade_number=8
  and cgt.academic_year='2026-2027'
  and cgt.semester=2;
