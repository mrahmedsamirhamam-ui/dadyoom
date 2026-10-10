import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const audit=JSON.parse(read("data/curriculum-completeness/bahrain-assessment-quality-audit-20261010.json"));
test("review queue has all 544 flagged activities from 458 distinct Bahrain lessons",()=>{
  expect(audit.reviewQueue).toHaveLength(458);
  expect(new Set(audit.reviewQueue.map(x=>x.lessonId)).size).toBe(458);
  expect(audit.reviewQueue.reduce((n,x)=>n+x.reviewRequiredActivities,0)).toBe(audit.stats.reviewRequiredActivities);
  expect(audit.reviewQueue.filter(x=>x.scope==="plan-scheduled")).toHaveLength(187);
  expect(audit.reviewQueue.every(x=>/^[0-9a-f-]{36}$/iu.test(x.lessonId))).toBe(true);
  expect(audit.reviewQueue.every(x=>x.reviewRequiredActivities>0)).toBe(true);
});
test("admin review queue filters and paginates a snapshot without mutating production data",()=>{
  const page=read("app/admin/curriculum/coverage/assessments/review/page.tsx");
  const home=read("app/admin/curriculum/coverage/assessments/page.tsx");
  expect(home).toContain("/admin/curriculum/coverage/assessments/review");
  expect(page).toContain("filtered.slice((current-1)*perPage,current*perPage)");
  expect(page).toContain("scope===");
  expect(page).toContain("extractBahrainPlanYear");
  expect(page).toContain("لقطة مراجعة");
  for(const cmd of [".update(",".delete(",".insert(","service_role"])expect(page).not.toContain(cmd);
});
