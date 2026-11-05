import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {buildGrade123Queue} from "../lib/ministerial-audit/grade123-queue.mjs";
const snapshot=JSON.parse(fs.readFileSync("data/ministerial-audit/2026-11-05-live-grade123-all22-source-body-triage.json","utf8"));
const editorial=JSON.parse(fs.readFileSync("data/ministerial-audit/2026-11-05-short-and-yearless-subject-cases.json","utf8"));
test("2026-11-05 live SQL checkpoint covers 22 countries and 66 grades without declaring official completeness",()=>{
 const q=buildGrade123Queue(snapshot,editorial);
 assert.equal(q.countries,22);
 assert.equal(q.gradeCells,66);
 assert.equal(q.jobs.length,66);
 assert.equal(q.officialFullYearCertified,false);
 assert.equal(q.reviewedBookTocs,0);
 assert.ok(q.jobs.every(j=>j.officialComplete===false));
 assert.equal(q.jobs.reduce((n,j)=>n+j.published,0),1741);
 assert.equal(q.jobs.reduce((n,j)=>n+j.drafts,0),87);
 assert.equal(q.jobs.reduce((n,j)=>n+j.unassignedPublished,0),1320);
 assert.equal(q.jobs.reduce((n,j)=>n+j.shortLessonReviewIds.length,0),31);
 assert.equal(q.jobs.reduce((n,j)=>n+j.unknownCurriculumYearLessonIds.length,0),12);
 assert.equal(q.jobs.reduce((n,j)=>n+j.planLinks,0),175);
 assert.equal(q.jobs.reduce((n,j)=>n+j.partialPackLinks,0),8);
 assert.equal(q.jobs.find(j=>j.country==="BH"&&j.grade===1).sequence,1);
});
test("generic domain pages and unknown-year lessons remain identifiable and unverified",()=>{
 assert.equal(editorial.summary.shortBodies,31);
 assert.equal(editorial.summary.unknownYearPublished,12);
 assert.equal(editorial.shorts.filter(x=>/مجالات اللغة العربية/.test(x.unit_title)).length,31);
 assert.equal(new Set(editorial.shorts.map(x=>x.lesson_id)).size,31);
 assert.equal(new Set(editorial.unknownYear.map(x=>x.lesson_id)).size,12);
 assert.ok(editorial.unknownYear.every(x=>x.country==="EG"&&x.grade===2));
 assert.equal(editorial.certification.ministerialComplete,false);
 assert.equal(snapshot.summary.term_conflicts,0); // If this changes, inspect source, do not silently reassign.
});
