drop policy if exists school_owner_view_linked_teacher_classes
on public.teacher_classes;

create policy school_owner_view_linked_teacher_classes
on public.teacher_classes
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.school_teachers st
    join public.schools s
      on s.id = st.school_id
    where st.teacher_id = teacher_classes.teacher_id
      and st.is_active = true
      and s.is_active = true
      and s.owner_id = auth.uid()
  )
);

drop policy if exists school_owner_view_linked_class_students
on public.teacher_class_students;

create policy school_owner_view_linked_class_students
on public.teacher_class_students
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.teacher_classes tc
    join public.school_teachers st
      on st.teacher_id = tc.teacher_id
     and st.is_active = true
    join public.schools s
      on s.id = st.school_id
     and s.is_active = true
    where tc.id = teacher_class_students.class_id
      and tc.is_active = true
      and s.owner_id = auth.uid()
  )
);

drop policy if exists school_owner_view_linked_student_profiles
on public.profiles;

create policy school_owner_view_linked_student_profiles
on public.profiles
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.teacher_class_students tcs
    join public.teacher_classes tc
      on tc.id = tcs.class_id
     and tc.is_active = true
    join public.school_teachers st
      on st.teacher_id = tc.teacher_id
     and st.is_active = true
    join public.schools s
      on s.id = st.school_id
     and s.is_active = true
    where tcs.student_id = profiles.id
      and tcs.is_active = true
      and s.owner_id = auth.uid()
  )
);
