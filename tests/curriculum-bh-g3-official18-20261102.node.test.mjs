import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const manifest=JSON.parse(fs.readFileSync("data/ministerial-audit/cases/BH-G3-T1-2026-27-18-headings-vs-live-records-20261102.json","utf8"));
test("18 actual Grade3 Ministry schedule headings map to 18 unique Dadyoom published records",()=>{
 const a=manifest.matches;
 assert.equal(a.length,18);
 assert.equal(new Set(a.map(x=>x.dadyoomId)).size,18);
 assert.equal(a.filter(x=>x.type==="listening").length,3);
 assert.equal(a.filter(x=>x.type==="speaking").length,3);
 assert.equal(a.filter(x=>x.type==="reading").length,9);
 assert.equal(a.filter(x=>x.type==="poetry").length,3);
 assert.ok(a.every(x=>x.dadyoomPublishedAtAudit===true));
 assert.ok(a.every(x=>x.printedBookPageRange&&x.officialScheduledHeading&&x.dadyoomId));
});
test("Ministry syllabus plan cannot falsely mark actual textbook story, poem or lesson complete",()=>{
 assert.equal(manifest.source.documentType,"official_lesson_schedule");
 assert.equal(manifest.result.originalMinistryTextBookLessonContentVerified,0);
 assert.ok(manifest.matches.every(x=>x.officialSubjectTextVerified===false));
 assert.ok(manifest.matches.filter(x=>x.type==="poetry").every(x=>x.originalPoetryVersesVerified===false));
 assert.equal(manifest.result.poetryTextsToVerify,3);
});
