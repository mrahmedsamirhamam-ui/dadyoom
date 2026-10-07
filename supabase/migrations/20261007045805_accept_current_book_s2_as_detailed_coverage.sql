
-- Teach secondary audit views that the Bahrain S1-current + S2-current-book
-- coverage label is a complete detailed state when all published terms are detailed.
do $$
declare
  v_name text;
  v_def text;
  v_old text := 'ARRAY[''detailed-current-semester-1''::text, ''detailed''::text]';
  v_new text := 'ARRAY[''detailed-current-semester-1''::text, ''detailed''::text, ''detailed-current-s1-plus-current-book-s2''::text]';
begin
  foreach v_name in array array[
    'secondary_track_audit_report',
    'secondary_track_grade_audit_report'
  ]
  loop
    select pg_get_viewdef(
      format('public.%I', v_name)::regclass,
      true
    )
    into v_def;

    if position(v_old in v_def) = 0 then
      raise exception 'EXPECTED_COVERAGE_GATE_NOT_FOUND_IN_%', v_name;
    end if;

    v_def := replace(v_def, v_old, v_new);

    execute format(
      'create or replace view public.%I as %s',
      v_name,
      v_def
    );
  end loop;
end $$;
