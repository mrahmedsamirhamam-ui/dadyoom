import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateGrade123Audit} from "../scripts/grade123-release-gate.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
const journalSql=read("scripts/curriculum-bh-g1-5-learning-journals-25-source-specific-activities-20261030.sql");
const letterSql=read("scripts/curriculum-bh-g1-9-verified-letter-lessons-single-phonics-questions-20261030.sql");
const journalRows=JSON.parse(journalSql.split("$journals$")[1]);
const letterRows=JSON.parse(letterSql.split("$letters$")[1]);
const before=json("data/audits/grades123-22countries-after-55-bahrain-glossary-activities-20261030.json");
const after=json("data/audits/grades123-22countries-after-34-bahrain-journal-phonics-activities-20261030.json");
const queue=json("data/review-queue/grades123-22countries-493-activity-gaps-20261030.json");
const quality=json("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json");

test("all 25 original Bahrain learning journals are individually sourced, optionally graded and private",()=>{
 assert.equal(journalRows.length,25);
 assert.equal(new Set(journalRows.map(x=>x.lessonId)).size,5);
 assert.equal(new Set(journalRows.map(x=>x.sourcePage)).size,5);
 assert.equal(new Set(journalRows.map(x=>x.lessonId+":"+x.activity_order)).size,25);
 for(const r of journalRows) {
  assert.equal(r.content.origin,"DADYOOM_BH_G1_5_LEARNING_JOURNALS_25_ORIGINAL_20261030");
  assert.ok(r.content.originalReference.length>180);
  assert.ok([2,3,4,5,6].includes(r.activity_order));
  assert.equal("answer" in r.content,false);
  assert.equal("correct" in r.content,false);
  if(r.activity_type==="multiple_choice") {
   assert.equal(new Set(r.content.options).size,3);
   assert.ok(r.content.options.includes(r.answer.correct));
  } else if(r.activity_type==="fill_blank") {
   assert.ok(r.content.items[0].options.includes(r.answer.answers[0]));
  } else if(r.activity_type==="matching") {
   assert.equal(r.answer.pairs.length,3);
   assert.ok(r.answer.pairs.every(p=>r.content.left.includes(p.left) && r.content.right.includes(p.right)));
  } else assert.fail("Unknown exercise type");
 }
 assert.match(journalSql,/verified<>5/);
 assert.match(journalSql,/inserted<>25/);
 assert.match(journalSql,/student_lesson_progress/);
 assert.match(journalSql,/lesson_activity_attempts/);
 assert.match(journalSql,/question_attempts/);
 assert.match(journalSql,/t\.answer,false/);
});

test("nine safe Bahrain grade1 letter position questions match exact known lesson and source page",()=>{
 assert.equal(letterRows.length,9);
 assert.equal(new Set(letterRows.map(x=>x.lessonId)).size,9);
 assert.equal(new Set(letterRows.map(x=>x.lessonTitle)).size,9);
 for(const r of letterRows) {
  assert.equal(r.activity_order,207);
  assert.equal(r.activity_type,"multiple_choice");
  assert.equal(r.content.origin,"DADYOOM_BH_G1_9_LETTER_SOUND_CONTEXT_20261030");
  assert.ok(r.content.originalReference.length>180);
  assert.equal(new Set(r.content.options).size,3);
  assert.ok(r.content.options.includes(r.answer.correct));
  assert.equal("answer" in r.content,false);
  assert.equal("correct" in r.content,false);
 }
 assert.match(letterSql,/eligible<>9/);
 assert.match(letterSql,/inserted<>9/);
 assert.match(letterSql,/max\(activity_order\).*206/si);
 assert.match(letterSql,/student_lesson_progress/);
 assert.match(letterSql,/lesson_activity_attempts/);
 assert.match(letterSql,/question_attempts/);
 assert.match(letterSql,/t\.answer,false/);
});

test("live country-grade audit upgraded from 1239 to 1253 and 493 remaining, without false completion",()=>{
 assert.equal(before.totals.after_6_to_10,1239);
 assert.equal(after.totals.after_6_to_10,1253);
 assert.equal(after.totals.new_published_activities,34);
 assert.equal(after.totals.newly_improved_lessons,14);
 assert.equal(after.totals.current_published_below_six,493);
 assert.equal(after.totals.published,1746);
 assert.equal(after.totals.drafts,57);
 assert.equal(after.countries.length,22);
 assert.equal(after.countries.flatMap(x=>x.grades).length,66);
 assert.equal(after.countries.flatMap(x=>x.grades).reduce((n,g)=>n+g.after_6_to_10,0),1253);
 const gate=evaluateGrade123Audit(after,quality);
 assert.equal(gate.ready,false);
 assert.equal(gate.sufficient,1253);
 assert.equal(gate.missing.exercises,493);
 assert.equal(after.nextBatchGrades456Allowed,false);
});

test("493 residual Grade1-3 lessons have unique real identifiers and unapproved sources",()=>{
 assert.equal(queue.remaining,493);
 assert.equal(queue.rows.length,493);
 assert.equal(new Set(queue.rows.map(x=>x.lessonId)).size,493);
 assert.deepEqual(queue.byGrade.map(x=>x.n),[209,140,144]);
 assert.equal(queue.missingSourceOrPage,335);
 assert.equal(queue.shortUnder500,90);
 for(const x of queue.rows){
  assert.match(x.lessonId,/^[0-9a-f-]{36}$/i);
  assert.ok([1,2,3].includes(x.grade));
  assert.ok(x.publishedActivities>=0&&x.publishedActivities<6);
  assert.equal(x.missingToSix,6-x.publishedActivities);
  assert.equal("answer" in x,false);
  assert.equal("studentId" in x,false);
 }
});
