create or replace view public.video_batch_benchmark_summary as
select
  benchmark_batch,
  min(created_at) as started_at,
  max(completed_at) as finished_at,
  count(*) as jobs_total,
  count(*) filter (where status = 'completed') as jobs_completed,
  count(*) filter (where status = 'failed') as jobs_failed,
  round(avg(gpu_seconds) filter (where status = 'completed'), 2) as avg_gpu_seconds,
  round(percentile_cont(0.5) within group (order by gpu_seconds)
    filter (where status = 'completed')::numeric, 2) as median_gpu_seconds,
  round(avg(output_duration_seconds) filter (where status = 'completed'), 2) as avg_output_seconds,
  case
    when count(*) filter (where status = 'completed') >= 3
      and percentile_cont(0.5) within group (order by gpu_seconds)
        filter (where status = 'completed') > 0
    then floor(
      (30 * 3600 * 0.75) /
      percentile_cont(0.5) within group (order by gpu_seconds)
        filter (where status = 'completed')
    )::integer
    else null
  end as estimated_safe_weekly_videos,
  case
    when count(*) filter (where status = 'completed') < 10 then 'benchmarking'
    when count(*) filter (where status = 'completed') >= 10
      and floor(
        (30 * 3600 * 0.75) /
        nullif(
          percentile_cont(0.5) within group (order by gpu_seconds)
            filter (where status = 'completed'),
          0
        )
      ) >= 50
    then 'pass'
    else 'fail'
  end as public_generation_gate
from public.video_batch_jobs
where benchmark_batch is not null
group by benchmark_batch;

revoke all on public.video_batch_benchmark_summary
  from anon, authenticated;
grant select on public.video_batch_benchmark_summary
  to service_role;

comment on view public.video_batch_benchmark_summary is
  'Benchmark gate: after 10 completed 30s+ videos, public generation passes only when conservative 30h/week capacity is at least 50 videos.';
