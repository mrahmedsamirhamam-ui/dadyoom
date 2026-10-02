alter table public.edu_teacher_payout_profiles
  add column if not exists bpay_mobile text,
  add column if not exists bpay_name text;

alter table public.edu_payment_orders
  drop constraint if exists edu_payment_orders_provider_check;

alter table public.edu_payment_orders
  add constraint edu_payment_orders_provider_check
  check (provider = any (array['tap'::text,'paymob'::text,'paddle'::text,'bpay'::text]));

alter table public.edu_payment_orders
  drop constraint if exists edu_payment_orders_payment_method_check;

alter table public.edu_payment_orders
  add constraint edu_payment_orders_payment_method_check
  check (
    payment_method is null
    or payment_method = any (
      array['visa'::text,'mastercard'::text,'bpay_p2p'::text]
    )
  );
