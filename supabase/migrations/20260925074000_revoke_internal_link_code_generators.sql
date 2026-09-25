-- Dadyoom security hardening: internal link-code helpers must not be callable
-- directly by browser clients. Public user-facing RPCs perform auth/role checks
-- and invoke these helpers internally where appropriate.

revoke all on function public.generate_parent_link_code()
  from public, anon, authenticated;

revoke all on function public.generate_school_teacher_link_code()
  from public, anon, authenticated;

grant execute on function public.generate_parent_link_code()
  to service_role;

grant execute on function public.generate_school_teacher_link_code()
  to service_role;
