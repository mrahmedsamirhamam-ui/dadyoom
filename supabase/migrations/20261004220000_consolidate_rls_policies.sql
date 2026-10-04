-- Consolidate equivalent permissive RLS policies without changing effective access.
-- Also scopes formerly PUBLIC read policies to anon because authenticated access
-- is represented explicitly in the consolidated authenticated policies.

-- =========================================================
-- lessons
-- Previous effective rules:
-- anon: published only
-- authenticated SELECT: published OR own-created OR admin
-- authenticated INSERT: own-created OR admin
-- authenticated UPDATE: own-created OR admin
-- authenticated DELETE: admin only
-- =========================================================
drop policy if exists "lessons_admin_all" on public.lessons;
drop policy if exists "lessons_teacher_insert" on public.lessons;
drop policy if exists "lessons_teacher_select" on public.lessons;
drop policy if exists "lessons_teacher_update" on public.lessons;
drop policy if exists "Public can read published lessons" on public.lessons;

create policy "Anonymous users read published lessons"
  on public.lessons
  for select
  to anon
  using (status = 'published');

create policy "Authenticated users read allowed lessons"
  on public.lessons
  for select
  to authenticated
  using (
    status = 'published'
    or created_by = (select auth.uid())
    or public.is_admin()
  );

create policy "Authenticated users insert allowed lessons"
  on public.lessons
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    or public.is_admin()
  );

create policy "Authenticated users update allowed lessons"
  on public.lessons
  for update
  to authenticated
  using (
    created_by = (select auth.uid())
    or public.is_admin()
  )
  with check (
    created_by = (select auth.uid())
    or public.is_admin()
  );

create policy "Admins delete lessons"
  on public.lessons
  for delete
  to authenticated
  using (public.is_admin());

-- =========================================================
-- questions
-- Previous effective rules:
-- anon: questions belonging to published lessons
-- authenticated: published-lesson questions OR own lesson questions OR admin
-- writes: own lesson OR admin
-- =========================================================
drop policy if exists "Admins can delete questions" on public.questions;
drop policy if exists "Teachers can delete own lesson questions" on public.questions;
drop policy if exists "Admins can insert questions" on public.questions;
drop policy if exists "Teachers can insert own lesson questions" on public.questions;
drop policy if exists "Admins can read questions" on public.questions;
drop policy if exists "Public can read published lesson questions" on public.questions;
drop policy if exists "Teachers can read own lesson questions" on public.questions;
drop policy if exists "Admins can update questions" on public.questions;
drop policy if exists "Teachers can update own lesson questions" on public.questions;

create policy "Anonymous users read published lesson questions"
  on public.questions
  for select
  to anon
  using (
    exists (
      select 1
      from public.lessons l
      where l.id = questions.lesson_id
        and l.status = 'published'
    )
  );

create policy "Authenticated users read allowed questions"
  on public.questions
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.lessons l
      where l.id = questions.lesson_id
        and (
          l.status = 'published'
          or l.created_by = (select auth.uid())
        )
    )
  );

create policy "Authenticated users insert allowed questions"
  on public.questions
  for insert
  to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.lessons l
      where l.id = questions.lesson_id
        and l.created_by = (select auth.uid())
    )
  );

create policy "Authenticated users update allowed questions"
  on public.questions
  for update
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.lessons l
      where l.id = questions.lesson_id
        and l.created_by = (select auth.uid())
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.lessons l
      where l.id = questions.lesson_id
        and l.created_by = (select auth.uid())
    )
  );

create policy "Authenticated users delete allowed questions"
  on public.questions
  for delete
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.lessons l
      where l.id = questions.lesson_id
        and l.created_by = (select auth.uid())
    )
  );

-- =========================================================
-- parent_students SELECT
-- =========================================================
drop policy if exists "parents_view_own_children" on public.parent_students;
drop policy if exists "students_view_own_parents" on public.parent_students;

create policy "Users read allowed parent student links"
  on public.parent_students
  for select
  to authenticated
  using (
    parent_id = (select auth.uid())
    or student_id = (select auth.uid())
    or public.is_admin()
  );

-- =========================================================
-- profiles SELECT
-- =========================================================
drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "school_owner_view_linked_student_profiles" on public.profiles;

create policy "Users read allowed profiles"
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or public.is_admin()
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
        and s.owner_id = (select auth.uid())
    )
  );

-- =========================================================
-- teacher_class_lessons
-- =========================================================
drop policy if exists "teachers_manage_class_lessons" on public.teacher_class_lessons;
drop policy if exists "students_view_assigned_lessons" on public.teacher_class_lessons;

