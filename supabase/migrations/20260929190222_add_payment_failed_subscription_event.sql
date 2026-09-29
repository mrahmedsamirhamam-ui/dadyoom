alter table public.edu_subscription_events
  drop constraint if exists edu_subscription_events_action_check;

alter table public.edu_subscription_events
  add constraint edu_subscription_events_action_check
  check (
    action = any (
      array[
        'admin_grant'::text,
        'admin_extend'::text,
        'admin_cancel'::text,
        'payment_activated'::text,
        'payment_cancelled'::text,
        'payment_refunded'::text,
        'payment_failed'::text
      ]
    )
  );
