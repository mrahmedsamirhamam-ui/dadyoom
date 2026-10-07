-- Bahrain grades 1-3 Part 2 book content is fully imported.
-- Keep publication_status as not-published-as-of-audit because the current
-- 2026-2027 semester-2 teaching plan is still unpublished. Only detail_status changes.

update public.curriculum_grade_terms cgt
set detail_status='detailed-imported',
    audited_at=date '2026-10-07',
    notes='Current 2026-2027 semester-2 teaching plan is not published. The complete official Part-2 book structure has been imported and is labeled official-book-unscheduled.',
    updated_at=now()
from public.curricula cur
join public.countries c on c.id=cur.country_id
where cgt.curriculum_id=cur.id
  and c.code='BH'
  and cur.name_ar='اللغة العربية'
  and cur.academic_year='2026-2027'
  and cgt.grade_number between 1 and 3
  and cgt.semester=2;
