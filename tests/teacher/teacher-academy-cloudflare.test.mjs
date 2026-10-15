import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const page = readFileSync("app/(dashboard)/teacher/academy/page.tsx", "utf8");
const catalog = JSON.parse(readFileSync("data/teacher-academy/catalog.json", "utf8"));
const qa = readFileSync("scripts/final-e2e-release-gate.mjs", "utf8");

describe("Teacher Academy Cloudflare runtime", () => {
  it("bundles training catalog, not a runtime filesystem read", () => {
    expect(page).toContain('import academyCatalog from "@/data/teacher-academy/catalog.json"');
    expect(page).not.toContain('from "node:fs"');
    expect(page).not.toContain("process.cwd()");
    expect(page).not.toContain("readFileSync");
  });
  it("ships the existing 500 lessons in 25 tracks", () => {
    expect(catalog.total).toBe(500);
    expect(catalog.trackCount).toBe(25);
    expect(catalog.items).toHaveLength(500);
    expect(catalog.items.every((x) => x.url?.startsWith("https://www.youtube.com/watch?"))).toBe(true);
  });
  it("includes academy and teacher studio in production role smoke tests", () => {
    expect(qa).toContain('"/teacher/academy"');
    expect(qa).toContain('"/teacher/studio"');
    expect(qa).toContain("E2E_TEACHER_ACADEMY_CONTENT_FAILED");
    expect(qa).toContain("E2E_TEACHER_STUDIO_CONTENT_FAILED");
  });
});
