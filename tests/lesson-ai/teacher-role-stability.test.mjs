import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const read = p => readFileSync(new URL("../../" + p, import.meta.url), "utf8");

test("teacher dashboard shares the authenticated viewer rather than repeating auth calls", () => {
  const teacher = read("app/(dashboard)/teacher/page.tsx");
  const layout = read("app/(dashboard)/layout.tsx");
  const role = read("components/roles/RolePortalLayout.tsx");
  expect(teacher).toContain("await getDashboardRequestViewer()");
  expect(layout).toContain("getDashboardRequestViewer()");
  expect(role).toContain("getDashboardRequestViewer()");
  expect(teacher).not.toContain("supabase.auth.getUser()");
  expect(teacher).toContain('redirect(\n      "/login"');
});

test("role smoke retries only transient HTTP codes and preserves strict assertions", () => {
  const qa = read("scripts/final-e2e-release-gate.mjs");
  const role = qa.slice(qa.indexOf("async function roleRouteSmoke("), qa.indexOf("async function humanUiJourneySmoke("));
  expect(role).toContain("for (let attempt = 1; attempt <= 3; attempt += 1)");
  expect(role).toContain("[429, 502, 503, 504].includes(http)");
  expect(role).toContain("E2E_ROUTE_RETRY");
  expect(role).toContain("status === 200");
  expect(role).toContain("observedPath === requiredPath");
  expect(role).toContain("!hasClientErrorShell");
});
