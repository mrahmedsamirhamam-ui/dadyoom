import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateGrade123Audit} from "../scripts/grade123-release-gate.mjs";

const read=path=>JSON.parse(readFileSync(new URL("../"+path,import.meta.url),"utf8"));
const sql=readFileSync(new URL("../scripts/curriculum-g123-sukun-198-original-activities-20261030.sql",import.meta.url),"utf8");
const prev=read("data/audits/grades123-22countries-after-two-198-batches-20261030.json");
const current=read("data/audits/grades123-22countries-after-three-198-batches-20261030.json");
const quality=read("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json");
const queue=read("data/review-queue/grades123-22countries-978-activity-gaps-20261030.json");

test("original Sukun examples have three distinct safe and grade-specific activities",()=>{
 const parts=sql.split("$sukun$");
 assert.ok(parts.length>=3,"Expected serialized activity template JSON");
 const templates=JSON.parse(parts[1]);
 assert.equal(templates.length,9);
 assert.equal(new Set(templates.map(t=>t.grade+":"+t.activity_order)).size,9);
 for(const t of templates){
  assert.ok([1,2,3].includes(t.grade));
  assert.ok([4,5,6].includes(t.activity_order));
  assert.equal(t.content.origin,"DADYOOM_G123_SUKUN_198_ORIGINAL_20261030");
  assert.equal("answer" in t.content,false);
  assert.equal("correct" in t.content,false);
  if(t.activity_type==="multiple_choice") assert.ok(t.content.options.includes(t.answer.correct));
  if(t.activity_type==="fill_blank") assert.ok(t.content.items[0].options.includes(t.answer.answers[0]));
  if(t.activity_type==="matching") assert.ok(t.answer.pairs.every(p=>t.content.left.includes(p.left)&&t.content.right.includes(p.right)));
 }
 assert.match(sql,/student_lesson_progress/);
 assert.match(sql,/question_attempts/);
 assert.match(sql,/lesson_activity_attempts/);
 assert.match(sql,/GET DIAGNOSTICS inserted=ROW_COUNT/);
 assert.match(sql,/inserted<>198/);
 assert.match(sql,/t.answer,false/);
});

test("independent live audit reaches 768 with 978 outstanding, no fake 100%",()=>{
 assert.equal(prev.totals.after_6_to_10,702);
 assert.equal(current.totals.after_6_to_10,768);
 assert.equal(current.totals.current_published_below_six,978);
 assert.equal(current.totals.published,1746);
 assert.equal(current.totals.drafts,57);
 assert.equal(current.countries.length,22);
 assert.equal(current.countries.flatMap(c=>c.grades).length,66);
 assert.equal(current.countries.flatMap(c=>c.grades).reduce((sum,g)=>sum+g.after_6_to_10,0),768);
 const gate=evaluateGrade123Audit(current,quality);
 assert.equal(gate.ready,false);
 assert.equal(gate.missing.exercises,978);
 assert.equal(gate.qualityGaps.genericQuestionLessons,1);
});

test("every remaining lesson is a unique safe remedial target",()=>{
 assert.equal(queue.count,978);
 assert.equal(queue.rows.length,978);
 assert.equal(new Set(queue.rows.map(x=>x.lessonId)).size,978);
 assert.deepEqual(queue.byGrade.map(x=>x.n),[386,294,298]);
 assert.equal(queue.withoutSourceOrPage,795);
 for(const row of queue.rows){
  assert.ok([1,2,3].includes(row.grade));
  assert.match(row.lessonId,/^[0-9a-f-]{36}$/i);
  assert.equal(row.missingToSix,6-row.publishedActivities);
  assert.ok(row.publishedActivities>=0&&row.publishedActivities<6);
  assert.equal("answer" in row,false);
 }
});
