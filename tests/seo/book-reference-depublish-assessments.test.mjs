import { test, expect } from "vitest";
import { readFileSync } from "node:fs";
test("book-reference activity depublication is exact, guarded and lossless",()=>{
 const sql=readFileSync("data/curriculum-completeness/book-reference-30-depublish-assessments-20261009.sql","utf8");
 expect(sql).toContain("matching<>30");
 expect(sql).toContain("student_lesson_progress");
 expect(sql).toContain("lesson_activity_attempts");
 expect(sql).toContain("question_attempts");
 expect(sql).toContain("SET is_published=false, updated_at=now()");
 expect(sql).toContain("changed<>90");
 expect(sql).not.toMatch(/DELETE FROM public\./);
});
