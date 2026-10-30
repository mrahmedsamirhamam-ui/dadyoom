import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const path = new URL("../scripts/curriculum-g123-24-original-story-language-corrections-20261030.sql",import.meta.url);
const sql = readFileSync(path,"utf8");
const corrections=[
 ["واجه مها","واجهت مها",4],["استنتج مها","استنتجت مها",4],
 ["لاحظ أمينة","لاحظت أمينة",4],["استنتج أمينة","استنتجت أمينة",4],
 ["كان هدف هذا الإجراء لتقرأ","كان الهدف من ذلك أن تقرأ",4],
 ["كان هدف هذا الإجراء ليعرف","كان الهدف من ذلك أن يعرف",12],
 ["كان هدف هذا الإجراء لتقليل","كان الهدف من ذلك تقليل",4],
 ["كان هدف هذا الإجراء ليستطيع","كان الهدف من ذلك أن يستطيع",4],
];

test("migration targets 8 explicitly evidenced prose errors in exactly 24 immutable Grade1-3 lessons",()=>{
 assert.equal(corrections.reduce((sum,r)=>sum+r[2],0),40);
 for (const [incorrect,correct,expected] of corrections) {
  assert.ok(sql.includes("'"+incorrect+"'"));
  assert.ok(sql.includes("'"+correct+"'"));
  assert.ok(sql.includes(",'"+correct+"',"+expected+")") ||
    sql.includes(",'"+correct+"',"+expected+"),"));
 }
 assert.match(sql,/n<>24/);
 assert.match(sql,/result_count<>24/);
 assert.match(sql,/RAISE EXCEPTION 'Rollback/);
 assert.match(sql,/l\.status='published'/);
 assert.match(sql,/g\.grade_number BETWEEN 1 AND 3/);
 assert.match(sql,/GET DIAGNOSTICS result_count=ROW_COUNT/);
});

test("language-only corrections cannot silently rewrite learner progress or answer keys",()=>{
 assert.match(sql,/student_lesson_progress/);
 assert.match(sql,/lesson_activity_attempts/);
 assert.match(sql,/question_attempts/);
 assert.match(sql,/SET content=replace\(/);
 assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|TRUNCATE)\s+(?:FROM\s+)?public\.(?:questions|lesson_activities|student_lesson_progress|question_attempts|lesson_activity_attempts)/i);
 assert.doesNotMatch(sql,/\b(?:correct_answer|is_required)\s*=/);
});
