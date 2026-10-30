import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateGrade123Audit} from "../scripts/grade123-release-gate.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
const listenSql=read("scripts/curriculum-bh-g3-6-original-listening-passages-30-comprehension-20261030.sql");
const readingSql=read("scripts/curriculum-bh-g3-8-source-exact-reading-passages-32-comprehension-20261030.sql");
const listening=JSON.parse(listenSql.split("$g3script$")[1]);
const reading=JSON.parse(readingSql.split("$g3reading$")[1]);
const prev=json("data/audits/grades123-22countries-after-35-bahrain-grade2-listening-20261030.json");
const after=json("data/audits/grades123-22countries-after-62-bahrain-grade3-reading-listening-20261030.json");
const queue=json("data/review-queue/grades123-22countries-460-activity-gaps-20261030.json");
const quality=json("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json");
const ui=read("features/lessons/components/InteractiveLessonActivities.tsx");
const publicClient=read("features/lesson-activities/services/public-lesson-activities.ts");

test("six authored Grade3 teacher-guided listening passages have 30 private-graded, unique comprehension questions",()=>{
 assert.equal(listening.length,30);
 assert.equal(new Set(listening.map(x=>x.lessonId)).size,6);
 assert.equal(new Set(listening.map(x=>x.lessonId+":"+x.activity_order)).size,30);
 assert.equal(new Set(listening.map(x=>x.lessonId+"|"+x.prompt)).size,30);
 for (const a of listening){
  assert.equal(a.activity_type,"listening");
  assert.equal(a.content.grade,3);
  assert.equal(a.content.requiresTeacherRead,true);
  assert.ok(a.content.text.length>=160);
  assert.equal(a.content.listeningQuestion,a.prompt);
  assert.equal(a.content.origin,"DADYOOM_BH_G3_SIX_DISTINCT_LISTENING_STORIES_30_ORIGINAL_20261030");
  assert.equal(a.content.options.length,3);
  assert.equal(new Set(a.content.options).size,3);
  assert.ok(a.content.options.includes(a.answer.correct));
  assert.equal("answer" in a.content,false);
  assert.equal("correct" in a.content,false);
  assert.ok([2,3,4,5,6].includes(a.activity_order));
 }
 for(const token of ["eligible<>6","inserted<>30","student_lesson_progress","lesson_activity_attempts","question_attempts","source_pdf_url","t.answer,false"]){
  assert.ok(listenSql.includes(token),"Missing listening SQL guard: "+token);
 }
 assert.match(ui,/content\.requiresTeacherRead === true/);
 assert.ok(ui.includes("<ListeningScriptPlayer script={teacherListeningScript} />"));
});

test("eight full Grade3 Dadyoom-authored source story texts have 32 exact-source validated reading MCQs",()=>{
 assert.equal(reading.length,32);
 assert.equal(new Set(reading.map(x=>x.lessonId)).size,8);
 assert.equal(new Set(reading.map(x=>x.lessonId+":"+x.activity_order)).size,32);
 assert.equal(new Set(reading.map(x=>x.lessonId+"|"+x.prompt)).size,32);
 for(const a of reading){
  assert.equal(a.activity_type,"multiple_choice");
  assert.equal(a.content.grade,3);
  assert.ok(a.content.originalText.length>=170);
  assert.equal(a.content.origin,"DADYOOM_BH_G3_EIGHT_DISTINCT_READING_32_ORIGINAL_20261030");
  assert.equal(new Set(a.content.options).size,3);
  assert.ok(a.content.options.includes(a.answer.correct));
  assert.equal("answer" in a.content,false);
  assert.equal("correct" in a.content,false);
  assert.ok([204,205,206,207].includes(a.activity_order));
 }
 for(const token of ["eligible<>8","inserted<>32","position(t.content->>'originalText' IN l.content)>0","student_lesson_progress","lesson_activity_attempts","question_attempts","t.answer,false"]){
  assert.ok(readingSql.includes(token),"Missing exact-source protection: "+token);
 }
 assert.ok(ui.includes("content.originalText"));
 assert.ok(publicClient.includes("prompt"));
});

test("66 country/grade cells match 1286/1746 published lessons; 460 not ready and 57 drafts unchanged",()=>{
 assert.equal(prev.totals.after_6_to_10,1272);
 assert.equal(after.totals.after_6_to_10,1286);
 assert.equal(after.totals.current_published_below_six,460);
 assert.equal(after.totals.new_published_activities,62);
 assert.equal(after.totals.newly_improved_lessons,14);
 assert.equal(after.totals.total,1803);
 assert.equal(after.totals.published,1746);
 assert.equal(after.totals.drafts,57);
 assert.equal(after.countries.length,22);
 const cells=after.countries.flatMap(c=>c.grades);
 assert.equal(cells.length,66);
 assert.equal(cells.reduce((sum,c)=>sum+c.after_6_to_10,0),1286);
 assert.equal(after.nextBatchGrades456Allowed,false);
 const gate=evaluateGrade123Audit(after,quality);
 assert.equal(gate.ready,false);
 assert.equal(gate.sufficient,1286);
 assert.equal(gate.missing.exercises,460);
});

test("460 unfinished lessons keep exact IDs and source blockers, without student data",()=>{
 assert.equal(queue.remaining,460);
 assert.equal(queue.rows.length,460);
 assert.equal(new Set(queue.rows.map(x=>x.lessonId)).size,460);
 assert.deepEqual(queue.byGrade.map(x=>x.n),[197,133,130]);
 assert.equal(queue.missingSourceOrPage,335);
 assert.equal(queue.shortUnder500,90);
 for(const a of queue.rows){
  assert.match(a.lessonId,/^[0-9a-f-]{36}$/i);
  assert.equal(a.missingToSix,6-a.publishedActivities);
  assert.ok([1,2,3].includes(a.grade));
  assert.equal("answer" in a,false);
  assert.equal("studentId" in a,false);
 }
});
