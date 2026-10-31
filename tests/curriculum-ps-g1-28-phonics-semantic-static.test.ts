import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql=readFileSync(resolve(process.cwd(),
 "scripts/curriculum-ps-g1-28-original-phonics-84-semantic-practices-20261031.sql"),"utf8");

describe("Palestinian first grade original phonics semantic expansion",()=>{
 it("only changes 28 untouched published country-specific lessons",()=>{
  expect(sql).toContain("c.code='PS'");
  expect(sql).toContain("g.grade_number=1");
  expect(sql).toContain("l.title LIKE 'حرف %'");
  expect(sql).toContain("l.status='published'");
  expect(sql).toContain("cnt.published_n=3 AND cnt.all_n=3");
  expect(sql).toContain("student_lesson_progress");
  expect(sql).toContain("question_attempts");
  expect(sql).toContain("lesson_activity_attempts");
  expect(sql).toContain("n<>28");
  expect(sql).toContain("n<>84");
  expect(sql).toContain("BEGIN;");
  expect(sql).toContain("COMMIT;");
 });
 it("uses earlier original source passage, precise letter and vocabulary meanings",()=>{
  expect(sql).toContain("DADYOOM_PS_G123_57_ORIGINAL_FORMATIVE_20261031");
  expect(sql).toContain("r.content->>'originalText'");
  expect(sql).toContain("w.content->>'letter'");
  expect(sql).toContain("l.vocabulary->0->>'word'");
  expect(sql).toContain("l.vocabulary->0->>'meaning'");
  expect(sql).toContain("position(target_letter in authored_passage)=0");
  expect(sql).toContain("vocab");
  expect(sql).toContain("bookContentUnverified");
  expect(sql).toContain("teacherFeedbackRequired");
  expect(sql).toContain("teacherObservationRequired");
  expect(sql).toContain("t.prompt,'{}'::jsonb,false");
  expect(sql).not.toMatch(/\bDELETE\s+FROM\b|\bTRUNCATE\b|\bGRANT\s|\bREVOKE\s/i);
 });
});
