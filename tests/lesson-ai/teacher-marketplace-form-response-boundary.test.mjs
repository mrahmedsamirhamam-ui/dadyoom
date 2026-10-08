import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

test("teacher course form captures submit element before awaiting and resets only after successful creation", () => {
  const ui = readFileSync("app/(dashboard)/teacher/marketplace/TeacherMarketplaceClient.tsx", "utf8");
  expect(ui).toContain("const form = event.currentTarget;");
  expect(ui).toContain("new FormData(form)");
  expect(ui).toContain("if (created) form.reset();");
  expect(ui).toContain("return result.ok;");
  expect(ui).toContain("return false;");
  expect(ui).toContain("router.refresh()");
});

test("marketplace release gate records database row separately from UI error", () => {
  const e2e = readFileSync("scripts/final-e2e-release-gate.mjs", "utf8");
  expect(e2e).toContain("E2E_MARKETPLACE_CREATE_UI_DIAGNOSTIC");
  expect(e2e).toContain("statusMessages,");
  expect(e2e).toContain("persisted: persisted.data ?? null");
  expect(e2e).toContain('currentUrl: teacherPage.url()');
});
