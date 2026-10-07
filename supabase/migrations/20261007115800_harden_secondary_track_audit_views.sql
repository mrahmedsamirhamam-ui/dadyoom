alter view public.secondary_track_audit_report
  set (security_invoker = true);

alter view public.secondary_track_grade_audit_report
  set (security_invoker = true);

revoke all privileges on public.secondary_track_audit_report
  from anon, authenticated;

revoke all privileges on public.secondary_track_grade_audit_report
  from anon, authenticated;

grant select on public.secondary_track_audit_report
  to service_role;

grant select on public.secondary_track_grade_audit_report
  to service_role;
