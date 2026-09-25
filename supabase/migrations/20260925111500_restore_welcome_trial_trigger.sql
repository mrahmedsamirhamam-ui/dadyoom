-- Restore the one-day welcome-trial trigger if a remote repair or schema
-- recreation drops it. The trigger function itself is defined by
-- 20260925_fix_welcome_trial_to_one_day.sql.

drop trigger if exists trg_edu_welcome_trial on auth.users;

create trigger trg_edu_welcome_trial
after insert on auth.users
for each row
execute function public.edu_grant_welcome_trial();
