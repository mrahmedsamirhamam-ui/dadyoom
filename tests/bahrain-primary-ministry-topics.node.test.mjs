import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const official = JSON.parse(readFileSync("data/curriculum-audits/bh-2026-2027-g1-g3-s1-official-topic-index.json","utf8"));
const snapshot = JSON.parse(readFileSync("data/curriculum-audits/bh-2026-2027-g1-g3-s1-production-topic-snapshot.json","utf8"));
const report = JSON.parse(execFileSync(process.execPath,["scripts/compare-bahrain-primary-ministry-topics.mjs","--json"],{encoding:"utf8"}));
const find = (grade,kind,index) => report.comparisons.find(x =>
  x.grade === grade && x.category === kind &&
  x.officialId.endsWith("-"+String(index).padStart(2,"0")));

test("Official BH 2026/27 first-term source is specific and selected grade-one-through-three topics are uniquely keyed",()=>{
  assert.equal(official.country,"BH");
  assert.equal(official.year,"2026-2027");
  assert.equal(official.semester,1);
  assert.equal(official.humanVerifiedMinistryContent,false);
  assert.equal(official.officialFullCoverageCertified,false);
  assert.equal(official.items.length,120);
  assert.equal(new Set(official.items.map(x=>x.id)).size,official.items.length);
  assert.match(official.officialPlanUrl,/edunet\.bh\/manual\/plans1-2026-2027\/Arabic\/Plan1\.pdf/);
  assert.ok(official.items.every(x=>x.sourcePdf===official.officialPlanUrl &&
    x.verification==="MINISTRY_PLAN_TITLE_EXTRACTED_CONTENT_NOT_REVIEWED"));
  assert.equal(official.items.filter(x=>x.grade===1 && x.category==="preparation_worksheet").length,59);
  assert.equal(official.items.filter(x=>x.grade===1 && x.category==="core").length,15);
  assert.equal(official.items.filter(x=>x.grade===2 && x.category==="core").length,12);
  assert.equal(official.items.filter(x=>x.grade===3 && x.category==="core").length,12);
});

test("Only nonpersonal published lesson-title snapshot is checked in and source-only audit cannot claim 100%",()=>{
  assert.equal(snapshot.lessonRows.length,204);
  assert.equal(snapshot.lessonRows.filter(x=>x.status==="published").length,147);
  assert.ok(snapshot.lessonRows.every(x=>!Object.hasOwn(x,"id") &&
    !Object.hasOwn(x,"email") && !Object.hasOwn(x,"user_id") && !Object.hasOwn(x,"content")));
  assert.equal(report.summary.officialTopicChecks,120);
  assert.equal(report.summary.localPublishedRows,147);
  assert.equal(report.summary.certifiedOfficialCoveragePercent,null);
  assert.equal(report.summary.contentReviewedTopics,0);
  assert.ok(report.comparisons.every(x=>x.certifiedComplete===false &&
    x.sourceContentAlignment==="NOT_HUMAN_REVIEWED"));
});

test("Core primary topic labels are found, but title presence does not certify the official book text",()=>{
  assert.ok(find(1,"core",1).publishedTitleCandidates.some(x=>x.includes("حرف (ب) (1)")));
  assert.ok(find(1,"core",15).publishedTitleCandidates.some(x=>x.includes("مكتسباتي")));
  assert.ok(find(2,"core",1).publishedTitleCandidates.some(x=>x.includes("صديقتي مريم")));
  assert.ok(find(2,"core",7).publishedTitleCandidates.some(x=>x.includes("محم")));
  assert.ok(find(3,"core",1).publishedTitleCandidates.some(x=>x.includes("الأصدقاء الأربعة")));
  assert.ok(find(3,"core",12).publishedTitleCandidates.some(x=>x.includes("توماس")));
});

test("Published alternative reading text is flagged as a content gap, not a completed ministry lesson",()=>{
  assert.equal(find(2,"core",1).status,"PUBLISHED_TITLE_WITH_EXPLICIT_NON_MINISTRY_TEXT");
  assert.equal(find(3,"core",1).status,"PUBLISHED_TITLE_WITH_EXPLICIT_NON_MINISTRY_TEXT");
  assert.equal(find(3,"core",11).status,"PUBLISHED_TITLE_WITH_EXPLICIT_NON_MINISTRY_TEXT");
  assert.ok(report.summary.explicitNonMinistrySubstitutionTopics >= 18);
});

test("Reading review stories are not credited merely because same numbered skill is published",()=>{
  const reading1 = find(2,"review",1);
  const reading2 = find(2,"review",6);
  assert.match(reading1.status,/REVIEW_SKILL_NUMBER_FOUND_SPECIFIC_TOPIC_NOT_IN_TITLE/);
  assert.match(reading2.status,/REVIEW_SKILL_NUMBER_FOUND_SPECIFIC_TOPIC_NOT_IN_TITLE/);
  assert.ok(reading1.publishedTitleCandidates.length>=1);
  assert.ok(reading2.publishedTitleCandidates.length>=1);
  const grammar1=find(2,"review",3);
  const grammar2=find(2,"review",8);
  assert.ok(grammar1.publishedTitleCandidates.length>=1);
  assert.ok(grammar2.publishedTitleCandidates.length>=1);
  assert.match(grammar1.status,/REVIEW_SKILL_NUMBER_FOUND_SPECIFIC_TOPIC_NOT_IN_TITLE/);
});

test("OCR-damaged draft fragments are highlighted and never treated as a missing official textbook lesson",()=>{
  assert.ok(report.summary.shortOrGarbleDraftCandidates>0);
  assert.ok(report.draftTitleAnomalies.some(x=>x.grade===2));
  assert.ok(report.draftTitleAnomalies.some(x=>x.grade===3));
  assert.ok(report.summary.titleMatchesWithoutContentCertification<=120);
  assert.ok(report.comparisons.every(x=>!x.status.includes("CERTIFIED")));
});

test("Readable output explicitly disclaims official coverage",()=>{
  const out=execFileSync(process.execPath,["scripts/compare-bahrain-primary-ministry-topics.mjs"],{encoding:"utf8"});
  assert.match(out,/MINISTRY_TOPIC_CHECKS=120/);
  assert.match(out,/EXPLICIT_DIFFERENT_TEXT_TOPICS=/);
  assert.match(out,/CERTIFIED_OFFICIAL_COVERAGE=NOT_VERIFIED/);
});
