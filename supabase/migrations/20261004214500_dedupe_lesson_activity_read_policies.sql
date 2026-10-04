-- Preserve effective access while removing redundant permissive SELECT policies.
-- Anonymous users: published activities of published lessons only.
-- Authenticated users: retain the existing broad read access exactly once.

drop policy if exists "Authenticated users read lesson activities"
  on public.lesson_activities;

drop policy if exists "Authenticated users read published activities"
  on public.lesson_activities;

drop policy if exists "Public can read published lesson activities"
  on public.lesson_activities;

create policy "Anonymous users read published lesson activities"
  on public.lesson_activities
  for select
  to anon
  using (
    is_published = true
    and exists (
      select 1
      from public.lessons l
      where l.id = lesson_activities.lesson_id
        and l.status = 'published'
    )
  );
