import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateGrade123Audit } from "../scripts/grade123-release-gate.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
const journalSql=read("scripts/curriculum-bh-g1-5-learning-journals-25-source-specific-activities-20261030.sql");
const letterSql=read("scripts/curriculum-bh-g1-9-verified-letter-lessons-single-phonics-questions-20261030.sql");
const privateSql=read("scripts/security-bahrain-g1-26-public-answer-guide-lines-into-private-teacher-notes-20261030.sql");
const security=json("data/audits/bh-grade1-26-public-answer-keys-secured-20261030.json");
const current=json("data/audits/grades123-22countries-after-34-bahrain-journal-phonics-activities-20261030.json");
const old=json("data/audits/grades123-22countries-after-55-bahrain-glossary-activities-20261030.json");
const queue=json("data/review-queue/grades123-22countries-493-activity-gaps-20261030.json");
const quality=json("data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json");
const journals=JSON.parse(journalSql.split("$journals$")[1]);
const letters=JSON.parse(letterSql.split("$letters$")[1]);

test("five real distinct Bahrain reflection journals and nine phonics lessons have 34 private-graded optional exercises",()=>{
 assert.equal(journals.length,25);
 assert.equal(letters.length,9);
 assert.equal(new Set(journals.map(a=>a.lessonId)).size,5);
 assert.equal(new Set(letters.map(a=>a.lessonId)).size,9);
 assert.equal(new Set([...journals,...letters].map(a=>a.lessonId)).size,14);
 assert.equal(new Set(journals.map(a=>a.sourcePage)).size,5);
 for (const a of [...journals,...letters]) {
  assert.ok(a.content.originalReference.length>180);
  assert.equal("answer" in a.content,false);
  assert.equal("correct" in a.content,false);
  assert.ok(a.prompt.length>15);
  if (a.activity_type==="multiple_choice") {
   assert.equal(new Set(a.content.options).size,3);
   assert.ok(a.content.options.includes(a.answer.correct));
  } else if(a.activity_type==="fill_blank") {
   assert.ok(a.content.items[0].options.includes(a.answer.answers[0]));
  } else if(a.activity_type==="matching") {
   assert.equal(a.answer.pairs.length,3);
   assert.ok(a.answer.pairs.every(pair=>a.content.left.includes(pair.left) && a.content.right.includes(pair.right)));
  } else assert.fail("Unrecognized activity "+a.activity_type);
 }
 assert.match(journalSql,/verified<>5/);
 assert.match(journalSql,/inserted<>25/);
 assert.match(letterSql,/eligible<>9/);
 assert.match(letterSql,/inserted<>9/);
 for (const sql of [journalSql,letterSql]) {
  assert.match(sql,/student_lesson_progress/);
  assert.match(sql,/lesson_activity_attempts/);
  assert.match(sql,/question_attempts/);
  assert.match(sql,/t\.answer,false/);
 }
});

test("independent live activity audit verifies 1253/1746, 493 remaining and release gate stays fail closed",()=>{
 assert.equal(old.totals.after_6_to_10,1239);
 assert.equal(current.totals.after_6_to_10,1253);
 assert.equal(current.totals.new_published_activities,34);
 assert.equal(current.totals.newly_improved_lessons,14);
 assert.equal(current.totals.published,1746);
 assert.equal(current.totals.drafts,57);
 assert.equal(current.totals.current_published_below_six,493);
 assert.equal(current.countries.length,22);
 assert.equal(current.countries.flatMap(c=>c.grades).length,66);
 assert.equal(queue.rows.length,493);
 assert.equal(queue.remaining,493);
 assert.deepEqual(queue.byGrade.map(x=>x.n),[209,140,144]);
 assert.equal(queue.missingSourceOrPage,335);
 assert.equal(queue.shortUnder500,90);
 assert.equal(new Set(queue.rows.map(x=>x.lessonId)).size,493);
 const gate=evaluateGrade123Audit(current,quality);
 assert.equal(gate.ready,false);
 assert.equal(gate.sufficient,1253);
 assert.equal(gate.missing.exercises,493);
 assert.equal(current.nextBatchGrades456Allowed,false);
});

test("26 teacher answer guides moved to RLS-protected notes without keys committed to GitHub or rewriting learner history",()=>{
 const check=security.outcome;
 assert.equal(check.publicTeacherAnswerGuideMarkersRemainingAcrossAllPublishedGrades123,0);
 assert.equal(check.privateTeacherAnswerNotesArchived,26);
 assert.equal(check.distinctLessonsArchived,26);
 assert.equal(check.archivedKeysStillPublic,0);
 assert.equal(check.lessonTeacherNotesRlsEnabled,true);
 assert.equal(check.anonymousCanSelectTeacherNotes,false);
 assert.equal(check.historicalProgressRecordsForMigratedLessons,0);
 assert.match(privateSql,/CREATE TEMP TABLE bh_grade1_teacher_only_answers/);
 assert.match(privateSql,/lesson_teacher_notes/);
 assert.match(privateSql,/has_table_privilege\('anon'/);
 assert.match(privateSql,/relrowsecurity/);
 assert.match(privateSql,/student_lesson_progress/);
 assert.match(privateSql,/lesson_activity_attempts/);
 assert.match(privateSql,/question_attempts/);
 assert.match(privateSql,/inserted<>26/);
 assert.match(privateSql,/changed<>26/);
 assert.match(privateSql,/teacher_key_line/);
 assert.match(privateSql,/t\.lesson_content/);
 assert.doesNotMatch(privateSql,/DROP TABLE public\.lesson_teacher_notes/);
 assert.doesNotMatch(privateSql,/TRUNCATE TABLE public\.lessons/);
});