create policy "Users read allowed class lessons"
  on public.teacher_class_lessons
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.teacher_classes tc
      where tc.id = teacher_class_lessons.class_id
        and (
          tc.teacher_id = (select auth.uid())
          or public.is_admin()
        )
    )
    or exists (
      select 1
      from public.teacher_class_students tcs
      where tcs.class_id = teacher_class_lessons.class_id
        and tcs.student_id = (select auth.uid())
        and tcs.is_active = true
    )
  );

create policy "Teachers manage class lessons insert"
  on public.teacher_class_lessons
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.teacher_classes tc
      where tc.id = teacher_class_lessons.class_id
        and (
          tc.teacher_id = (select auth.uid())
          or public.is_admin()
        )
    )
  );

create policy "Teachers manage class lessons update"
  on public.teacher_class_lessons
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.teacher_classes tc
      where tc.id = teacher_class_lessons.class_id
        and (
          tc.teacher_id = (select auth.uid())
          or public.is_admin()
        )
    )
  )
  with check (
    exists (
      select 1
      from public.teacher_classes tc
      where tc.id = teacher_class_lessons.class_id
        and (
          tc.teacher_id = (select auth.uid())
          or public.is_admin()
        )
    )
  );

create policy "Teachers manage class lessons delete"
  on public.teacher_class_lessons
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.teacher_classes tc
      where tc.id = teacher_class_lessons.class_id
        and (
          tc.teacher_id = (select auth.uid())
          or public.is_admin()
        )
    )
  );

-- =========================================================
-- teacher_class_students
-- =========================================================
drop policy if exists "teachers_manage_class_students" on public.teacher_class_students;
drop policy if exists "school_owner_view_linked_class_students" on public.teacher_class_students;
drop policy if exists "students_view_own_class_membership" on public.teacher_class_students;

create policy "Users read allowed class student links"
  on public.teacher_class_students
  for select
  to authenticated
  using (
    student_id = (select auth.uid())
    or exists (
      select 1
      from public.teacher_classes tc
      where tc.id = teacher_class_students.class_id
        and (
          tc.teacher_id = (select auth.uid())
          or public.is_admin()
        )
    )
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
        and s.owner_id = (select auth.uid())
    )
  );

create policy "Teachers manage class students insert"
  on public.teacher_class_students
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.teacher_classes tc
      where tc.id = teacher_class_students.class_id
        and (
          tc.teacher_id = (select auth.uid())
          or public.is_admin()
        )
    )
  );

create policy "Teachers manage class students update"
  on public.teacher_class_students
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.teacher_classes tc
      where tc.id = teacher_class_students.class_id
        and (
          tc.teacher_id = (select auth.uid())
          or public.is_admin()
        )
    )
  )
  with check (
    exists (
      select 1
      from public.teacher_classes tc
      where tc.id = teacher_class_students.class_id
        and (
          tc.teacher_id = (select auth.uid())
          or public.is_admin()
        )
    )
  );

create policy "Teachers manage class students delete"
  on public.teacher_class_students
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.teacher_classes tc
      where tc.id = teacher_class_students.class_id
        and (
          tc.teacher_id = (select auth.uid())
          or public.is_admin()
        )
    )
  );

-- =========================================================
-- teacher_classes
-- =========================================================
drop policy if exists "teachers_manage_own_classes" on public.teacher_classes;
drop policy if exists "school_owner_view_linked_teacher_classes" on public.teacher_classes;

create policy "Users read allowed teacher classes"
  on public.teacher_classes
  for select
  to authenticated
  using (
    teacher_id = (select auth.uid())
    or public.is_admin()
    or exists (
      select 1
      from public.school_teachers st
      join public.schools s
        on s.id = st.school_id
      where st.teacher_id = teacher_classes.teacher_id
        and st.is_active = true
        and s.is_active = true
        and s.owner_id = (select auth.uid())
    )
  );

create policy "Teachers manage own classes insert"
  on public.teacher_classes
  for insert
  to authenticated
  with check (
    teacher_id = (select auth.uid())
    or public.is_admin()
  );

create policy "Teachers manage own classes update"
  on public.teacher_classes
  for update
  to authenticated
  using (
    teacher_id = (select auth.uid())
    or public.is_admin()
  )
  with check (
    teacher_id = (select auth.uid())
    or public.is_admin()
  );

create policy "Teachers manage own classes delete"
  on public.teacher_classes
  for delete
  to authenticated
  using (
    teacher_id = (select auth.uid())
    or public.is_admin()
  );
