-- PROPOSAL ONLY. NOT A PRODUCTION MIGRATION.
-- Must run only against disposable PostgreSQL database shadow_adaptive
-- with explicit rehearsal switch. Never apply against live Dadyoom.
--
-- Learner-owned adaptive steps / skill scores / mistake counters are
-- grades or progression evidence, not browser-editable preference fields.
-- Student SELECT through existing RLS policies remains unchanged.
-- First-party *server* writers must be migrated and Preview tested before
-- any separately reviewed production GRANT cutover.
DO $guard$
BEGIN
  IF current_database() <> 'shadow_adaptive'
     OR current_setting('dadyoom.adaptive_rehearsal',true) IS DISTINCT FROM 'enabled'
  THEN
    RAISE EXCEPTION 'PRODUCTION_ADAPTIVE_REVOKE_BLOCKED_DISPOSABLE_TEST_ONLY';
  END IF;
END
$guard$;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  public.adaptive_learning_steps,
  public.student_skills,
  public.student_mistakes
FROM anon, authenticated;

-- Keep SELECT and row ownership RLS. The trusted service_role is untouched.
-- No rows or auth accounts are modified.
