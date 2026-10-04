-- One-time cleanup for stale release-gate fixtures left by cancelled QA runs.
-- Scope is intentionally limited to Dadyoom's explicit E2E naming conventions.

do $$
declare
  v_ids uuid[];
  v_emails text[];
  v_course_ids uuid[];
begin
  select
    coalesce(array_agg(id), '{}'::uuid[]),
    coalesce(array_agg(email) filter (where email is not null), '{}'::text[])
  into v_ids, v_emails
  from public.profiles
  where email like 'dadyoom.e2e.%@example.com';

  select coalesce(array_agg(id), '{}'::uuid[])
  into v_course_ids
  from public.edu_marketplace_courses
  where slug like 'e2e-%';

  if cardinality(v_course_ids) > 0 then
    delete from public.edu_payment_orders
    where course_id = any(v_course_ids);

    delete from public.edu_marketplace_courses
    where id = any(v_course_ids);
  end if;

  if cardinality(v_emails) > 0 then
    delete from public.ai_assessments where student_email = any(v_emails);
    delete from public.student_stats where student_email = any(v_emails);
    delete from public.student_skills where student_email = any(v_emails);
    delete from public.student_mistakes where student_email = any(v_emails);
    delete from public.student_assessments where student_email = any(v_emails);
    delete from public.student_achievements where student_email = any(v_emails);
    delete from public.student_streaks where student_email = any(v_emails);
    delete from public.learning_plans where student_email = any(v_emails);
    delete from public.ai_recommendations where student_email = any(v_emails);
    delete from public.student_progress where student_email = any(v_emails);
  end if;

  if cardinality(v_ids) > 0 then
    delete from public.quiz_attempts
    where student_id = any(v_ids);
  end if;

  delete from public.profiles
  where email like 'dadyoom.e2e.%@example.com';

  delete from auth.users
  where email like 'dadyoom.e2e.%@example.com';
end
$$;
