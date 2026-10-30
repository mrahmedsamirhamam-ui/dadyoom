import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateGrade123Audit} from "../scripts/grade123-release-gate.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
const sql=read("scripts/curriculum-bh-g1-10-original-worksheet-pages-50-topic-specific-activities-20261030.sql");
const tasks=JSON.parse(sql.split("$g1work$")[1]);
const before=json("data/audits/grades123-22countries-after-27-bahrain-grade2-nine-prose-lessons-20261030.json");
const after=json("data/audits/grades123-22countries-after-50-bahrain-grade1-10-worksheets-20261030.json");
const review=json("data/review-queue/grades123-22countries-429-activity-gaps-20261030.json");
const quality=json("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json");
const ui=read("features/lessons/components/InteractiveLessonActivities.tsx");
test("50 original differentiated child-friendly activities have exactly ten distinct Bahrain Grade1 worksheet page sources",()=>{
 assert.equal(tasks.length,50);
 assert.equal(new Set(tasks.map(t=>t.lessonId)).size,10);
 assert.equal(new Set(tasks.map(t=>t.page)).size,10);
 assert.equal(new Set(tasks.map(t=>t.lessonId+":"+t.activity_order)).size,50);
 for(const t of tasks){
  assert.equal(t.content.grade,1);
  assert.equal(t.content.origin,"DADYOOM_BH_G1_10_REMAINING_WORKSHEET_PAGES_50_ORIGINAL_20261030");
  assert.ok(t.content.originalReference.length>=260);
  assert.ok(t.prompt.length>=15);
  assert.ok([2,3,4,5,6].includes(t.activity_order));
  assert.equal("answer" in t.content,false);
  assert.equal("correct" in t.content,false);
  if(t.activity_type==="multiple_choice"){
   assert.ok(t.content.options.includes(t.answer.correct));
   assert.equal(new Set(t.content.options).size,t.content.options.length);
  }else if(t.activity_type==="fill_blank"){
   assert.equal(t.content.items.length,1);
   assert.ok(t.content.items[0].options.includes(t.answer.answers[0]));
  }else if(t.activity_type==="matching"){
   assert.equal(t.content.left.length,t.answer.pairs.length);
   for(const pair of t.answer.pairs) assert.ok(t.content.left.includes(pair.left)&&t.content.right.includes(pair.right));
  }else assert.fail("Unsupported activity type: "+t.activity_type);
 }
 for(const check of ["eligible<>10","inserted<>50","student_lesson_progress","lesson_activity_attempts","question_attempts","l.source_pdf_url IS NOT NULL","t.answer,false"]){
  assert.ok(sql.includes(check),"Missing production safeguard: "+check);
 }
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|TRUNCATE)\s+(?:FROM\s+)?public\.(?:lessons|lesson_activities|questions)/i);
 assert.ok(ui.includes("content.originalReference"));
});
test("66 checked country/grade cells show 1317/1746 sufficient published Grade1-3 lessons and release remains blocked",()=>{
 assert.equal(before.totals.after_6_to_10,1307);
 assert.equal(after.totals.after_6_to_10,1317);
 assert.equal(after.totals.current_published_below_six,429);
 assert.equal(after.totals.new_published_activities,50);
 assert.equal(after.totals.newly_improved_lessons,10);
 assert.equal(after.totals.published,1746);
 assert.equal(after.totals.total,1803);
 assert.equal(after.totals.drafts,57);
 assert.equal(after.countries.length,22);
 const cells=after.countries.flatMap(c=>c.grades);
 assert.equal(cells.length,66);
 assert.equal(cells.reduce((n,c)=>n+c.after_6_to_10,0),1317);
 assert.equal(after.nextBatchGrades456Allowed,false);
 const gate=evaluateGrade123Audit(after,quality);
 assert.equal(gate.ready,false);
 assert.equal(gate.sufficient,1317);
 assert.equal(gate.missing.exercises,429);
});
test("429 unfinished lesson IDs are real and source gaps stay visible",()=>{
 assert.equal(review.remaining,429);
 assert.equal(review.rows.length,429);
 assert.equal(new Set(review.rows.map(x=>x.lessonId)).size,429);
 assert.deepEqual(review.byGrade.map(x=>x.n),[187,112,130]);
 assert.equal(review.missingSourceOrPage,335);
 assert.equal(review.shortUnder500,90);
 for(const x of review.rows){
  assert.match(x.lessonId,/^[0-9a-f-]{36}$/i);
  assert.equal(x.missingToSix,6-x.publishedActivities);
  assert.equal("answer" in x,false);
  assert.equal("studentId" in x,false);
 }
});
