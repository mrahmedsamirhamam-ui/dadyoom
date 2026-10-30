import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Grade = { grade: number; total: number; published: number; before_6_to_10: number; after_6_to_10: number; lam_improved: number };
const audit = JSON.parse(readFileSync(resolve(process.cwd(), "data/audits/grades123-22countries-lam-after-20261029.json"), "utf8")) as {
 countries: Array<{ country_code: string; grades: Grade[] }>;
 totals: { total: number; published: number; drafts: number; before_6_to_10: number; after_6_to_10: number; lam_improved: number; structural_candidates: number };
 nextBatchGrades456Allowed: boolean;
};
describe("Production audit of Grades 1–3 in 22 countries", () => {
 it("has 66 distinct country-grade groups and keeps Grades 4–6 blocked", () => {
  expect(audit.countries).toHaveLength(22);
  expect(new Set(audit.countries.map(c => c.country_code)).size).toBe(22);
  for (const c of audit.countries) {
   expect(c.grades.map(g => g.grade).sort()).toEqual([1,2,3]);
   expect(c.grades.every(g => g.lam_improved === 1)).toBe(true);
  }
  expect(audit.nextBatchGrades456Allowed).toBe(false);
 });
 it("shows 66 genuinely improved existing lessons but not 100% readiness", () => {
  expect(audit.totals).toMatchObject({total:1803,published:1746,drafts:57,before_6_to_10:108,after_6_to_10:174,lam_improved:66,structural_candidates:159});
  const grades=audit.countries.flatMap(c=>c.grades);
  expect(grades.reduce((s,g)=>s+g.lam_improved,0)).toBe(66);
  expect(grades.reduce((s,g)=>s+g.after_6_to_10-g.before_6_to_10,0)).toBe(66);
  expect(grades.some(g=>g.after_6_to_10<g.published)).toBe(true);
 });
});
