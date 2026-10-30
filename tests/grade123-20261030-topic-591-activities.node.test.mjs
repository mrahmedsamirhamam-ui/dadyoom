import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateGrade123Audit} from "../scripts/grade123-release-gate.mjs";

const text = path => readFileSync(new URL("../"+path, import.meta.url), "utf8");
const json = path => JSON.parse(text(path));
const before = json("data/audits/grades123-22countries-after-three-198-batches-20261030.json");
const after = json("data/audits/grades123-22countries-after-591-extra-activities-20261030.json");
const quality = json("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json");
const queue = json("data/review-queue/grades123-22countries-781-activity-gaps-20261030.json");
const scripts = [
 ["scripts/curriculum-g123-letter-forms-198-original-activities-20261030.sql", "$letterforms$", "DADYOOM_G123_LETTER_FORMS_198_ORIGINAL_20261030", 198],
 ["scripts/curriculum-g123-phonemes-195-protected-original-activities-20261030.sql", "$phonemes$", "DADYOOM_G123_PHONEMES_195_ORIGINAL_20261030", 195],
 ["scripts/curriculum-g123-main-idea-198-original-reading-activities-20261030.sql", "$ideas$", "DADYOOM_G123_MAIN_IDEA_ORIGINAL_198_20261030", 198],
];

test("each original source-linked activity is grade-differentiated, correctly keyed, and contains its own teaching context", () => {
 for (const [path, delimiter, origin, expected] of scripts) {
  const sql = text(path);
  const parts = sql.split(delimiter);
  assert.ok(parts.length >= 3, "Missing templates in "+path);
  const rows = JSON.parse(parts[1]);
  assert.equal(rows.length, 9);
  assert.equal(new Set(rows.map(r=>r.grade+":"+r.activity_order)).size, 9);
  for (const row of rows) {
   assert.ok([1,2,3].includes(row.grade));
   assert.ok([4,5,6].includes(row.activity_order));
   assert.equal(row.content.origin, origin);
   assert.ok((row.content.originalText ?? row.content.originalReference ?? row.content.sourceContext ?? "").length > 120);
   assert.equal("answer" in row.content, false);
   assert.equal("correct" in row.content, false);
   if (row.activity_type === "multiple_choice") {
    assert.ok(row.content.options.includes(row.answer.correct));
    assert.equal(new Set(row.content.options).size, 3);
   } else if (row.activity_type === "fill_blank") {
    assert.ok(row.content.items[0].options.includes(row.answer.answers[0]));
   } else if (row.activity_type === "matching") {
    assert.equal(row.answer.pairs.length, 3);
    assert.ok(row.answer.pairs.every(p=>row.content.left.includes(p.left) && row.content.right.includes(p.right)));
   } else { assert.fail("Unknown activity type "+row.activity_type); }
  }
  assert.match(sql, /GET DIAGNOSTICS inserted=ROW_COUNT/);
  assert.match(sql, /student_lesson_progress/);
  assert.match(sql, /lesson_activity_attempts/);
  assert.match(sql, /question_attempts/);
  assert.match(sql, new RegExp("inserted<>"+expected));
  assert.match(sql, /t\.answer,false/);
  assert.doesNotMatch(sql, /\b(?:UPDATE|DELETE)\s+(?:FROM\s+)?public\.(?:lessons|questions|lesson_activity_attempts|question_attempts|student_lesson_progress)/i);
 }
});

test("holdout with prior activity attempts is excluded rather than silently regraded", () => {
 const sql = text(scripts[1][0]);
 assert.match(sql, /protected_count<>1/);
 assert.match(sql, /eligible<>65/);
 assert.match(sql, /inserted<>195/);
 assert.match(sql, /NOT EXISTS\(SELECT 1 FROM public.lesson_activity_attempts/);
});

test("live 66-cell coverage advances only to 965, and Grades 4-6 stay blocked", () => {
 assert.equal(before.totals.after_6_to_10, 768);
 assert.equal(after.totals.after_6_to_10, 965);
 assert.equal(after.totals.current_published_below_six, 781);
 assert.equal(after.totals.new_published_activities, 591);
 assert.equal(after.totals.newly_improved_lessons, 197);
 assert.equal(after.totals.total, 1803);
 assert.equal(after.totals.published, 1746);
 assert.equal(after.totals.drafts, 57);
 assert.equal(after.countries.length, 22);
 assert.equal(after.countries.flatMap(c=>c.grades).length, 66);
 assert.equal(after.countries.flatMap(c=>c.grades).reduce((n,g)=>n+g.after_6_to_10,0),965);
 const gate=evaluateGrade123Audit(after,quality);
 assert.equal(gate.ready,false);
 assert.equal(gate.sufficient,965);
 assert.equal(gate.missing.exercises,781);
 assert.equal(gate.qualityGaps.genericQuestionLessons,1);
});

test("remaining 781 lesson gap records are unique and align to live country-grade totals", () => {
 assert.equal(queue.remaining,781);
 assert.equal(queue.rows.length,781);
 assert.equal(new Set(queue.rows.map(r=>r.lessonId)).size,781);
 assert.equal(queue.missingSourceOrPage,598);
 assert.equal(queue.shortUnder500,90);
 assert.deepEqual(queue.byGrade.map(r=>r.n),[321,228,232]);
 for(const row of queue.rows) {
  assert.match(row.lessonId,/^[0-9a-f-]{36}$/i);
  assert.ok([1,2,3].includes(row.grade));
  assert.ok(row.publishedActivities>=0 && row.publishedActivities<6);
  assert.equal(row.missingToSix,6-row.publishedActivities);
  assert.equal("answer" in row,false);
 }
 const countryCodes = new Set(json("data/curriculum-packs/arab-countries.json").countries.map(x=>x.code));
 assert.equal(countryCodes.size,22);
 assert.ok(queue.rows.every(r=>countryCodes.has(r.country)));
});
