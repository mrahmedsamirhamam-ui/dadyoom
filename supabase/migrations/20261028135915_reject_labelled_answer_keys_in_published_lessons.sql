-- Applied in production as migration 20261028135915 on 2026-10-28.
-- Project: hvqsvtomhlxavmfqoxfz
-- All 4,841 previously labelled review keys were moved to RLS-protected
-- lesson_teacher_notes before enforcing this constraint.
-- This covers explicit standalone answer headings, not arbitrary prose.
ALTER TABLE public.lessons
 ADD CONSTRAINT lessons_published_content_no_labelled_answer_keys
 CHECK (
   status IS DISTINCT FROM 'published'
   OR COALESCE(content,'') !~ E'(^|\\n)[[:space:]]*(مفتاح الإجابة:|مفتاح المراجعة الذاتية:|مفتاح المراجعة ومؤشرات الاستجابة الصحيحة:|مفتاح المراجعة:|الإجابة النموذجية:)'
 ) NOT VALID;

ALTER TABLE public.lessons VALIDATE CONSTRAINT lessons_published_content_no_labelled_answer_keys;

COMMENT ON CONSTRAINT lessons_published_content_no_labelled_answer_keys
ON public.lessons IS
'Publication safeguard against five explicitly labelled answer-key line types; do not store grader/teacher keys in public lesson content.';
