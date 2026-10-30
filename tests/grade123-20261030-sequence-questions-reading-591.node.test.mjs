import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateGrade123Audit } from "../scripts/grade123-release-gate.mjs";

const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const asJson = p => JSON.parse(read(p));
const before = asJson("data/audits/grades123-22countries-after-591-extra-activities-20261030.json");
const after = asJson("data/audits/grades123-22countries-after-591-text-based-activities-20261030.json");
const queue = asJson("data/review-queue/grades123-22countries-584-activity-gaps-20261030.json");
const quality = asJson("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json");
const migrations = [
 ["scripts/curriculum-g123-sequence-198-original-activities-20261030.sql","DADYOOM_G123_SEQUENCE_198_ORIGINAL_20261030",198,0],
 ["scripts/curriculum-g123-interrogatives-195-original-activities-20261030.sql","DADYOOM_G123_INTERROGATIVES_195_ORIGINAL_20261030",195,1],
 ["scripts/curriculum-g123-reading-198-original-activities-20261030.sql","DADYOOM_G123_READING_198_ORIGINAL_20261030",198,0],
];

test("27 distinct original text-based questions across three grade-specific topics", () => {
 for (const [file, origin, expected, protectedLessons] of migrations) {
  const sql = read(file);
  const parts = sql.split("$passage$");
  assert.ok(parts.length >= 3, "Missing passage-owned original tasks: "+file);
  const rows = JSON.parse(parts[1]);
  assert.equal(rows.length,9);
  assert.equal(new Set(rows.map(r=>r.grade+"/"+r.activity_order)).size,9);
  assert.deepEqual([...new Set(rows.map(r=>r.grade))].sort(),[1,2,3]);
  assert.deepEqual([...new Set(rows.map(r=>r.activity_type))].sort(),["fill_blank","matching","multiple_choice"]);
  for (const row of rows) {
   assert.ok(row.content.originalText.length>150);
   assert.equal(row.content.origin,origin);
   assert.equal(row.content.didacticGrade,row.grade);
   assert.equal(row.content.scope,"original supplementary reading");
   assert.equal("answer" in row.content,false,"No private marking keys in public content JSON");
   assert.equal("correct" in row.content,false);
   if(row.activity_type==="fill_blank") {
    assert.ok(row.content.items[0].options.includes(row.answer.answers[0]));
   } else if(row.activity_type==="matching") {
    assert.equal(row.answer.pairs.length,3);
    assert.ok(row.answer.pairs.every(x=>row.content.left.includes(x.left)&&row.content.right.includes(x.right)));
   } else if(row.activity_type==="multiple_choice") {
    assert.equal(new Set(row.content.options).size,3);
    assert.ok(row.content.options.includes(row.answer.correct));
   }
  }
  assert.match(sql, /GET DIAGNOSTICS inserted=ROW_COUNT/);
  assert.match(sql, new RegExp("inserted<>"+expected));
  assert.match(sql, new RegExp("protected_count<>"+protectedLessons));
  assert.match(sql, /student_lesson_progress/);
  assert.match(sql, /lesson_activity_attempts/);
  assert.match(sql, /question_attempts/);
  assert.match(sql, /t\.answer,false/);
  assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|TRUNCATE)\s+(?:FROM\s+)?public\.(?:lessons|questions|lesson_activity_attempts|question_attempts|student_lesson_progress)/i);
 }
});

test("all 66 country-grade live production cells advanced from 965 to 1162; Grade4 gate still closed",()=>{
 assert.equal(before.totals.after_6_to_10,965);
 assert.equal(after.totals.after_6_to_10,1162);
 assert.equal(after.totals.current_published_below_six,584);
 assert.equal(after.totals.new_published_activities,591);
 assert.equal(after.totals.newly_improved_lessons,197);
 assert.equal(after.totals.published,1746);
 assert.equal(after.totals.drafts,57);
 assert.equal(after.countries.length,22);
 assert.equal(after.countries.flatMap(x=>x.grades).length,66);
 assert.equal(after.countries.flatMap(x=>x.grades).reduce((n,g)=>n+g.after_6_to_10,0),1162);
 const gate=evaluateGrade123Audit(after,quality);
 assert.equal(gate.ready,false);
 assert.equal(gate.sufficient,1162);
 assert.equal(gate.missing.exercises,584);
 assert.equal(gate.qualityGaps.genericQuestionLessons,1);
});

test("584 outstanding lessons are uniquely identified, with safe remediation constraints",()=>{
 assert.equal(queue.remaining,584);
 assert.equal(queue.rows.length,584);
 assert.equal(new Set(queue.rows.map(x=>x.lessonId)).size,584);
 assert.deepEqual(queue.byGrade.map(x=>x.n),[256,162,166]);
 assert.equal(queue.missingSourceOrPage,401);
 assert.equal(queue.shortUnder500,90);
 for (const row of queue.rows) {
  assert.match(row.lessonId,/^[0-9a-f-]{36}$/i);
  assert.ok([1,2,3].includes(row.grade));
  assert.ok(row.publishedActivities>=0&&row.publishedActivities<6);
  assert.equal(row.missingToSix,6-row.publishedActivities);
  assert.equal("answer" in row,false);
  assert.equal("studentId" in row,false);
 }
 const countryCodes=new Set(asJson("data/curriculum-packs/arab-countries.json").countries.map(c=>c.code));
 assert.equal(countryCodes.size,22);
 assert.ok(queue.rows.every(x=>countryCodes.has(x.country)));
});
