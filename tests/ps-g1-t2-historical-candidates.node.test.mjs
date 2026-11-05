import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const caseFile="data/ministerial-audit/cases/PS-G1-T2-historical-teacher-plan-3-candidate-absences-20261104.json";
const candidate=JSON.parse(fs.readFileSync(caseFile,"utf8"));
test("Palestine grade1 term2 historical lesson-plan leads are review-only, not certified 2026-27 textbook coverage",()=>{
 assert.equal(candidate.country,"PS");
 assert.equal(candidate.grade,1);
 assert.equal(candidate.semester,2);
 assert.equal(candidate.academicYearTarget,"2026-2027");
 assert.equal(candidate.noChangesToProduction,true);
 assert.equal(candidate.historicalPlanSources.length,5);
 assert.equal(candidate.historicalPlanSources.filter(r=>r.publishedInPlatform).length,2);
 assert.deepEqual(candidate.candidateAbsentHistoricalTitles,["نساعد الكبير","الماء","القرد الطماع"]);
 assert.ok(candidate.candidateAbsentHistoricalTitles.every(name=>
   candidate.historicalPlanSources.some(r=>r.title===name&&!r.publishedInPlatform)
 ));
 assert.match(candidate.publicationGate,/BLOCKED/);
 assert.match(candidate.sourceCaveat,/NOT been visually reviewed/);
});
