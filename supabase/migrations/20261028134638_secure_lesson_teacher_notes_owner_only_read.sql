-- Applied to production Dadyoom Supabase as migration 20261028134638.
-- Project hvqsvtomhlxavmfqoxfz, 2026-10-28.
-- No teacher note rows existed when this change was applied.
-- Prevent unauthorised learner reads of private teacher material.
ALTER TABLE public.lesson_teacher_notes ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.lesson_teacher_notes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.lesson_teacher_notes TO authenticated;

ALTER POLICY "Authenticated users read lesson teacher notes"
ON public.lesson_teacher_notes
TO authenticated
USING (
  (SELECT public.is_admin())
  OR EXISTS (
    SELECT 1 FROM public.lessons AS l
    WHERE l.id = lesson_teacher_notes.lesson_id
      AND l.created_by = (SELECT auth.uid())
  )
);

COMMENT ON TABLE public.lesson_teacher_notes IS
'Confidential teacher notes. Read-only for the lesson creator or an admin; student and anonymous access is denied by RLS. No client writes allowed.';
