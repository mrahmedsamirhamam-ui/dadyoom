-- Keep source control aligned with the production migration applied on 2026-09-25.
-- Existing welcome trials are grandfathered; this function affects newly-created users.

create or replace function public.edu_grant_welcome_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.edu_subscriptions (
    user_id,
    plan_id,
    status,
    provider,
    provider_subscription_id,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    grant_source,
    created_at,
    updated_at
  ) values (
    new.id,
    'plus',
    'active',
    'manual',
    'welcome-trial:' || new.id::text,
    now(),
    now() + interval '1 day',
    true,
    'welcome_trial_1d',
    now(),
    now()
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;
