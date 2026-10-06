create or replace view public.seo_indexable_lessons
with (security_invoker = true) as
with candidates as (
  select
    l.id,
    l.slug,
    l.title,
    l.summary,
    l.updated_at,
    l.lesson_number,
    l.sort_order,
    l.semester as lesson_semester,
    u.id as unit_id,
    u.title as unit_title,
    u.unit_number,
    u.sort_order as unit_sort_order,
    u.semester as unit_semester,
    g.id as grade_id,
    g.name_ar as grade_name,
    g.grade_number,
    cur.id as curriculum_id,
    cur.name_ar as curriculum_name,
    cur.academic_year,
    c.id as country_id,
    c.code as country_code,
    c.name_ar as country_name,
    count(*) over (
      partition by md5(
        regexp_replace(
          regexp_replace(
            lower(btrim(l.content)),
            '[0-9٠-٩]+',
            '#',
            'g'
          ),
          '\\s+',
          ' ',
          'g'
        )
      )
    ) as duplicate_content_count
  from public.lessons l
  join public.units u
    on u.id = l.unit_id
  join public.grades g
    on g.id = u.grade_id
  join public.curricula cur
    on cur.id = g.curriculum_id
  join public.countries c
    on c.id = cur.country_id
  where l.status = 'published'
    and coalesce(l.slug, '') not like '%-dadyoom-core-%'
    and length(btrim(coalesce(l.content, ''))) >= 200
    and coalesce(l.title, '') not ilike '%حزمة%'
    and coalesce(l.title, '') not ilike 'محور %'
    and coalesce(g.is_active, true)
    and coalesce(cur.is_active, true)
    and coalesce(c.is_active, true)
)
select
  id,
  slug,
  title,
  summary,
  updated_at,
  lesson_number,
  sort_order,
  lesson_semester,
  unit_id,
  unit_title,
  unit_number,
  unit_sort_order,
  unit_semester,
  grade_id,
  grade_name,
  grade_number,
  curriculum_id,
  curriculum_name,
  academic_year,
  country_id,
  country_code,
  country_name
from candidates
where duplicate_content_count = 1;

comment on view public.seo_indexable_lessons is
  'SEO-safe lesson set: excludes Dadyoom Core templates, thin content, internal bundle/axis pages, inactive hierarchy rows, and exact or number-only near-duplicate lesson content.';
