import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {buildGrade123Queue} from "../lib/ministerial-audit/grade123-queue.mjs";

const snapshot=JSON.parse(fs.readFileSync("data/ministerial-audit/2026-11-04-live-grade123-all22-source-body-triage.json","utf8"));
test("snapshot covers all 22 countries and 66 country-grade cells without manufactured syllabus completion",()=>{
 const q=buildGrade123Queue(snapshot);
 assert.equal(q.countries,22);
 assert.equal(q.gradeCells,66);
 assert.equal(q.jobs.length,66);
 assert.equal(q.officialFullYearCertified,false);
 assert.equal(q.reviewedBookTocs,0);
 assert.ok(q.jobs.every(r=>r.officialComplete===false));
 assert.ok(q.jobs.every(r=>r.nextChecks.includes("RECONCILE_COMPLETE_OFFICIAL_LESSON_TOPICS_AND_PUBLIC_PAGE")));
});
test("2026-11-04 snapshot keeps published term-unassigned and timetable source counts visible",()=>{
 const q=buildGrade123Queue(snapshot);
 assert.equal(q.jobs.reduce((sum,r)=>sum+r.published,0),1741);
 assert.equal(q.jobs.reduce((sum,r)=>sum+r.unassignedPublished,0),1320);
 assert.equal(q.jobs.reduce((sum,r)=>sum+r.planLinks,0),175);
 const bh=q.jobs.find(r=>r.country==="BH"&&r.grade===1);
 assert.equal(bh.sequence,1);
 assert.ok(bh.nextChecks.includes("REPLACE_SCHEDULE_ONLY_CITATIONS_WITH_REVIEWED_TEXTBOOK_EVIDENCE"));
 assert.ok(q.jobs.some(r=>r.country==="PS"&&r.nextChecks.includes("SEPARATE_PARTIAL_EDUCATIONAL_PACK_FROM_COMPLETE_STUDENT_BOOK")));
});
test("live editorial queue captures 31 generic short subjects and 12 yearless Egyptian lessons",()=>{
 const q=JSON.parse(fs.readFileSync("data/ministerial-audit/2026-11-04-g123-yearless-and-short-subject-review.json","utf8"));
 assert.equal(q.summary.shortBodies,31);
 assert.equal(q.summary.unknownYearPublished,12);
 assert.equal(q.summary.commonCrossCountryTitleGradeCombos,54);
 assert.equal(q.summary.totalCommonRows,1188);
 assert.ok(q.shorts.every(v=>v.lesson_id&&v.characters>0&&v.characters<400));
 assert.ok(q.unknownYear.every(v=>v.country==="EG"&&v.grade===2));
 assert.equal(new Set(q.unknownYear.map(v=>v.lesson_id)).size,12);
 assert.equal(q.certification.ministerialComplete,false);
});

test("missing country-grade, invalid grade and duplicate input cannot become a certified list",()=>{
 assert.throws(()=>buildGrade123Queue({...snapshot,rows:snapshot.rows.filter(r=>r.country!=="YE")}),/MISSING_COUNTRIES/);
 assert.throws(()=>buildGrade123Queue({...snapshot,rows:snapshot.rows.filter(r=>!(r.country==="BH"&&r.grade===3))}),/66_COUNTRY_GRADE_CELLS/);
 assert.throws(()=>buildGrade123Queue({...snapshot,rows:[...snapshot.rows,{...snapshot.rows[0],grade:5}]}),/INVALID_G123_SCOPE/);
});
