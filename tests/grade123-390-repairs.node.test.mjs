import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateGrade123Audit } from "../scripts/grade123-release-gate.mjs";

const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");
const snapshot = JSON.parse(read("data/audits/grades123-22countries-after-four-batches-20261029.json"));
const before = JSON.parse(read("data/audits/grades123-22countries-live-quality-snapshot-20261029.json"));
const after = JSON.parse(read("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json"));
const queue = JSON.parse(read("data/review-queue/grades123-after-390-mcq-repairs-20261029.json"));
const sql = read("scripts/curriculum-22countries-g123-repair-390-safe-mcqs-20261029.sql");

test("historical and independently verified 66-cell post-repair audits agree", () => {
  for(const audit of [before, after]){
    assert.equal(audit.countries, 22);
    assert.equal(audit.countryGradeCells, 66);
    assert.equal(audit.cells.length, 66);
    assert.equal(audit.total, 1803);
    assert.equal(audit.published, 1746);
    assert.equal(audit.drafts, 57);
    assert.equal(audit.genericScaffolds, 0);
  }
  assert.equal(before.genericQuestionLessons, 196);
  assert.equal(after.genericQuestionLessons, 1);
  assert.equal(after.repairedGenericQuestionRows, 390);
  assert.equal(after.preservedGenericQuestionRowsDueToLearnerProgress, 2);
});

test("remaining grade-1 Egyptian student-progress question is not silently changed", () => {
  assert.equal(queue.remainingGeneric.length, 1);
  assert.equal(queue.remainingGeneric[0].country, "EG");
  assert.equal(queue.remainingGeneric[0].grade, 1);
  assert.equal(queue.remainingGeneric[0].genericQuestions, 2);
  assert.equal(queue.drafts.length, 57);
  assert.ok(queue.drafts.every(row => row.country === "BH" && [2,3].includes(row.grade)));
});

test("atomic repair authored by grade and linked to verified source excerpts", () => {
  assert.equal((sql.match(/^  \('/gm) || []).length, 18);
  assert.match(sql, /'الجملة الفعلية البسيطة'/);
  assert.match(sql, /'كتابة جملة واضحة'/);
  assert.match(sql, /'مراجعة مهاراتي الأساسية'/);
  assert.doesNotMatch(sql, /^  \('أدوات الاستفهام'/m);
  assert.match(sql, /IF matched <> 390/);
  assert.match(sql, /IF updated <> 390/);
  assert.match(sql, /GET DIAGNOSTICS updated=ROW_COUNT/);
  assert.match(sql, /NOT EXISTS \(SELECT 1 FROM public.question_attempts/);
  assert.match(sql, /NOT EXISTS \(SELECT 1 FROM public.student_lesson_progress/);
  assert.match(sql, /l.content ILIKE '%زرعَ الطفلُ زهرةً%'/);
  assert.match(sql, /ROLLBACK|Atomic rollback/i);
  assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE)\s+public\.(?:question_attempts|student_lesson_progress)/i);
});

test("honest gate remains closed after improvement; do not proceed to grades 4-6", () => {
  const result = evaluateGrade123Audit(snapshot,after);
  assert.equal(result.ready,false);
  assert.equal(result.qualityGaps.genericQuestionLessons,1);
  assert.equal(result.missing.unpublished,57);
  assert.ok(result.errors.some(x => /generic assessment/.test(x)));
  assert.equal(result.cells.length,66);
});
