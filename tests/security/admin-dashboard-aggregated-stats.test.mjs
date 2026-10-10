import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const src = (file) => readFileSync(file, "utf8");

test("admin stats load one RLS-preserving RPC before legacy fallback", () => {
  const code = src("lib/admin/dashboard.ts");
  expect(code).toContain('"dadyoom_admin_dashboard_stats_v1"');
  expect(code.indexOf('"dadyoom_admin_dashboard_stats_v1"')).toBeLessThan(
    code.indexOf('const [\n    students,')
  );
  expect(code).toContain("DADYOOM_ADMIN_STATS_RPC_FALLBACK");
  expect(code).toContain('select("id", { count: "exact", head: true })');
});

test("admin stats SQL invoker never bypasses RLS or grants public access", () => {
  const sql = src("supabase/migrations/20261010211500_dadyoom_admin_dashboard_stats_v1.sql");
  expect(sql).toContain("security invoker");
  expect(sql).toContain("where id = (select auth.uid())");
  expect(sql).toContain("lower(trim(role)) = 'admin'");
  expect(sql).toContain("from public.profiles");
  expect(sql).toContain("from public.student_lesson_progress");
  expect(sql).toContain("revoke all on function public.dadyoom_admin_dashboard_stats_v1() from public");
  expect(sql).toContain("grant execute on function public.dadyoom_admin_dashboard_stats_v1() to authenticated");
  expect(sql).not.toContain("security definer");
});
