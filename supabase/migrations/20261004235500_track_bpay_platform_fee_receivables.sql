-- Track platform commission that is economically due when a course buyer pays
-- the teacher directly through BPay. This does NOT claim that the fee has been
-- collected; it creates an auditable receivable until a platform collection
-- channel is configured and the fee is settled.

create table if not exists public.edu_platform_fee_receivables (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.edu_marketplace_courses(id) on delete cascade,
  purchase_id uuid not null unique references public.edu_marketplace_purchases(id) on delete cascade,
  payment_order_id uuid not null unique references public.edu_payment_orders(id) on delete cascade,
  gross_amount numeric(12,3) not null check (gross_amount >= 0),
  fee_amount numeric(12,3) not null check (fee_amount >= 0),
  currency text not null,
  status text not null default 'due'
    check (status in ('due','settled','waived','reversed')),
  settlement_reference text,
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists edu_platform_fee_receivables_teacher_status_idx
  on public.edu_platform_fee_receivables(teacher_id,status,created_at desc);

alter table public.edu_platform_fee_receivables enable row level security;

drop policy if exists "Teachers and admins read platform fee receivables"
  on public.edu_platform_fee_receivables;

create policy "Teachers and admins read platform fee receivables"
  on public.edu_platform_fee_receivables
  for select
  to authenticated
  using (
    teacher_id = (select auth.uid())
    or public.is_admin()
  );

-- Backfill completed BPay course purchases, if any. The unique purchase/payment
-- keys make this idempotent and keep release-gate retries safe.
insert into public.edu_platform_fee_receivables (
  teacher_id,
  course_id,
  purchase_id,
  payment_order_id,
  gross_amount,
  fee_amount,
  currency,
  status
)
select
  e.teacher_id,
  e.course_id,
  e.purchase_id,
  o.id,
  e.gross_amount,
  e.platform_fee,
  e.currency,
  'due'
from public.edu_teacher_earnings e
join public.edu_marketplace_purchases p
  on p.id = e.purchase_id
join public.edu_payment_orders o
  on o.id = p.payment_order_id
where o.provider = 'bpay'
  and o.kind = 'course'
  and o.status = 'completed'
  and e.platform_fee > 0
on conflict (purchase_id) do update
set
  payment_order_id = excluded.payment_order_id,
  gross_amount = excluded.gross_amount,
  fee_amount = excluded.fee_amount,
  currency = excluded.currency,
  updated_at = now();
