import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateGrade123Audit} from "../scripts/grade123-release-gate.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
const sql=read("scripts/curriculum-bh-g1-12-unique-worksheets-60-original-differentiated-activities-20261030.sql");
const tasks=JSON.parse(sql.split("$worksheet$")[1]);
const before=json("data/audits/grades123-22countries-after-34-bahrain-journal-phonics-activities-20261030.json");
const after=json("data/audits/grades123-22countries-after-60-bahrain-worksheets-20261030.json");
const remaining=json("data/review-queue/grades123-22countries-481-activity-gaps-20261030.json");
const selectAudit=json("data/audits/grade123-1059-four-option-single-select-rendering-20261030.json");
const ui=read("features/lessons/components/InteractiveLessonActivities.tsx");
const quality=json("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json");

test("60 original tasks are each linked to one of twelve specific published Grade1 Bahrain worksheets",()=>{
 assert.equal(tasks.length,60);
 assert.equal(new Set(tasks.map(t=>t.lessonId)).size,12);
 assert.equal(new Set(tasks.map(t=>t.page)).size,12);
 assert.equal(new Set(tasks.map(t=>t.lessonId+":"+t.activity_order)).size,60);
 const allowed=new Set(["multiple_choice","fill_blank","matching"]);
 for(const t of tasks){
  assert.ok(allowed.has(t.activity_type));
  assert.ok([2,3,4,5,6].includes(t.activity_order));
  assert.ok(t.prompt.length>=15);
  assert.ok(t.content.originalReference.length>=240);
  assert.equal(t.content.country,"BH");
  assert.equal(t.content.grade,1);
  assert.equal(t.content.origin,"DADYOOM_BH_G1_12_WORKSHEETS_60_ORIGINAL_SEMANTIC_20261030");
  assert.equal("correct" in t.content,false);
  assert.equal("answer" in t.content,false);
  if(t.activity_type==="multiple_choice"){
   assert.equal(new Set(t.content.options).size,t.content.options.length);
   assert.ok(t.content.options.includes(t.answer.correct));
  } else if(t.activity_type==="fill_blank"){
   assert.equal(t.content.items.length,1);
   assert.ok(t.content.items[0].options.includes(t.answer.answers[0]));
  } else {
   assert.equal(t.answer.pairs.length,t.content.left.length);
   assert.ok(t.answer.pairs.every(p=>t.content.left.includes(p.left)&&t.content.right.includes(p.right)));
  }
 }
 assert.equal(tasks.filter(t=>t.activity_type==="multiple_choice"&&t.content.options.length===4).length,3);
 for(const k of ["eligible<>12","inserted<>60","student_lesson_progress","lesson_activity_attempts","question_attempts","t.answer,false","l.source_pdf_url IS NOT NULL"]){
  assert.ok(sql.includes(k),"SQL validation/preservation check missing: "+k);
 }
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|TRUNCATE)\s+(?:FROM\s+)?public\.(?:lessons|lesson_activities|questions|student_lesson_progress)/i);
});

test("1059 independently audited 4+ option single-choice tasks no longer become multi-select just because of option count",()=>{
 assert.equal(selectAudit.activitiesWithMoreThanThreeOptions,1059);
 assert.equal(selectAudit.fourPlusOptionsSingleCorrect,1059);
 assert.equal(selectAudit.fourPlusOptionsMultiCorrect,0);
 assert.equal(selectAudit.explicitPublicMultiSelectionModes,0);
 assert.match(ui,/const multi\s*=\s*activity\.activity_type === "multi_select"/);
 for(const name of ["content.allowMultiple === true","content.allow_multiple === true","content.selectionMode === \"multiple\"","content.selection_mode === \"multiple\""]){
  assert.ok(ui.includes(name),"Explicit public selection control absent: "+name);
 }
 assert.doesNotMatch(ui,/const multi\s*=\s*options\.length\s*>\s*3/);
 assert.ok(ui.includes("[activity.id]:\n                                          [option]"));
});

test("fresh live audit covers 22 countries x 3 grades with 1265 sufficient and 481 outstanding",()=>{
 assert.equal(before.totals.after_6_to_10,1253);
 assert.equal(after.totals.after_6_to_10,1265);
 assert.equal(after.totals.current_published_below_six,481);
 assert.equal(after.totals.new_published_activities,60);
 assert.equal(after.totals.newly_improved_lessons,12);
 assert.equal(after.totals.total,1803);
 assert.equal(after.totals.published,1746);
 assert.equal(after.totals.drafts,57);
 assert.equal(after.countries.length,22);
 const cells=after.countries.flatMap(c=>c.grades);
 assert.equal(cells.length,66);
 assert.equal(cells.reduce((s,x)=>s+x.after_6_to_10,0),1265);
 assert.equal(after.nextBatchGrades456Allowed,false);
 const gate=evaluateGrade123Audit(after,quality);
 assert.equal(gate.ready,false);
 assert.equal(gate.sufficient,1265);
 assert.equal(gate.missing.exercises,481);
});

test("remaining 481 specific published lessons are uniquely inventoried by grade without false source certification",()=>{
 assert.equal(remaining.remaining,481);
 assert.equal(remaining.rows.length,481);
 assert.equal(new Set(remaining.rows.map(r=>r.lessonId)).size,481);
 assert.deepEqual(remaining.byGrade.map(g=>g.n),[197,140,144]);
 assert.equal(remaining.missingSourceOrPage,335);
 assert.equal(remaining.shortUnder500,90);
 for(const g of remaining.rows){
  assert.match(g.lessonId,/^[0-9a-f-]{36}$/i);
  assert.equal(g.missingToSix,6-g.publishedActivities);
  assert.ok([1,2,3].includes(g.grade));
  assert.equal("answer" in g,false);
 }
});
