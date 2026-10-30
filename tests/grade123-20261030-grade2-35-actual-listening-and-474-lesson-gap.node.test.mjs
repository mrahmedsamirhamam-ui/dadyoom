import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateGrade123Audit} from "../scripts/grade123-release-gate.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
const sql=read("scripts/curriculum-bh-grade2-6-original-listening-stories-and-phonics-35-activities-20261030.sql");
const tasks=JSON.parse(sql.split("$g2listen$")[1]);
const prev=json("data/audits/grades123-22countries-after-60-bahrain-worksheets-20261030.json");
const current=json("data/audits/grades123-22countries-after-35-bahrain-grade2-listening-20261030.json");
const queue=json("data/review-queue/grades123-22countries-474-activity-gaps-20261030.json");
const quality=json("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json");
const ui=read("features/lessons/components/InteractiveLessonActivities.tsx");
const voice=read("features/lesson-activities/components/ListeningScriptPlayer.tsx");

test("35 optional original Bahrain Grade2 comprehension/phonics tasks preserve real question formats and private grader keys",()=>{
 assert.equal(tasks.length,35);
 assert.equal(new Set(tasks.map(t=>t.lessonId)).size,7);
 assert.equal(new Set(tasks.map(t=>t.lessonId+":"+t.activity_order)).size,35);
 assert.equal(tasks.filter(t=>t.activity_type==="listening").length,30);
 assert.equal(tasks.filter(t=>t.activity_type==="multiple_choice").length,5);
 for(const t of tasks){
  assert.ok([2,3,4,5,6].includes(t.activity_order));
  assert.ok(t.prompt.length>=15);
  assert.equal(t.content.grade,2);
  assert.equal(t.content.origin,"DADYOOM_BH_G2_7_ORIGINAL_LISTENING_PHONICS_35_20261030");
  assert.equal(t.content.options.length,3);
  assert.equal(new Set(t.content.options).size,3);
  assert.ok(t.content.options.includes(t.answer.correct));
  assert.equal("correct" in t.content,false);
  assert.equal("answer" in t.content,false);
  if(t.activity_type==="listening"){
   assert.equal(t.content.requiresTeacherRead,true);
   assert.ok(t.content.text.length>=135);
   assert.equal(t.content.listeningQuestion,t.prompt);
  }else{
   assert.ok(t.content.originalReference.length>=160);
  }
 }
 for(const term of ["eligible<>7","inserted<>35","student_lesson_progress","lesson_activity_attempts","question_attempts","t.answer,false"]){
  assert.ok(sql.includes(term),"Missing fail-closed SQL check: "+term);
 }
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|TRUNCATE)\s+(?:FROM\s+)?public\.(?:lessons|lesson_activities|questions)/i);
});

test("teacher-listening scripts require user-activated Arabic device voice or teacher fallback and are not recorded audio",()=>{
 assert.ok(ui.includes("content.requiresTeacherRead === true"));
 assert.ok(ui.includes("<ListeningScriptPlayer script={teacherListeningScript} />"));
 assert.ok(ui.includes("content.listeningQuestion"));
 assert.ok(voice.includes("SpeechSynthesisUtterance"));
 assert.ok(voice.includes("synth.getVoices()"));
 assert.ok(voice.includes('startsWith("ar")'));
 assert.ok(voice.includes("نص المعلم"));
 assert.ok(!voice.includes("/api/dad-voice"));
 assert.equal(current.nextBatchGrades456Allowed,false);
});

test("live 66-cell Grade1-3 coverage grows to 1272/1746 with 474 missing and 57 unchanged drafts",()=>{
 assert.equal(prev.totals.after_6_to_10,1265);
 assert.equal(current.totals.after_6_to_10,1272);
 assert.equal(current.totals.current_published_below_six,474);
 assert.equal(current.totals.new_published_activities,35);
 assert.equal(current.totals.newly_improved_lessons,7);
 assert.equal(current.totals.published,1746);
 assert.equal(current.totals.drafts,57);
 assert.equal(current.totals.total,1803);
 assert.equal(current.countries.length,22);
 const grades=current.countries.flatMap(c=>c.grades);
 assert.equal(grades.length,66);
 assert.equal(grades.reduce((sum,g)=>sum+g.after_6_to_10,0),1272);
 const gate=evaluateGrade123Audit(current,quality);
 assert.equal(gate.ready,false);
 assert.equal(gate.sufficient,1272);
 assert.equal(gate.missing.exercises,474);
});

test("474 remaining published Grade1-3 lesson IDs are unique; source fidelity remains a blocker",()=>{
 assert.equal(queue.remaining,474);
 assert.equal(queue.rows.length,474);
 assert.equal(new Set(queue.rows.map(r=>r.lessonId)).size,474);
 assert.deepEqual(queue.byGrade.map(r=>r.n),[197,133,144]);
 assert.equal(queue.missingSourceOrPage,335);
 assert.equal(queue.shortUnder500,90);
 for(const row of queue.rows){
  assert.match(row.lessonId,/^[0-9a-f-]{36}$/i);
  assert.ok([1,2,3].includes(row.grade));
  assert.equal(row.missingToSix,6-row.publishedActivities);
  assert.equal("answer" in row,false);
 }
});
