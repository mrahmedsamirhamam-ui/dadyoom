
alter function public.handle_new_user()
  set search_path = public;

revoke execute
on function public.handle_new_user()
from public, anon, authenticated;

grant execute
on function public.handle_new_user()
to postgres, service_role, supabase_auth_admin;

revoke execute
on function public.create_parent_link_code()
from anon;

revoke execute
on function public.create_school_intervention(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  date
)
from anon;

revoke execute
on function public.create_school_teacher_link_code()
from anon;

revoke execute
on function public.delete_school_intervention(uuid)
from anon;

revoke execute
on function public.ensure_my_school(text, text, text)
from anon;

revoke execute
on function public.generate_parent_link_code()
from anon;

revoke execute
on function public.generate_school_teacher_link_code()
from anon;

revoke execute
on function public.get_active_parent_link_code()
from anon;

revoke execute
on function public.get_active_school_teacher_link_code()
from anon;

revoke execute
on function public.get_my_teacher_classes()
from anon;

revoke execute
on function public.get_parent_children()
from anon;

revoke execute
on function public.get_school_analytics_v1()
from anon;

revoke execute
on function public.get_school_class_details(uuid)
from anon;

revoke execute
on function public.get_school_dashboard()
from anon;

revoke execute
on function public.get_school_insights_v1()
from anon;

revoke execute
on function public.get_school_interventions_v1()
from anon;

revoke execute
on function public.get_school_student_details(uuid)
from anon;

revoke execute
on function public.get_school_teacher_class_analytics_v1()
from anon;

revoke execute
on function public.get_school_teacher_details(uuid)
from anon;

revoke execute
on function public.get_school_teachers()
from anon;

revoke execute
on function public.get_teacher_class_roster(uuid)
from anon;

revoke execute
on function public.is_admin()
from anon;

revoke execute
on function public.join_teacher_class_by_code(text)
from anon;

revoke execute
on function public.link_child_by_code(text, text)
from anon;

revoke execute
on function public.link_teacher_to_school_by_code(text)
from anon;

revoke execute
on function public.update_school_intervention_status(uuid, text)
from anon;

drop policy if exists
  "Students can read own stats"
on public.student_stats;

create policy
  "Students can read own stats"
on public.student_stats
for select
to authenticated
using (
  lower(trim(student_email)) =
  lower(
    trim(
      coalesce(
        auth.jwt() ->> 'email',
        ''
      )
    )
  )
);

drop policy if exists
  "Students can read own skill mastery"
on public.student_skill_mastery;

create policy
  "Students can read own skill mastery"
on public.student_skill_mastery
for select
to authenticated
using (
  student_id = auth.uid()
);
