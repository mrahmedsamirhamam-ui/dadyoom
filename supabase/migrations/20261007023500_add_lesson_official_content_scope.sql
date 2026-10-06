-- Distinguish current scheduled official lessons from verified official-book
-- content that is not (yet) published in the current-year lesson plan.
alter table public.lessons
add column if not exists official_content_scope text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname='lessons_official_content_scope_check'
      and conrelid='public.lessons'::regclass
  ) then
    alter table public.lessons
      add constraint lessons_official_content_scope_check
      check (
        official_content_scope is null
        or official_content_scope in (
          'plan-scheduled',
          'official-book-unscheduled'
        )
      );
  end if;
end $$;

create index if not exists lessons_official_content_scope_idx
on public.lessons(official_content_scope)
where official_content_scope is not null;

-- Bahrain generic official Arabic, grades 1-12, semester 1.
-- These were already verified against Plan1/Plan2 and have traceable sources.
update public.lessons l
set official_content_scope='plan-scheduled',
    updated_at=now()
from public.units u
join public.grades g on g.id=u.grade_id
join public.curricula cur on cur.id=g.curriculum_id
join public.countries c on c.id=cur.country_id
where l.unit_id=u.id
  and c.code='BH'
  and cur.name_ar='اللغة العربية'
  and cur.academic_year='2026-2027'
  and g.grade_number between 1 and 12
  and l.status='published'
  and l.semester=1;

-- Bahrain detailed track-specific current S1 curricula.
update public.lessons l
set official_content_scope='plan-scheduled',
    updated_at=now()
from public.units u
join public.grades g on g.id=u.grade_id
join public.curricula cur on cur.id=g.curriculum_id
join public.countries c on c.id=cur.country_id
where l.unit_id=u.id
  and c.code='BH'
  and cur.academic_year='2026-2027'
  and cur.name_ar like 'اللغة العربية — % — الفصل الأول'
  and l.status='published'
  and l.semester=1;

comment on column public.lessons.official_content_scope is
'plan-scheduled = explicitly present in the current official lesson plan; official-book-unscheduled = verified in an official current-year textbook/book guide but not asserted as currently scheduled.';
