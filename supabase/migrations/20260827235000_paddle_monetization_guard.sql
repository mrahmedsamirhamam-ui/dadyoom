-- Dadyoom monetization guard.
-- Live production equivalents were applied before this local migration file
-- was written so the repository remains reproducible.

update public.edu_subscription_plans
set
  monthly_price = 10.000,
  currency = 'USD',
  updated_at = now()
where id = 'plus';

create unique index if not exists
  edu_subscription_events_provider_event_unique_idx
on public.edu_subscription_events (provider, provider_event_id)
where provider_event_id is not null;
