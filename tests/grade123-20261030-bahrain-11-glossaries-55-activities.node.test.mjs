import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateGrade123Audit} from "../scripts/grade123-release-gate.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
const sql=read("scripts/curriculum-bahrain-grade1-11-distinct-glossaries-55-optional-exercises-20261030.sql");
const tasks=JSON.parse(sql.split("$glossary$")[1]);
const before=json("data/audits/grades123-22countries-after-198-listening-activities-20261030.json");
const after=json("data/audits/grades123-22countries-after-55-bahrain-glossary-activities-20261030.json");
const queue=json("data/review-queue/grades123-22countries-507-activity-gaps-20261030.json");
const quality=json("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json");

test("eleven explicitly scoped and individually authored original glossary exercises include no secret keys in public content",()=>{
 assert.equal(tasks.length,55);
 assert.equal(new Set(tasks.map(t=>t.lessonId)).size,11);
 assert.equal(new Set(tasks.map(t=>t.page)).size,11);
 assert.equal(new Set(tasks.map(t=>t.lessonId+":"+t.activity_order)).size,55);
 for(const t of tasks){
  assert.ok([2,3,4,5,6].includes(t.activity_order));
  assert.ok(t.content.originalReference.length>160);
  assert.equal(t.content.origin,"DADYOOM_BH_G1_11_GLOSSARY_55_ORIGINAL_OPTIONAL_20261030");
  assert.equal("answer" in t.content,false);
  assert.equal("correct" in t.content,false);
  if(t.activity_type==="multiple_choice") {
   assert.equal(new Set(t.content.options).size,3);
   assert.ok(t.content.options.includes(t.answer.correct));
  } else if(t.activity_type==="fill_blank") {
   assert.ok(t.content.items[0].options.includes(t.answer.answers[0]));
  } else if(t.activity_type==="matching") {
   assert.equal(t.answer.pairs.length,3);
   assert.ok(t.answer.pairs.every(p=>t.content.left.includes(p.left)&&t.content.right.includes(p.right)));
  } else {
   assert.fail("Unhandled learner activity "+t.activity_type);
  }
 }
 assert.match(sql,/inserted<>55/);
 assert.match(sql,/real_lessons<>11/);
 assert.match(sql,/student_lesson_progress/);
 assert.match(sql,/lesson_activity_attempts/);
 assert.match(sql,/question_attempts/);
 assert.match(sql,/t\.answer,false/);
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|TRUNCATE)\s+(?:FROM\s+)?public\.(?:lessons|lesson_activities|questions|student_lesson_progress)/i);
});

test("real 66-cell coverage is 1239/1746; remaining 507; stop Grade4-6 release",()=>{
 assert.equal(before.totals.after_6_to_10,1228);
 assert.equal(after.totals.after_6_to_10,1239);
 assert.equal(after.totals.published,1746);
 assert.equal(after.totals.drafts,57);
 assert.equal(after.totals.new_published_activities,55);
 assert.equal(after.totals.current_published_below_six,507);
 assert.equal(after.countries.length,22);
 assert.equal(after.countries.flatMap(c=>c.grades).reduce((n,g)=>n+g.after_6_to_10,0),1239);
 const gate=evaluateGrade123Audit(after,quality);
 assert.equal(gate.ready,false);
 assert.equal(gate.sufficient,1239);
 assert.equal(gate.missing.exercises,507);
 assert.equal(after.nextBatchGrades456Allowed,false);
});

test("all 507 outstanding lesson IDs remain unique and classified by grade",()=>{
 assert.equal(queue.remaining,507);
 assert.equal(queue.rows.length,507);
 assert.equal(new Set(queue.rows.map(r=>r.lessonId)).size,507);
 assert.deepEqual(queue.byGrade.map(g=>g.n),[223,140,144]);
 assert.equal(queue.missingSourceOrPage,335);
 assert.equal(queue.shortUnder500,90);
 for(const r of queue.rows) {
  assert.match(r.lessonId,/^[0-9a-f-]{36}$/i);
  assert.ok([1,2,3].includes(r.grade));
  assert.equal(r.missingToSix,6-r.publishedActivities);
  assert.equal("answer" in r,false);
 }
});
