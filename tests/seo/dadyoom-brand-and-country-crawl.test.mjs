import { readFileSync } from "node:fs";
import { test, expect } from "vitest";
const file = (name) => readFileSync(new URL("../../" + name, import.meta.url), "utf8");
test("brand and canonical stay consistent", () => {
  const site = file("lib/site.ts");
  expect(site).toContain('SITE_NAME = "ضاديوم"');
  expect(site).toContain('SITE_NAME_ARABIC_ALT_SHORT = "ضاديو"');
  expect(site).toContain("https://dadyoom.dpdns.org");
  expect(file("app/layout.tsx")).toContain("SITE_NAME_ARABIC_ALT_SHORT");
  expect(file("app/page.tsx")).toContain('"ضاديو"');
  const description = site.match(/export const SITE_DESCRIPTION =\s*"([^"]+)"/);
  expect(description).not.toBeNull();
  expect(description[1].length).toBeLessThanOrEqual(160);
});
test("country directory gives a small lesson preview and keeps full grade links", () => {
  const country = file("app/curriculum/[country]/page.tsx");
  expect(country).toContain(".slice(0, 2)");
  expect(country).toContain("عرض جميع دروس الصف");
  expect(country).toContain("seo_indexable_lessons_fast");
  expect(file("app/sitemap.ts")).toContain("/curriculum/");
  expect(file("app/robots.ts")).toContain("sitemap.xml");
});
