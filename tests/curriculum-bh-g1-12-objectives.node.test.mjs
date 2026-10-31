import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const sql=readFileSync("scripts/curriculum-bh-g1-12-subject-based-learning-objectives-20261031.sql","utf8");
test("12 first-grade ministry-scheduled phonics subjects get two measurable behavioral objectives and one observable affective objective",()=>{
 const lessons=[...sql.matchAll(/\('([0-9a-f-]{36})'::uuid,'([^']+)','([بمدحرسلج نعت])','([^']+)','([^']+)'\)/gu)];
 assert.equal(lessons.length,12);
 assert.equal(new Set(lessons.map(l=>l[1])).size,12);
 assert.ok(sql.includes("أن يذكر الطالب حدثين صحيحين من قصة ضاديوم"));
 assert.ok(sql.includes("أن يحدد الطالب موضع حرف"));
 assert.ok(sql.includes("في ثلاث كلمات معروضة"));
 assert.ok(sql.includes("jsonb_array_length(l.learning_objectives)=3"));
 assert.ok(lessons.every(l=>l[4].length>3&&l[5].startsWith("أن ")));
});
test("objective change is transactional and guarded against alterations to learner history or actual lesson body",()=>{
 assert.ok(sql.includes("BEGIN;")&&sql.includes("COMMIT;"));
 assert.ok(sql.includes("c.code<>'BH'"));
 assert.ok(sql.includes("g.grade_number<>1"));
 assert.ok(sql.includes("l.semester<>1"));
 assert.ok(sql.includes("l.title<>e.exact_title"));
 assert.ok(sql.includes("student_lesson_progress"));
 assert.ok(sql.includes("question_attempts"));
 assert.ok(sql.includes("lesson_activity_attempts"));
 assert.ok(sql.includes("IF passed<>12"));
 assert.ok(!/\b(?:DELETE|TRUNCATE|GRANT|REVOKE)\b/i.test(sql));
 assert.ok(!/UPDATE\s+(?:public\.)?(?:student|questions|lesson_activities)/i.test(sql));
});
