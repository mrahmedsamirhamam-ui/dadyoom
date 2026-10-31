import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const target = [
  { path:"scripts/curriculum-bh-g1-six-original-chants-reviews-18-20261031.sql",
    grade:1, mark:"DADYOOM_BH_G1_SIX_SOURCE_ANCHORED_18_20261031", lessons:6, activities:18 },
  { path:"scripts/curriculum-bh-g3-six-original-stories-18-20261031.sql",
    grade:3, mark:"DADYOOM_BH_G3_SIX_ORIGINAL_READING_18_20261031", lessons:6, activities:18 },
] as const;

describe("Bahrain original grade 1/3 lessons in guarded formative batches", () => {
 it.each(target)("protects existing history and teacher-only completion in $path",
 ({ path,grade,mark,lessons,activities })=>{
  const sql=readFileSync(resolve(process.cwd(),path),"utf8");
  expect(sql).toContain("c.code='BH'");
  expect(sql).toContain("g.grade_number="+grade);
  expect(sql).toContain("l.status='published'");
  expect(sql).toContain("student_lesson_progress");
  expect(sql).toContain("question_attempts");
  expect(sql).toContain("lesson_activity_attempts");
  expect(sql).toContain("BEGIN;");
  expect(sql).toContain("COMMIT;");
  expect(sql).toContain("n<>"+lessons);
  expect(sql).toContain("n<>"+activities);
  expect(sql).toContain(mark);
  expect(sql).toContain("v.prompt,'{}'::jsonb,false");
  expect(sql).toContain("requiresTeacherRead");
  expect(sql).toContain("bookContentUnverified");
  expect(sql).toMatch(/count\(\*\) FILTER\s*\(WHERE points<>0 OR answer<>'\{\}'::jsonb/);
  expect(sql).not.toMatch(/\bDELETE\s+FROM\b|\bTRUNCATE\b|\bGRANT\s|\bREVOKE\s/);
 });
 it("sources the first-grade supplementary exercises from existing chant stanzas and phonics cards",()=>{
  const sql=readFileSync(resolve(process.cwd(),target[0].path),"utf8");
  expect(sql).toContain("أنشودة الوحدة: أسرتي");
  expect(sql).toContain("الدرس الخامس عشر: أعزز مكتسباتي");
  expect(sql).toContain("اقرأ:");
  expect(sql).toContain("originalText");
 });
 it("gets six grade 3 paragraphs from original authored passages, never Ministry books",()=>{
  const sql=readFileSync(resolve(process.cwd(),target[1].path),"utf8");
  expect(sql).toContain("النص التدريبي الأصلي:");
  expect(sql).toContain("original_passage");
  expect(sql).toContain("teacherFeedbackRequired");
 });
});
