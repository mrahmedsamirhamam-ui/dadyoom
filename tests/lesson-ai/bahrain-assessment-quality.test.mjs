import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
const read = p => readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const data = JSON.parse(read("data/curriculum-completeness/bahrain-assessment-quality-audit-20261010.json"));
const sum = field => data.buckets.reduce((s,row)=>s+Number(row[field]??0),0);
test("Bahrain assessment audit correctly distinguishes legacy questions from actual objectives",()=>{
  expect(data.countryCode).toBe("BH");
  expect(data.verification).toBe("ASSESSMENT_PRESENCE_ONLY_NOT_PEDAGOGICAL_OR_OFFICIAL_TOC_VERIFICATION");
  expect(sum("lessons")).toBe(data.stats.lessons);
  expect(sum("no_legacy_questions")).toBe(data.stats.withoutLegacyQuestions);
  expect(sum("no_objective_assessment")).toBe(data.stats.withoutObjectiveAssessment);
  expect(sum("lessons_with_mcq")).toBe(data.stats.withPublishedMultipleChoice);
  expect(sum("review_required_activities")).toBe(data.stats.reviewRequiredActivities);
  expect(data.missingObjectiveLessons).toHaveLength(data.stats.withoutObjectiveAssessment);
  expect(data.stats.currentPlanWithoutObjective).toBe(0);
  expect(data.missingObjectiveLessons.every(x=>x.term===2)).toBe(true);
});
test("admin-only page links individual review items and never edits lesson records",()=>{
  expect(read("app/admin/curriculum/coverage/page.tsx")).toContain("/admin/curriculum/coverage/assessments");
  const page=read("app/admin/curriculum/coverage/assessments/page.tsx");
  expect(page).toContain("audit.missingObjectiveLessons.map");
  expect(page).toContain("/lessons/");
  expect(page).toContain("لقطة موثقة وليست قراءة لحظية");
  expect(page).not.toContain(".update(");
  expect(page).not.toContain(".delete(");
  expect(page).not.toContain(".insert(");
});
