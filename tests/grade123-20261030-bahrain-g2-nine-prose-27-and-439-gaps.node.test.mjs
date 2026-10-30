import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateGrade123Audit} from "../scripts/grade123-release-gate.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
const sql=read("scripts/curriculum-bh-g2-9-independent-original-reading-stories-27-evidence-questions-20261030.sql");
const tasks=JSON.parse(sql.split("$g2prose$")[1]);
const before=json("data/audits/grades123-22countries-after-36-bahrain-grade2-reading-20261030.json");
const after=json("data/audits/grades123-22countries-after-27-bahrain-grade2-nine-prose-lessons-20261030.json");
const queue=json("data/review-queue/grades123-22countries-439-activity-gaps-20261030.json");
const quality=json("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json");
const ui=read("features/lessons/components/InteractiveLessonActivities.tsx");

test("nine independently authored Bahrain Grade2 prose stories get 27 unique original graded context questions",()=>{
 assert.equal(tasks.length,27);
 assert.equal(new Set(tasks.map(t=>t.lessonId)).size,9);
 assert.equal(new Set(tasks.map(t=>t.lessonId+":"+t.activity_order)).size,27);
 assert.equal(new Set(tasks.map(t=>t.lessonId+"|"+t.prompt)).size,27);
 for(const t of tasks){
  assert.equal(t.activity_type,"multiple_choice");
  assert.equal(t.content.grade,2);
  assert.equal(t.content.origin,"DADYOOM_BH_G2_NINE_READING_STORIES_27_SOURCE_EXACT_20261030");
  assert.ok([4,5,6].includes(t.activity_order));
  assert.ok(t.prompt.length>=15);
  assert.ok(t.content.originalText.length>=170);
  assert.equal(t.content.options.length,3);
  assert.equal(new Set(t.content.options).size,3);
  assert.ok(t.content.options.includes(t.answer.correct));
  assert.equal("answer" in t.content,false);
  assert.equal("correct" in t.content,false);
 }
 for(const s of ["eligible<>9","inserted<>27","position(t.content->>'originalText' IN l.content)>0",
 "student_lesson_progress","lesson_activity_attempts","question_attempts","l.source_pdf_url IS NOT NULL","t.answer,false"]){
  assert.ok(sql.includes(s),"SQL missing source/history/private-key safeguard: "+s);
 }
 assert.ok(ui.includes("content.originalText"));
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|TRUNCATE)\s+(?:FROM\s+)?public\.(?:lessons|lesson_activities|questions)/i);
});

test("verified 66-cell country-grade audit reaches 1307 of 1746 published with 439 pending and 57 unchanged drafts",()=>{
 assert.equal(before.totals.after_6_to_10,1298);
 assert.equal(after.totals.after_6_to_10,1307);
 assert.equal(after.totals.current_published_below_six,439);
 assert.equal(after.totals.new_published_activities,27);
 assert.equal(after.totals.newly_improved_lessons,9);
 assert.equal(after.totals.total,1803);
 assert.equal(after.totals.published,1746);
 assert.equal(after.totals.drafts,57);
 assert.equal(after.countries.length,22);
 const cells=after.countries.flatMap(c=>c.grades);
 assert.equal(cells.length,66);
 assert.equal(cells.reduce((sum,x)=>sum+x.after_6_to_10,0),1307);
 assert.equal(after.nextBatchGrades456Allowed,false);
 const gate=evaluateGrade123Audit(after,quality);
 assert.equal(gate.ready,false);
 assert.equal(gate.sufficient,1307);
 assert.equal(gate.missing.exercises,439);
});

test("review list remains a true unique lesson-level evidence register, not fabricated official coverage",()=>{
 assert.equal(queue.remaining,439);
 assert.equal(queue.rows.length,439);
 assert.equal(new Set(queue.rows.map(x=>x.lessonId)).size,439);
 assert.deepEqual(queue.byGrade.map(x=>x.n),[197,112,130]);
 assert.equal(queue.missingSourceOrPage,335);
 assert.equal(queue.shortUnder500,90);
 for(const x of queue.rows){
  assert.match(x.lessonId,/^[0-9a-f-]{36}$/i);
  assert.ok([1,2,3].includes(x.grade));
  assert.equal(x.missingToSix,6-x.publishedActivities);
  assert.equal("answer" in x,false);
  assert.equal("studentId" in x,false);
 }
});
