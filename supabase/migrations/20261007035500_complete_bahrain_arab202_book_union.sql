-- Bahrain Arab 202 / الأدب والحياة:
-- Add verified book texts that appear in the same official book in other
-- Ministry track plans but were not present in the unified-track S2 schedule.
-- These are book content only; current 2026-2027 S2 schedule remains unpublished.

with target_unit as (
  select u.id
  from public.units u
  join public.grades g on g.id=u.grade_id
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية — توحيد المسارات — الجزء الثاني (محتوى كتاب رسمي)'
    and cur.academic_year='2026-2027'
    and g.grade_number=11
    and u.title='عرب 202 — الأدب والحياة'
  limit 1
),
extra_items(lesson_number,sort_order,title,lesson_type,summary,source_url,plan_page,book_start,book_end) as (
  values
  (
    901,901,'الطبع والتطبع — ابن عبد ربه','reading',
    'نص مثبت رسميًا داخل كتاب عرب 202 (الأدب والحياة) في خطة التعليم الديني/الفني، رغم عدم إدراجه في خطة توحيد المسارات.',
    'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan2.pdf',5,4,23
  ),
  (
    902,902,'الفردية سوس ينخر المجتمع — خليل هنداوي','reading',
    'نص مثبت رسميًا داخل كتاب عرب 202 (الأدب والحياة) في خطة التعليم الديني/الفني، ويضاف هنا لاستكمال محتوى الكتاب لا لاعتباره مجدولًا حاليًا.',
    'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan2.pdf',5,68,76
  )
)
insert into public.lessons(
  unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
  source_pdf_url,source_page_start,source_page_end,status,is_free,semester,
  official_content_scope
)
select
  tu.id,
  ei.title,
  ei.lesson_number,
  ei.sort_order,
  ei.lesson_type,
  ei.summary,
  'محتوى كتاب رسمي مثبت من مصدر وزارة التربية والتعليم. أُضيف لاستكمال فهرس الكتاب، ولا يعني أنه مقرر في جدول الفصل الثاني 2026-2027 قبل نشر الخطة الحالية.',
  ei.source_url,
  ei.plan_page,
  ei.plan_page,
  'published',
  true,
  2,
  'official-book-unscheduled'
from target_unit tu
cross join extra_items ei
on conflict (unit_id,lesson_number)
do update set
  title=excluded.title,
  sort_order=excluded.sort_order,
  lesson_type=excluded.lesson_type,
  summary=excluded.summary,
  content=excluded.content,
  source_pdf_url=excluded.source_pdf_url,
  source_page_start=excluded.source_page_start,
  source_page_end=excluded.source_page_end,
  status='published',
  semester=2,
  official_content_scope='official-book-unscheduled',
  updated_at=now();
