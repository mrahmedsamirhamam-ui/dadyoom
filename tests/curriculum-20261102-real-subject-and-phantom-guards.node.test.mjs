import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const safe=fs.readFileSync("scripts/curriculum-unpublish-14-unverified-book-or-ocr-headings-20261102.sql","utf8");
const subject=fs.readFileSync("scripts/curriculum-bh-g2-four-reading-speaking-subjects-20261102.sql","utf8");
test("14 phantom lessons are draft-only, not deleted, with student history guards",()=>{
 assert.match(safe,/IF total<>14/);
 assert.match(safe,/changed<>14/);
 assert.match(safe,/status='draft'/);
 assert.ok(!/\bDELETE FROM\b|\bTRUNCATE\b/i.test(safe));
 assert.ok(safe.includes("student_lesson_progress"));
 assert.ok(safe.includes("question_attempts"));
 assert.ok(safe.includes("lesson_activity_attempts"));
 assert.ok(safe.includes("l.title<>x.exact_title"));
 const matches=[...safe.matchAll(/'([0-9a-f-]{36})'::uuid,'(TN|BH)',(\d+),'([^']+)','(empty-book-heading|ocr-section-heading|ocr-section-instruction)'/g)];
 assert.equal(matches.length,14);
 assert.equal(matches.filter(x=>x[2]==="TN").length,8);
 assert.equal(matches.filter(x=>x[2]==="BH").length,6);
 assert.equal(new Set(matches.map(x=>x[1])).size,14);
 assert.ok(!safe.includes("cdc5231f-db11-4244-9a30-22b5a568a181"));
});
test("four grade2 lessons receive individualized official speaking-topic subject text",()=>{
 const subjects=[...subject.matchAll(/\$topic\d+\$([\s\S]*?)\$topic\d+\$/g)].map(x=>x[1]);
 assert.equal(subjects.length,4);
 const expected=["صديقات في المدرسة","أساعد الكبار","في حيّنا","مشاهد من بلادي"];
 for(let i=0;i<4;i++){
  assert.ok(subjects[i].length>1400);
  assert.ok(subjects[i].includes(expected[i]));
  for(const part of ["أولًا: أفهم موضوع التحدّث","ثانيًا: أستمع إلى نموذج حوار أصلي","ثالثًا: أشرح المفردات والمعنى","رابعًا: أبني حديثًا مترابطًا","خامسًا: أتأكد من فهمي"])
   assert.ok(subjects[i].includes(part));
  assert.ok(subjects[i].includes("ليست نص الكتاب الوزاري"));
 }
 assert.ok(subject.includes("IF n<>4"));
 assert.ok(subject.includes("g.grade_number<>2"));
 assert.ok(subject.includes("c.code<>'BH'"));
 assert.ok(subject.includes("question_attempts"));
 assert.ok(subject.includes("student_lesson_progress"));
 assert.ok(!/\bDELETE FROM\b|\bTRUNCATE\b/i.test(subject));
});
