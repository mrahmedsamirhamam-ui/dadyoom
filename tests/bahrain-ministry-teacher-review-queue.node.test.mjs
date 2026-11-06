import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";

const signal = JSON.parse(readFileSync("data/curriculum-audits/bh-2026-2027-g1-g3-s1-content-signals.json","utf8"));
const report = JSON.parse(execFileSync(process.execPath,[
  "scripts/build-bahrain-ministry-teacher-review-queue.mjs","--json"
],{encoding:"utf8"}));
const find = (grade,category,term) => report.review.find(x =>
  x.grade===grade && x.category===category && x.ministryTitle.includes(term));

test("Source snapshots never expose student data or full textbook/lesson content",()=>{
  assert.equal(signal.publishedRows.length,147);
  assert.ok(signal.publishedRows.every(r => !Object.hasOwn(r,"content") &&
    !Object.hasOwn(r,"user_id") && !Object.hasOwn(r,"email") && !Object.hasOwn(r,"id")));
  assert.ok(signal.publishedRows.every(r=>r.status==="published" && r.semester===1));
  assert.equal(report.country,"BH");
  assert.equal(report.year,"2026-2027");
  assert.equal(report.semester,1);
});

test("All 120 selected ministry topics get a concrete human-review checklist, not fake certification",()=>{
  assert.equal(report.summary.totalItems,120);
  assert.equal(report.review.length,120);
  assert.equal(report.summary.teacherReviewCompleted,0);
  assert.equal(report.summary.officialCoveragePercent,null);
  assert.equal(report.summary.topicsCertifiedComplete,0);
  assert.equal(new Set(report.review.map(r=>r.officialId)).size,120);
  assert.ok(report.review.every(r=>r.certifiedComplete===false &&
    r.reviewState==="PENDING_HUMAN_SOURCE_AND_PEDAGOGY_REVIEW" &&
    /^https:\/\/edunet\.bh\//.test(r.sourcePlanUrl) &&
    r.teacherActions.length>0 && r.ministryTitle.length>0));
  assert.equal(report.gradeBreakdown.reduce((n,x)=>n+x.items,0),120);
  assert.equal(report.gradeBreakdown.reduce((n,x)=>n+x.P0+x.P1+x.P2,0),120);
  assert.deepEqual([...new Set(report.review.map(r=>r.grade))],[1,2,3]);
  for(const grade of [1,2,3]){
    const ordered=report.review.filter(r=>r.grade===grade).map(r=>({P0:0,P1:1,P2:2})[r.priority]);
    assert.ok(ordered.every((v,i)=>i===0||v>=ordered[i-1]),"Priority order within grade "+grade);
  }
});

test("Known alternative reading stories remain release-blocking priority for source/content review",()=>{
  const items=report.review.filter(r=>r.warningCodes.includes("ORIGINAL_READING_NOT_OFFICIAL_TEXT"));
  assert.equal(items.length,21);
  assert.ok(items.every(r=>r.priority==="P0" && r.certifiedComplete===false));
  assert.ok(find(2,"core","صديقتي مريم").warningCodes.includes("ORIGINAL_READING_NOT_OFFICIAL_TEXT"));
  assert.ok(find(3,"core","الأصدقاء الأربعة").warningCodes.includes("ORIGINAL_READING_NOT_OFFICIAL_TEXT"));
  assert.ok(find(3,"core","جزاء المعتدي").warningCodes.includes("ORIGINAL_READING_NOT_OFFICIAL_TEXT"));
});

test("Grade one letter lessons with no goal label are flagged without falsely saying goal is absent",()=>{
  const letter=find(1,"core","حرف (ب)");
  assert.ok(letter.warningCodes.includes("GOAL_LABEL_NOT_DETECTED"));
  assert.ok(letter.teacherActions.some(a=>a.includes("عدم العثور") && a.includes("لا يثبت")));
  const poem=find(3,"core","جزاء المعتدي");
  assert.ok(poem.warningCodes.includes("POEM_MEMORY_AND_ORIGINAL_SOURCE_CHECK"));
});

test("Published worksheet enrichment and unresolved official review story are not certified",()=>{
  const worksheet=find(1,"preparation_worksheet","علم بلادي");
  assert.ok(worksheet.warningCodes.includes("ORIGINAL_WORKSHEET_ENRICHMENT"));
  const review=find(2,"review","الحمامة والنملة");
  assert.ok(review.warningCodes.includes("OFFICIAL_REVIEW_STORY_UNVERIFIED"));
  assert.equal(worksheet.certifiedComplete,false);
  assert.equal(review.certifiedComplete,false);
});

test("Review queue is usable without database access, and prints explicit no-certification warning",()=>{
  const out=execFileSync(process.execPath,[
    "scripts/build-bahrain-ministry-teacher-review-queue.mjs"
  ],{encoding:"utf8"});
  assert.match(out,/BH_OFFICIAL_SELECTED_TOPICS=120/);
  assert.match(out,/P0_SOURCE_CONTENT_REVIEW=/);
  assert.match(out,/HUMAN_REVIEW_COMPLETED=0/);
  assert.match(out,/OFFICIAL_COMPLETION=NOT_CERTIFIED/);
});
