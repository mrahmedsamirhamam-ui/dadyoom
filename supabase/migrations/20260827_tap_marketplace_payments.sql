-- Keep this file in Git. The equivalent migration was already applied to the connected Supabase project.

alter table public.edu_payment_orders
  drop constraint if exists edu_payment_orders_provider_check;

alter table public.edu_payment_orders
  add constraint edu_payment_orders_provider_check
  check (
    provider = any (
      array[
        'paypal'::text,
        'bank'::text,
        'tap'::text
      ]
    )
  );

alter table public.edu_subscriptions
  drop constraint if exists edu_subscriptions_provider_check;

alter table public.edu_subscriptions
  add constraint edu_subscriptions_provider_check
  check (
    provider = any (
      array[
        'paypal'::text,
        'bank'::text,
        'manual'::text,
        'tap'::text
      ]
    )
  );

alter table public.edu_payment_orders
  add column if not exists payment_method text;

alter table public.edu_payment_orders
  drop constraint if exists edu_payment_orders_payment_method_check;

alter table public.edu_payment_orders
  add constraint edu_payment_orders_payment_method_check
  check (
    payment_method is null
    or payment_method = any (
      array[
        'visa'::text,
        'mastercard'::text,
        'amex'::text,
        'benefit'::text,
        'benefitpay'::text,
        'applepay'::text,
        'googlepay'::text,
        'paypal'::text,
        'bank'::text
      ]
    )
  );

create table if not exists public.edu_teacher_payout_routing (
  teacher_id uuid primary key
    references auth.users(id)
    on delete cascade,
  tap_business_id text,
  tap_destination_id text,
  onboarding_status text not null
    default 'not_started'
    check (
      onboarding_status = any (
        array[
          'not_started'::text,
          'pending'::text,
          'approved'::text,
          'rejected'::text,
          'suspended'::text
        ]
      )
    ),
  payout_enabled boolean not null default false,
  last_payout_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.edu_teacher_payout_routing
  enable row level security;

drop policy if exists teacher_payout_routing_admin_all
  on public.edu_teacher_payout_routing;

create policy teacher_payout_routing_admin_all
  on public.edu_teacher_payout_routing
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

create or replace function public.protect_teacher_payout_verification()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' then
    if tg_op = 'INSERT' then
      new.is_verified := false;
    else
      new.is_verified := old.is_verified;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_teacher_payout_verification
  on public.edu_teacher_payout_profiles;

create trigger trg_protect_teacher_payout_verification
before insert or update
on public.edu_teacher_payout_profiles
for each row
execute function public.protect_teacher_payout_verification();
