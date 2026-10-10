import { readFileSync } from "node:fs";
import { test, expect } from "vitest";
const file = (name) => readFileSync(new URL("../../" + name, import.meta.url), "utf8");
test("brand and canonical stay consistent", () => {
  const site = file("lib/site.ts");
  expect(site).toContain('SITE_NAME = "ضاديوم"');
  expect(site).toContain('SITE_NAME_ARABIC_ALT_SHORT = "ضاديو"');
  expect(site).toContain('SITE_NAME_ARABIC_ALT = "ضاضيوم"');
  expect(site).toContain('SITE_NAME_ARABIC_ALT_DADYOOM = "داديوم"');
  expect(site).toContain("https://dadyoom.dpdns.org");
  const layout = file("app/layout.tsx");
  const homepage = file("app/page.tsx");
  expect(layout).toContain("siteName: SITE_NAME");
  expect(layout).toContain("new URL(siteUrl).hostname");
  expect(layout).toContain("alternateName: brandAlternateNames");
  expect(layout).toContain('sameAs: ["https://github.com/mrahmedsamirhamam-ui/dadyoom"]');
  for (const alias of ["SITE_NAME_ARABIC_ALT,", "SITE_NAME_ARABIC_ALT_DADYOOM,", "SITE_NAME_ARABIC_ALT_SHORT,"]) {
    expect(layout).toContain(alias);
  }
  const about = file("app/about/page.tsx");
  expect(about).toContain("وقد يكتبه بعض الزوار «ضاضيوم»");
  expect(about).toContain('alternates: { canonical: "/about" }');
  expect(homepage).not.toContain('"@type": "WebSite"');
  expect(homepage).toContain("ضاديوم (Dadyoom) — بيت العربية الرقمي");
  expect(homepage).toContain("إذا بحثت عن «ضاضيوم»");
  expect(homepage).toContain("«ضاضيوم» أو «داديوم»");
  expect(homepage).toContain("فأنت تقصد «ضاديوم»");
  expect(homepage).toContain('alternates: { canonical: "/", languages: { ar: "/", en: "/en" } }');
  expect(homepage).not.toContain("«ضاديو»");
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
