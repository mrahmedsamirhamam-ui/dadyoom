-- Read-only country source-evidence summary; never certifies official TOC.
-- SECURITY INVOKER retains original row-level security on all tables.
CREATE OR REPLACE FUNCTION public.dadyoom_admin_lesson_source_audit_v1()
RETURNS TABLE (
  country_code text,
  country_name_ar text,
  published_count bigint,
  draft_count bigint,
  published_missing_source bigint,
  published_missing_pages bigint,
  published_generic_intro bigint,
  published_unresolved_ocr bigint,
  published_plan_or_catalog_links bigint
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $fn$
  SELECT co.code, co.name_ar,
    count(l.id) FILTER (WHERE l.status = 'published'),
    count(l.id) FILTER (WHERE l.status = 'draft'),
    count(l.id) FILTER (WHERE l.status = 'published' AND
      (nullif(btrim(l.source_pdf_url), '') IS NULL OR l.source_pdf_url NOT LIKE 'https://%')),
    count(l.id) FILTER (WHERE l.status = 'published' AND
      (l.source_page_start IS NULL OR l.source_page_end IS NULL OR
       l.source_page_start < 1 OR l.source_page_end < l.source_page_start)),
    count(l.id) FILTER (WHERE l.status = 'published' AND
      l.content LIKE 'يتناول هذا الدرس موضوع «%'),
    count(l.id) FILTER (WHERE l.status = 'published' AND
      l.content LIKE '%مدخل OCR غير محسوم%'),
    count(l.id) FILTER (WHERE l.status = 'published' AND
      (l.source_pdf_url ILIKE '%/manual/plans%' OR l.source_pdf_url ILIKE '%/manual/books%'))
  FROM public.countries co
  LEFT JOIN public.curricula cu ON cu.country_id = co.id
  LEFT JOIN public.grades gr ON gr.curriculum_id = cu.id
  LEFT JOIN public.units un ON un.grade_id = gr.id
  LEFT JOIN public.lessons l ON l.unit_id = un.id
  WHERE EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid())
      AND lower(btrim(p.role)) = 'admin'
  )
  GROUP BY co.code, co.name_ar
  ORDER BY co.name_ar;
$fn$;

REVOKE ALL ON FUNCTION public.dadyoom_admin_lesson_source_audit_v1() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dadyoom_admin_lesson_source_audit_v1() FROM anon;
GRANT EXECUTE ON FUNCTION public.dadyoom_admin_lesson_source_audit_v1() TO authenticated;
