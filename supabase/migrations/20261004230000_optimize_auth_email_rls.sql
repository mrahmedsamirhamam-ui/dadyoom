-- Final Supabase RLS init-plan optimization for policies using auth.email().
alter policy "students_insert_ai_assessments"
  on public.ai_assessments
  with check (student_email = (select auth.email()));

alter policy "students_select_ai_assessments"
  on public.ai_assessments
  using (student_email = (select auth.email()));

alter policy "students_update_ai_assessments"
  on public.ai_assessments
  using (student_email = (select auth.email()));

alter policy "Users manage own achievements"
  on public.student_achievements
  using ((select auth.email()) = student_email)
  with check ((select auth.email()) = student_email);

alter policy "Users manage own streak"
  on public.student_streaks
  using ((select auth.email()) = student_email)
  with check ((select auth.email()) = student_email);
