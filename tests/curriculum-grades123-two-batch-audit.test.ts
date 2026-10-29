import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const audit = JSON.parse(readFileSync(resolve(process.cwd(),"data/audits/grades123-22countries-after-two-batches-20261029.json"),"utf8")) as {
 countries: Array<{country_code:string;grades:Array<{grade:number;published:number;total:number;drafts:number;before_6_to_10:number;after_lam_6_to_10:number;after_6_to_10:number;lam_improved:number;plural_improved:number;structural_candidates:number}>}>;
 totals: {total:number;published:number;drafts:number;before_6_to_10:number;after_lam_6_to_10:number;after_6_to_10:number;lam_improved:number;plural_improved:number;structural_candidates:number};
 nextBatchGrades456Allowed:boolean;officialCurriculumVerified:boolean;audioEndToEndVerified:boolean;roleEndToEndVerified:boolean;gradingSecurityVerified:boolean;
};
describe("Live Grade 1–3 two-batch snapshot across all 22 countries",()=>{
 it("preserves country and grade coverage, with 132 real improvements",()=>{
  expect(audit.countries).toHaveLength(22);
  expect(new Set(audit.countries.map(c=>c.country_code)).size).toBe(22);
  const grades=audit.countries.flatMap(c=>c.grades);
  expect(grades).toHaveLength(66);
  for(const c of audit.countries) expect(c.grades.map(g=>g.grade).sort()).toEqual([1,2,3]);
  expect(grades.every(g=>g.lam_improved===1 && g.plural_improved===1)).toBe(true);
  expect(audit.totals).toMatchObject({total:1803,published:1746,drafts:57,before_6_to_10:108,after_lam_6_to_10:174,after_6_to_10:240,lam_improved:66,plural_improved:66,structural_candidates:225});
  expect(grades.reduce((s,g)=>s+g.after_6_to_10-g.before_6_to_10,0)).toBe(132);
 });
 it("denies premature fourth grade even after additional data improvements",()=>{
  expect(audit.nextBatchGrades456Allowed).toBe(false);
  expect(audit.officialCurriculumVerified).toBe(false);
  expect(audit.audioEndToEndVerified).toBe(false);
  expect(audit.roleEndToEndVerified).toBe(false);
  expect(audit.gradingSecurityVerified).toBe(false);
  expect(audit.countries.flatMap(c=>c.grades).some(g=>g.after_6_to_10<g.published)).toBe(true);
 });
});
