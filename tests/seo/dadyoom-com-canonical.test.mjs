import { afterEach, describe, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { getSiteUrl } from "../../lib/site";

const read = (file) => readFileSync(file, "utf8");
const sitemap = read("app/sitemap.ts");
const brand = read("public/sitemap-brand.xml");
const robots = read("app/robots.ts");
const layout = read("app/layout.tsx");
const homepage = read("app/page.tsx");
const proxy = read("proxy.ts");
const workflow = read(".github/workflows/seo-production-gate.yml");

afterEach(() => vi.unstubAllEnvs());

describe("Dadyoom official .com canonical and natural search spellings", () => {
  test("old production env can no longer override the owned canonical .com", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dadyoom.dpdns.org");
    vi.stubEnv("DADYOOM_PRODUCTION_URL", "https://dadyoom.dpdns.org");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(getSiteUrl()).toBe("https://dadyoom.com");
  });
  test("new environment is accepted", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dadyoom.com");
    expect(getSiteUrl()).toBe("https://dadyoom.com");
  });
  test("one canonical sitemap with reciprocal Arabic/English language alternates", () => {
    expect(sitemap).toContain("seo_indexable_lessons_fast");
    expect(sitemap).toContain("${base}/courses/international-arabic");
    expect(sitemap).toContain("${base}/courses/international-arabic/practice");
    expect(sitemap).toContain("eq(\"status\", \"published\")");
    expect(sitemap).toContain("const unique = new Map(entries.map");
    expect(sitemap).toContain("alternates: { languages: { ar: base, en:");
    expect(sitemap).not.toContain("dadyoom.dpdns.org");
    expect(robots).toContain('sitemap: [`${base}/sitemap.xml`]');
    expect(robots).not.toContain('sitemap: [`${base}/sitemap.xml`, `${base}/sitemap-brand.xml`]');
  });
  test("legacy brand XML has zero old URLs", () => {
    expect(brand).toContain("https://dadyoom.com/");
    expect(brand).not.toContain("dadyoom.dpdns.org");
    expect((brand.match(/<loc>/gu) ?? []).length).toBe(3);
  });
  test("site name remains correct and misspellings describe one real brand", () => {
    expect(layout).toContain("SITE_TAGLINE");
    expect(layout).toContain("SITE_BRAND_ALIASES");
    expect(layout).toContain("alternateName: brandAlternateNames");
    for (const x of ["ضاضيوم", "داديوم", "ضاديو", "Dadyoum", "ضاد"]) {
      expect(homepage).toContain(x);
    }
    expect(homepage).toContain("اسم مساعدنا الذكي");
  });
  test("legacy public redirect does not leak authentication codes between hosts", () => {
    expect(proxy).toContain('"dadyoom.dpdns.org"');
    expect(proxy).toContain('"dadyoom.com"');
    expect(proxy).toContain('"code", "state", "token"');
    expect(proxy).toContain('isPublicSeoPath(pathname)');
    expect(proxy).not.toContain('"/auth/:path*"');
  });
  test("production SEO CI checks .com and only one submitted sitemap", () => {
    expect(workflow).toContain("BASE: https://dadyoom.com");
    expect(workflow).toContain("SEO_ROBOTS_DUPLICATE_SITEMAP=FAIL");
    expect(workflow).toContain('DADYOOM_INDEXNOW_SITE: https://dadyoom.com');
  });
});
