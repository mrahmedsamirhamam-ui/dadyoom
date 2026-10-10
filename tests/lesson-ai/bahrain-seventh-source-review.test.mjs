import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
const read = p => readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("Bahrain seventh-grade source audit is reachable and never mutates lessons",()=>{
  const nav=read("app/admin/curriculum/coverage/page.tsx");
  const page=read("app/admin/curriculum/coverage/unclassified/page.tsx");
  expect(nav).toContain("/admin/curriculum/coverage/unclassified");
  expect(page).toContain("extractBahrainPlanYear");
  expect(page).toContain('"2025-2026"');
  expect(page).toContain('"2026-2027"');
  expect(page).toContain('"official_content_scope"');
  expect(page).not.toContain(".update(");
  expect(page).not.toContain(".delete(");
  expect(page).not.toContain(".insert(");
});
