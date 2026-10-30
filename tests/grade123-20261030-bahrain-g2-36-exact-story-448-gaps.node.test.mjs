import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateGrade123Audit} from "../scripts/grade123-release-gate.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
const sql=read("scripts/curriculum-bh-grade2-12-original-reading-stories-36-source-exact-questions-20261030.sql");
const tasks=JSON.parse(sql.split("$g2story$")[1]);
const before=json("data/audits/grades123-22countries-after-62-bahrain-grade3-reading-listening-20261030.json");
const after=json("data/audits/grades123-22countries-after-36-bahrain-grade2-reading-20261030.json");
const queue=json("data/review-queue/grades123-22countries-448-activity-gaps-20261030.json");
const quality=json("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json");
const ui=read("features/lessons/components/InteractiveLessonActivities.tsx");

test("36 original source-exact Grade2 MCQs span exactly 12 distinct published Bahrain supporting story lessons",()=>{
 assert.equal(tasks.length,36);
 assert.equal(new Set(tasks.map(t=>t.lessonId)).size,12);
 assert.equal(new Set(tasks.map(t=>t.lessonId+":"+t.activity_order)).size,36);
 assert.equal(new Set(tasks.map(t=>t.lessonId+"|"+t.prompt)).size,36);
 for(const t of tasks){
  assert.equal(t.activity_type,"multiple_choice");
  assert.equal(t.content.grade,2);
  assert.equal(t.content.origin,"DADYOOM_BH_G2_12_STORY_PASSAGES_36_SPECIFIC_MCQ_20261030");
  assert.ok([205,206,207].includes(t.activity_order));
  assert.ok(t.prompt.length>=15);
  assert.ok(t.content.originalText.length>=155);
  assert.equal(t.content.options.length,3);
  assert.equal(new Set(t.content.options).size,3);
  assert.ok(t.content.options.includes(t.answer.correct));
  assert.equal("answer" in t.content,false);
  assert.equal("correct" in t.content,false);
 }
 for(const key of ["eligible<>12","inserted<>36","position(t.content->>'originalText' IN l.content)>0",
   "student_lesson_progress","lesson_activity_attempts","question_attempts","source_pdf_url IS NOT NULL","t.answer,false"]){
  assert.ok(sql.includes(key),"Missing production fail-closed safeguard: "+key);
 }
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|TRUNCATE)\s+(?:FROM\s+)?public\.(?:lessons|lesson_activities|questions)/i);
 assert.ok(ui.includes("content.originalText"));
});

test("fresh SQL audit independently covers all 66 grade-country cells; 1298/1746 pass quantity but 448 remain",()=>{
 assert.equal(before.totals.after_6_to_10,1286);
 assert.equal(after.totals.after_6_to_10,1298);
 assert.equal(after.totals.current_published_below_six,448);
 assert.equal(after.totals.new_published_activities,36);
 assert.equal(after.totals.newly_improved_lessons,12);
 assert.equal(after.totals.total,1803);
 assert.equal(after.totals.published,1746);
 assert.equal(after.totals.drafts,57);
 assert.equal(after.countries.length,22);
 const all=after.countries.flatMap(c=>c.grades);
 assert.equal(all.length,66);
 assert.equal(all.reduce((s,c)=>s+c.after_6_to_10,0),1298);
 assert.equal(after.nextBatchGrades456Allowed,false);
 const gate=evaluateGrade123Audit(after,quality);
 assert.equal(gate.ready,false);
 assert.equal(gate.sufficient,1298);
 assert.equal(gate.missing.exercises,448);
});

test("448 unpublished-quality-gate lesson entries have distinct real IDs and preserve unresolved official sources",()=>{
 assert.equal(queue.remaining,448);
 assert.equal(queue.rows.length,448);
 assert.equal(new Set(queue.rows.map(l=>l.lessonId)).size,448);
 assert.deepEqual(queue.byGrade.map(x=>x.n),[197,121,130]);
 assert.equal(queue.missingSourceOrPage,335);
 assert.equal(queue.shortUnder500,90);
 for(const l of queue.rows){
  assert.match(l.lessonId,/^[0-9a-f-]{36}$/i);
  assert.ok([1,2,3].includes(l.grade));
  assert.equal(l.missingToSix,6-l.publishedActivities);
  assert.equal("answer" in l,false);
  assert.equal("studentId" in l,false);
 }
});
