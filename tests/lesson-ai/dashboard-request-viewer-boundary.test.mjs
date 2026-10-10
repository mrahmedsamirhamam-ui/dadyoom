import { test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("dashboard nested layers reuse a per-request auth/profile read while keeping role gates", () => {
  const viewer = readFileSync("lib/auth/request-viewer.ts", "utf8");
  const dashboard = readFileSync("app/(dashboard)/layout.tsx", "utf8");
  const role = readFileSync("components/roles/RolePortalLayout.tsx", "utf8");
  const student = readFileSync("app/(dashboard)/student/page.tsx", "utf8");
  const school = readFileSync("app/(dashboard)/school/page.tsx", "utf8");

  assert.match(viewer, /cache\(async \(\) =>/);
  assert.equal((viewer.match(/\.auth\.getUser\(\)/g) || []).length, 1);
  assert.equal((viewer.match(/\.from\("profiles"\)/g) || []).length, 1);
  assert.match(viewer, /profileError/);
  for (const file of [dashboard, role, student, school]) {
    assert.match(file, /getDashboardRequestViewer\(\)/);
    assert.doesNotMatch(file, /\.auth\.getUser\(\)/);
  }
  assert.match(dashboard, /dadyoomAllowedRoles/);
  assert.match(role, /actualRole !== role/);
  assert.match(student, /studentRole !== "student"/);
  assert.match(student, /redirect\("\/onboarding"\)/);
  assert.match(school, /role !== "school"/);
  assert.match(school, /role !== "admin"/);
  assert.match(school, /\.rpc\(\s*"get_school_dashboard"/);
});
