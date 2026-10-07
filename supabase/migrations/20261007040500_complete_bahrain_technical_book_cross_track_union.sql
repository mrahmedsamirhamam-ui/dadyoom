-- Bahrain technical/vocational Part-2 book completion by official cross-track union.
-- The admin/tech-engineering S2 plan explicitly uses the same technical/vocational
-- Arabic books (Arab 802/804/806) and proves additional book components that were
-- not scheduled in the technical track's own plan. Add those components as
-- official-book-unscheduled, never as a current 2026-2027 scheduling claim.

with target_units as (
  select g.grade_number,u.id
  from public.units u
  join public.grades g on g.id=u.grade_id
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.academic_year='2026-2027'
    and cur.name_ar='اللغة العربية — التعليم الفني والمهني — الجزء الثاني (محتوى كتاب رسمي)'
    and u.title in (
      'عرب 802 — اللغة العربية للتعليم الفني والمهني',
      'عرب 804 — اللغة العربية للتعليم الفني والمهني',
      'عرب 806 — اللغة العربية للتعليم الفني والمهني'
    )
),
extra_items(grade_number,lesson_number,sort_order,title,lesson_type,plan_page) as (
  values
  (10,901,901,'القراءة: حُلم','reading',2),
  (10,902,902,'الظواهر اللغوية: المجرد والمزيد','grammar',2),
  (10,903,903,'التواصل الشفوي: حوار تفاعلي — علاقة الإنسان بالمكان','speaking',2),
  (10,904,904,'القراءة: من أخبار أبي دلامة','reading',2),
  (10,905,905,'الظواهر اللغوية: كم الاستفهامية وكم الخبرية','grammar',2),
  (10,906,906,'الإنتاج الكتابي: مهارة إبداء الرأي','writing',2),

  (11,901,901,'الظواهر البلاغية: التشبيه — أنواعه وأدواته ووظائفه','grammar',3),
  (11,902,902,'القراءة: الكنوز الضائعة','reading',3),
  (11,903,903,'الظواهر اللغوية: طرائق التوكيد وهمزة القطع والوصل','grammar',3),

  (12,901,901,'الظواهر اللغوية: النداء والتمني','grammar',4),
  (12,902,902,'القراءة: «أغنية السعادة» لجبران خليل جبران','reading',4),
  (12,903,903,'الظواهر اللغوية: معاني حروف الجر','grammar',4)
)
insert into public.lessons(
  unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
  source_pdf_url,source_page_start,source_page_end,status,is_free,
  estimated_minutes,semester,official_content_scope
)
select
  tu.id,
  ei.title,
  ei.lesson_number,
  ei.sort_order,
  ei.lesson_type,
  'عنصر من نفس الكتاب الفني/المهني الرسمي، مثبت في خطة المسار الإداري والتكنولوجي-الهندسي الرسمية للفصل الثاني 2025-2026.',
  'أُضيف لاستكمال محتوى الكتاب الرسمي نفسه. لا يعني أن العنصر مجدول في خطة الفصل الثاني 2026-2027 قبل نشر الخطة الحالية.',
  'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan1.pdf',
  ei.plan_page,
  ei.plan_page,
  'published',
  true,
  45,
  2,
  'official-book-unscheduled'
from extra_items ei
join target_units tu on tu.grade_number=ei.grade_number
where not exists (
  select 1
  from public.lessons l
  where l.unit_id=tu.id
    and l.status='published'
    and l.title=ei.title
)
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
  is_free=true,
  estimated_minutes=45,
  semester=2,
  official_content_scope='official-book-unscheduled',
  updated_at=now();
