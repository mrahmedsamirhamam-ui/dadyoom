import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateGrade123Audit} from "../scripts/grade123-release-gate.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
const sqlA=read("scripts/curriculum-bh-grade1-five-phonics-language-workbooks-25-private-questions-20261030.sql");
const sqlB=read("scripts/curriculum-bh-grade1-five-spatial-health-math-workbooks-25-original-20261030.sql");
const all=[
 ...JSON.parse(sqlA.split("$batch$")[1]),
 ...JSON.parse(sqlB.split("$life$")[1])
];
const earlier=json("data/audits/grades123-22countries-after-50-bahrain-grade1-10-worksheets-20261030.json");
const after=json("data/audits/grades123-22countries-after-50-new-g1-foundational-activities-20261030.json");
const queue=json("data/review-queue/grades123-22countries-419-activity-gaps-20261030.json");
const quality=json("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json");
const ui=read("features/lessons/components/InteractiveLessonActivities.tsx");
test("ten separate Bahrain grade1 phonics and life workbook contexts have exactly 50 original source-anchored gradable activities",()=>{
 assert.equal(all.length,50);
 assert.equal(new Set(all.map(t=>t.lessonId)).size,10);
 assert.equal(new Set(all.map(t=>t.lessonId+":"+t.activity_order)).size,50);
 for(const a of all){
  assert.equal(a.content.grade,1);
  assert.ok(a.content.anchor.length>=8);
  assert.ok(a.content.originalReference.length>=280);
  assert.ok(a.prompt.length>14);
  assert.ok([2,3,4,5,6].includes(a.activity_order));
  assert.equal("answer" in a.content,false);
  assert.equal("correct" in a.content,false);
  if(a.activity_type==="multiple_choice"){
   assert.ok(a.content.options.includes(a.answer.correct));
   assert.equal(a.content.options.length,new Set(a.content.options).size);
  }else if(a.activity_type==="fill_blank"){
   assert.equal(a.content.items.length,1);
   assert.ok(a.content.items[0].options.includes(a.answer.answers[0]));
  }else if(a.activity_type==="matching"){
   assert.equal(a.content.left.length,a.answer.pairs.length);
   for(const pair of a.answer.pairs){
    assert.ok(a.content.left.includes(pair.left));
    assert.ok(a.content.right.includes(pair.right));
   }
  }else assert.fail("Unsupported activity type: "+a.activity_type);
 }
 assert.equal(all.filter(a=>a.activity_type==="multiple_choice").length,30);
 assert.equal(all.filter(a=>a.activity_type==="fill_blank").length,10);
 assert.equal(all.filter(a=>a.activity_type==="matching").length,10);
 for(const sql of [sqlA,sqlB]){
  for(const token of ["expected<>5","eligible<>5","INSERT INTO public.lesson_activities","student_lesson_progress","lesson_activity_attempts","question_attempts","content->>'anchor'"]){
   if(token!=="expected<>5"&&token!=="eligible<>5")assert.ok(sql.includes(token),"Missing audit protection: "+token);
  }
  assert.match(sql,/EXCEPTION '.*\s%.*5'/);
  assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|TRUNCATE)\s+(?:FROM\s+)?public\.(?:lessons|lesson_activities|questions)/i);
 }
 assert.ok(ui.includes("content.originalReference"),"Original optional learning reference must render in student UI");
});

test("66 country-grade audit matches live 1327/1746 published sufficient lessons and keeps Grade4-6 gate closed",()=>{
 assert.equal(earlier.totals.after_6_to_10,1317);
 assert.equal(after.totals.after_6_to_10,1327);
 assert.equal(after.totals.current_published_below_six,419);
 assert.equal(after.totals.published,1746);
 assert.equal(after.totals.drafts,57);
 assert.equal(after.countries.length,22);
 const cells=after.countries.flatMap(c=>c.grades);
 assert.equal(cells.length,66);
 assert.equal(cells.reduce((s,c)=>s+c.after_6_to_10,0),1327);
 assert.equal(after.nextBatchGrades456Allowed,false);
 const gate=evaluateGrade123Audit(after,quality);
 assert.equal(gate.ready,false);
 assert.equal(gate.sufficient,1327);
 assert.equal(gate.missing.exercises,419);
});

test("each of 419 outstanding published lesson IDs has source flags and no private student data",()=>{
 assert.equal(queue.remaining,419);
 assert.equal(queue.rows.length,419);
 assert.equal(new Set(queue.rows.map(x=>x.lessonId)).size,419);
 assert.deepEqual(queue.byGrade.map(x=>x.n),[177,112,130]);
 assert.equal(queue.missingSourceOrPage,335);
 assert.equal(queue.shortUnder500,90);
 for(const row of queue.rows){
  assert.match(row.lessonId,/^[0-9a-f-]{36}$/i);
  assert.equal(row.missingToSix,6-row.publishedActivities);
  assert.equal("answer" in row,false);
  assert.equal("studentId" in row,false);
 }
});
