import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const shell = readFileSync("app/(dashboard)/teacher/page.tsx", "utf8");
const panel = readFileSync("app/(dashboard)/teacher/TeacherDashboardPanel.tsx", "utf8");
const roles = readFileSync("components/roles/RolePortalLayout.tsx", "utf8");
const viewer = readFileSync("lib/auth/request-viewer.ts", "utf8");

describe("Teacher portal progressive streaming under Cloudflare edge load", () => {
  test("initial response authenticates and renders an actionable skeleton without awaiting data fan-out", () => {
    expect(shell).toContain("await getDashboardRequestViewer()");
    expect(shell).toContain('redirect(\n      "/login"');
    expect(shell).toContain('<Suspense fallback={<TeacherDashboardFallback />}>');
    expect(shell).toContain("<TeacherDashboardPanel />");
    expect(shell).toContain('role="status" aria-live="polite"');
    expect(shell).toContain("لوحة المعلم");
    expect(shell).toContain('href: "/teacher/studio"');
    expect(shell).toContain('href: "/teacher/live"');
    expect(shell).not.toContain('.from("teacher_class_students")');
    expect(shell).not.toContain('.from("lessons")');
  });

  test("actual roster, class, lessons and school-link data remain authenticated and RLS-scoped", () => {
    expect(panel).toContain("await getDashboardRequestViewer()");
    expect(panel).toContain('redirect(\n      "/login"');
    expect(panel).toContain('export default async function TeacherDashboardPanel()');
    expect(panel).toContain("await Promise.all([");
    expect(panel).toContain('getActiveSchoolTeacherLinkCode(');
    expect(panel).toContain('.from(\n          "teacher_classes"');
    expect(panel).toContain('.from("lessons")');
    expect(panel).toContain('.from(\n        "teacher_class_students"');
    expect(panel).toContain('teacher_id');
    expect(panel).not.toContain("createAdminClient");
    expect(panel).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(roles).toContain("actualRole !== role");
    expect(viewer).toContain("cache(async () =>");
  });
});
