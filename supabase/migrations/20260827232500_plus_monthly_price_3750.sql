-- Dadyoom Plus: monthly only; price target stays below USD 10.
-- Production was already updated to 3.750 BHD before this local patch.
update public.edu_subscription_plans
set monthly_price = 3.750, currency = 'BHD', updated_at = now()
where id = 'plus';
