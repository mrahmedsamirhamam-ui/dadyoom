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
    and not (c.code = 'LY' and l.title like '%تغطية كتابية تكاملية%')
    -- Match the source classification contract. A curriculum scope is not
    -- an individual lesson; even long descriptions must not grant SEO counts.
    and not (
      l.content like any (ARRAY[
      'هذا المحتوى من إنشاء ضاديوم لتغطية مجال%',
      'هذا المحتوى أصلي من ضاديوم ومصمم لمواءمة مجال%',
      'هذا درس أصلي من ضاديوم صُمم لتغطية الكفاية الرسمية%',
      'هذه حزمة تعليمية أصلية من ضاديوم لمواءمة معايير%',
      'تمثل هذه العقدة مجال%',
      'تمثل هذه العقدة «%',
      'يمثل هذا العنصر حزمة نواتج تعلم%',
      'محتوى ضاديوم الأصلي لمواءمة%',
      'وحدة ضاديوم أصلية لمواءمة مجال%',
      'محتوى أصلي من ضاديوم لمواءمة مجال%',
      'محتوى تعليمي أصلي من ضاديوم لمواءمة%',
      'هذا المحتوى أصلي من ضاديوم لمواءمة مجال%',
      'محتوى تعليمي أصلي من ضاديوم لمواءمة «%',
      'هذا المحتوى أصلي من ضاديوم ومصمم لمواءمة%',
      'هذه حزمة تعليمية أصلية من ضاديوم%',
      'تستخدم ضاديوم اسم الكتاب والفصل المثبتين%'
    ]::text[])
      or (
        coalesce(l.summary, '') like any (ARRAY[
      'حزمة وطنية أصلية من ضاديوم لمجال%',
      'حزمة وطنية أصلية لمواءمة العربية%',
      'حزمة وطنية أصلية من ضاديوم لمواءمة العربية%',
      'حزمة وطنية أصلية من ضاديوم للعربية%',
      'حزمة وطنية أصلية من ضاديوم لتغطية تعلم العربية%',
      'حزمة وطنية أصلية من ضاديوم لتغطية العربية%',
      'تغطية وطنية أصلية من ضاديوم لمجال%',
      'حزمة أصلية من ضاديوم لتغطية معايير%',
      'حزمة مطابقة وطنية أصلية لمقرر%',
      'تغطية تعليمية أصلية من ضاديوم للكفاية%',
      'تغطية أصلية من ضاديوم لـ%',
      'تغطية أصلية من ضاديوم لمجال%',
      'حزمة تعليمية أصلية من ضاديوم لمواءمة%'
    ]::text[])
        and not (l.content like any (ARRAY[
      'درس ضاديوم الأصلي:%',
      'حزمة ضاديوم الموضوعية المتخصصة%',
      'مسار الإتقان الأصلي — ضاديوم%',
      'مسار القراءة والفهم الأصلي — ضاديوم%'
    ]::text[]))
      )
    )
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
  '2026-10-16: public lesson SEO only; excludes Dadyoom framework scopes, book placeholders, inactive hierarchies, thin or duplicated content. Official national textbook completeness is not certified.';

-- Reuse the existing populated unique-id materialized view; never drop
-- it or recreate its indexes. CONCURRENTLY preserves reads during refresh.
refresh materialized view concurrently public.seo_indexable_lessons_fast;
