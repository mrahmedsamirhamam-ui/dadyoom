create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create materialized view if not exists public.seo_indexable_lessons_fast as
select *
from public.seo_indexable_lessons
with data;

create unique index if not exists seo_indexable_lessons_fast_id_idx
  on public.seo_indexable_lessons_fast (id);

create index if not exists seo_indexable_lessons_fast_country_idx
  on public.seo_indexable_lessons_fast (
    country_code,
    grade_number,
    unit_sort_order,
    sort_order
  );

revoke all on public.seo_indexable_lessons_fast from public;
grant select on public.seo_indexable_lessons_fast
  to anon, authenticated, service_role;

do $$
begin
  if not exists (
    select 1
    from cron.job
    where jobname = 'refresh-seo-indexable-lessons-fast'
  ) then
    perform cron.schedule(
      'refresh-seo-indexable-lessons-fast',
      '*/30 * * * *',
      'refresh materialized view concurrently public.seo_indexable_lessons_fast'
    );
  end if;
end
$$;

comment on materialized view public.seo_indexable_lessons_fast is
  'Fast SEO-safe lesson index. Refreshed every 30 minutes from public.seo_indexable_lessons.';
