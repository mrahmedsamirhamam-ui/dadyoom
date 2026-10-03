-- Complete Dadyoom Core support for level 13 in Tunisia and Mauritania.
-- Official curriculum bundle titles remain unchanged; this adds original supporting lessons only.

insert into public.grades (
  curriculum_id, name_ar, name_en, grade_number, sort_order, is_active
)
select
  cu.id,
  case c.code
    when 'TN' then 'السنة الرابعة ثانوي — مسار ضاديوم'
    when 'MR' then 'السنة السابعة ثانوي — مسار ضاديوم'
  end,
  'Grade 13 — Dadyoom Core',
  13, 13, true
from public.countries c
join public.curricula cu on cu.country_id = c.id
where c.code in ('TN','MR')
  and cu.name_ar ilike '%ضاديوم%'
on conflict (curriculum_id, name_ar)
do update set
  grade_number = excluded.grade_number,
  sort_order = excluded.sort_order,
  is_active = true;

with pairs as (
  select
    c.code,
    src.id as source_grade_id,
    dst.id as target_grade_id,
    case c.code
      when 'TN' then 'السنة الرابعة ثانوي'
      when 'MR' then 'السنة السابعة ثانوي'
    end as target_level
  from public.countries c
  join public.curricula cu
    on cu.country_id = c.id
   and cu.name_ar ilike '%ضاديوم%'
  join public.grades src
    on src.curriculum_id = cu.id
   and src.grade_number = 12
  join public.grades dst
    on dst.curriculum_id = cu.id
   and dst.grade_number = 13
  where c.code in ('TN','MR')
)
insert into public.units (
  grade_id, title, description, unit_number, sort_order, image_url
)
select
  p.target_grade_id,
  u.title,
  case
    when u.description is null then null
    else replace(replace(u.description, 'الصف 12', p.target_level), 'Grade 12', 'Grade 13')
  end,
  u.unit_number,
  u.sort_order,
  u.image_url
from pairs p
join public.units u on u.grade_id = p.source_grade_id
on conflict (grade_id, unit_number)
do update set
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order,
  image_url = excluded.image_url;

with lesson_pairs as (
  select
    c.code,
    case c.code
      when 'TN' then 'السنة الرابعة ثانوي'
      when 'MR' then 'السنة السابعة ثانوي'
    end as target_level,
    sl.*, tu.id as target_unit_id
  from public.countries c
  join public.curricula cu
    on cu.country_id = c.id
   and cu.name_ar ilike '%ضاديوم%'
  join public.grades sg
    on sg.curriculum_id = cu.id
   and sg.grade_number = 12
  join public.grades tg
    on tg.curriculum_id = cu.id
   and tg.grade_number = 13
  join public.units su on su.grade_id = sg.id
  join public.units tu
    on tu.grade_id = tg.id
   and tu.unit_number = su.unit_number
  join public.lessons sl on sl.unit_id = su.id
  where c.code in ('TN','MR')
)
insert into public.lessons (
  unit_id, title, slug, lesson_number, sort_order, lesson_type,
  summary, content, learning_objectives, vocabulary, instructions,
  source_pdf_url, source_page_start, source_page_end,
  status, is_free, estimated_minutes
)
select
  lp.target_unit_id,
  lp.title,
  replace(lp.slug, 'g12', 'g13'),
  lp.lesson_number,
  lp.sort_order,
  lp.lesson_type,
  case when lp.summary is null then null
       else replace(replace(lp.summary, 'الصف 12', lp.target_level), 'Grade 12', 'Grade 13') end,
  case when lp.content is null then null
       else replace(replace(lp.content, 'الصف 12', lp.target_level), 'Grade 12', 'Grade 13') end,
  replace(replace(lp.learning_objectives::text, 'الصف 12', lp.target_level), 'Grade 12', 'Grade 13')::jsonb,
  lp.vocabulary,
  lp.instructions,
  lp.source_pdf_url,
  lp.source_page_start,
  lp.source_page_end,
  'published',
  lp.is_free,
  lp.estimated_minutes
from lesson_pairs lp
on conflict (unit_id, lesson_number)
do update set
  title = excluded.title,
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  lesson_type = excluded.lesson_type,
  summary = excluded.summary,
  content = excluded.content,
  learning_objectives = excluded.learning_objectives,
  vocabulary = excluded.vocabulary,
  instructions = excluded.instructions,
  status = 'published',
  is_free = excluded.is_free,
  estimated_minutes = excluded.estimated_minutes,
  updated_at = now();

with mappings as (
  select sl.id as source_lesson_id, tl.id as target_lesson_id
  from public.countries c
  join public.curricula cu
    on cu.country_id = c.id
   and cu.name_ar ilike '%ضاديوم%'
  join public.grades sg
    on sg.curriculum_id = cu.id
   and sg.grade_number = 12
  join public.grades tg
    on tg.curriculum_id = cu.id
   and tg.grade_number = 13
  join public.units su on su.grade_id = sg.id
  join public.units tu
    on tu.grade_id = tg.id
   and tu.unit_number = su.unit_number
  join public.lessons sl on sl.unit_id = su.id
  join public.lessons tl
    on tl.unit_id = tu.id
   and tl.lesson_number = sl.lesson_number
  where c.code in ('TN','MR')
)
insert into public.questions (
  lesson_id, question_order, question, question_type,
  options, correct_answer, explanation, points
)
select
  m.target_lesson_id, q.question_order, q.question, q.question_type,
  q.options, q.correct_answer, q.explanation, q.points
from mappings m
join public.questions q on q.lesson_id = m.source_lesson_id
on conflict (lesson_id, question_order)
do update set
  question = excluded.question,
  question_type = excluded.question_type,
  options = excluded.options,
  correct_answer = excluded.correct_answer,
  explanation = excluded.explanation,
  points = excluded.points,
  updated_at = now();

with mappings as (
  select sl.id as source_lesson_id, tl.id as target_lesson_id
  from public.countries c
  join public.curricula cu
    on cu.country_id = c.id
   and cu.name_ar ilike '%ضاديوم%'
  join public.grades sg
    on sg.curriculum_id = cu.id
   and sg.grade_number = 12
  join public.grades tg
    on tg.curriculum_id = cu.id
   and tg.grade_number = 13
  join public.units su on su.grade_id = sg.id
  join public.units tu
    on tu.grade_id = tg.id
   and tu.unit_number = su.unit_number
  join public.lessons sl on sl.unit_id = su.id
  join public.lessons tl
    on tl.unit_id = tu.id
   and tl.lesson_number = sl.lesson_number
  where c.code in ('TN','MR')
)
insert into public.lesson_activities (
  lesson_id, title, activity_type, instructions, content,
  activity_order, points, is_published, section, prompt, answer, is_required
)
select
  m.target_lesson_id, a.title, a.activity_type, a.instructions, a.content,
  a.activity_order, a.points, a.is_published, a.section, a.prompt, a.answer, a.is_required
from mappings m
join public.lesson_activities a on a.lesson_id = m.source_lesson_id
where not exists (
  select 1
  from public.lesson_activities existing
  where existing.lesson_id = m.target_lesson_id
    and existing.activity_order = a.activity_order
    and existing.title = a.title
);
