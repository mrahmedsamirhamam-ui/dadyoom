
-- Bahrain secondary Semester-2 book-content completion audit.
-- The 2026-2027 BooksGuide confirms the same Arabic textbooks remain current.
-- Detailed lesson unions were verified against the official 2025-2026 S2 plans
-- (Plan1 admin/tech-engineering, Plan2 religious, Plan3 technical/vocational,
-- Plan4 unified tracks). This does NOT claim the 2026-2027 S2 schedule is published.

update public.curriculum_grade_terms cgt
set
  detail_status='detailed-imported',
  audited_at=date '2026-10-07',
  notes=concat_ws(
    ' ',
    nullif(cgt.notes,''),
    'اكتمل استيراد اتحاد محتوى الكتب الرسمية الحالية للفصل الثاني. تم التحقق من عناوين الدروس من خطط الفصل الثاني الرسمية 2025-2026 مع تأكيد بقاء الكتب ضمن دليل الكتب 2026-2027. حالة النشر تبقى not-published-as-of-audit ولا تعني اعتماد جدول 2026-2027.'
  ),
  updated_at=now()
from public.curricula cur
join public.countries c on c.id=cur.country_id
where cgt.curriculum_id=cur.id
  and c.code='BH'
  and cgt.academic_year='2026-2027'
  and cgt.semester=2
  and cgt.detail_status='partial-imported'
  and cur.name_ar in (
    'اللغة العربية — التعليم الديني — الجزء الثاني (محتوى كتاب رسمي)',
    'اللغة العربية — التعليم الفني والمهني — الجزء الثاني (محتوى كتاب رسمي)',
    'اللغة العربية — المسار الإداري والتكنولوجي - الهندسي — الجزء الثاني (محتوى كتاب رسمي)',
    'اللغة العربية — توحيد المسارات — الجزء الثاني (محتوى كتاب رسمي)'
  );
