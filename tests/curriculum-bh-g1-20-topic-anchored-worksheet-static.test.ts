import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(),
 "scripts/curriculum-bh-g1-t1-20-worksheet-specific-100-activities-20261031.sql"),"utf8");

describe("Bahrain first-grade 20 original worksheet practice units",()=>{
 it("guards actual live country, grade, semester and published scope",()=>{
  expect(source).toContain("c.code='BH'");
  expect(source).toContain("g.grade_number=1");
  expect(source).toContain("l.semester=1");
  expect(source).toContain("l.lesson_type='assessment'");
  expect(source).toContain("l.status='published'");
  expect(source).toContain("cnt.live_n=1 AND cnt.all_n=1");
  expect(source).toContain("student_lesson_progress");
  expect(source).toContain("question_attempts");
  expect(source).toContain("lesson_activity_attempts");
  expect(source).toContain("n<>20");
  expect(source).toContain("n<>100");
  expect(source).toContain("BEGIN;");
  expect(source).toContain("COMMIT;");
  expect(source).not.toMatch(/\bDELETE\s+FROM\b|\bTRUNCATE\b|\bGRANT\s|\bREVOKE\s/i);
 });
 it("grounds the activities in three actual source anchors, not a claimed Ministry sheet",()=>{
  expect(source).toContain("الكلمات «");
  expect(source).toContain("أفهم وأطبق:");
  expect(source).toContain("تقويم ختامي:");
  expect(source).toContain("v.task_prompt,'{}'::jsonb,false");
  expect(source).toContain("bookContentUnverified");
  expect(source).toContain("notMinistryText");
  expect(source).toContain("'reviewStatus','required'");
  expect(source).toContain("teacherObservationRequired");
  expect(source).toContain("learning_objectives=jsonb_build_array");
 });
});
