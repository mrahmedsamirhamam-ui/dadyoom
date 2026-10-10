import { readFileSync } from "node:fs";
import { expect,test } from "vitest";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const audit=JSON.parse(read("data/curriculum-completeness/bahrain-repeated-assessment-prompts-20261010.json"));
test("repeated Bahrain assessment audit records actual duplicates, not full official readiness",()=>{
 expect(audit.countryCode).toBe("BH");
 expect(audit.verification).toBe("REPEATED_PROMPT_SCREENING_NOT_PEDAGOGICAL_APPROVAL");
 expect(audit.summary.activities).toBe(audit.entries.length);
 expect(audit.summary.activities).toBe(415);
 expect(new Set(audit.entries.map(x=>x.activityId)).size).toBe(415);
 expect(new Set(audit.entries.map(x=>x.lessonId)).size).toBe(415);
 expect(audit.entries.filter(x=>x.question===audit.summary.genericRepeatedPrompt)).toHaveLength(404);
 expect(audit.entries.filter(x=>x.reviewStatus==="required")).toHaveLength(11);
 expect(audit.entries.every(x=>x.repeatLessonCount>=10)).toBe(true);
});
test("admin view is paginated, source-aware, and read-only",()=>{
 const page=read("app/admin/curriculum/coverage/assessments/repeated/page.tsx");
 expect(page).toContain("filtered.slice((current-1)*pageSize,current*pageSize)");
 expect(page).toContain("extractBahrainPlanYear");
 expect(page).toContain("/lessons/");
 expect(read("app/admin/curriculum/coverage/assessments/page.tsx")).toContain("/admin/curriculum/coverage/assessments/repeated");
 for(const cmd of [".insert(",".update(",".delete(","service_role"]) expect(page).not.toContain(cmd);
});
