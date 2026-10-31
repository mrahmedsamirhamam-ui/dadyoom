import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql=readFileSync(resolve(process.cwd(),
 "scripts/curriculum-bh-g1-sem2-six-independent-original-bodies-30-formative-20261031.sql"),"utf8");

describe("Original independent Dadyoom stories and chants for BH first grade semester 2",()=>{
 it("authors six distinct independent texts, not claimed Ministry textbook passages",()=>{
  const originals=[...sql.matchAll(/\$BODY\$([\s\S]*?)\$BODY\$/g)].map(x=>x[1].trim());
  expect(originals).toHaveLength(6);
  expect(new Set(originals).size).toBe(6);
  expect(originals.every(t=>t.length>60)).toBe(true);
  expect(sql).toContain("نص إثراء مستقل جديد من ضاديوم");
  expect(sql).toContain("ليس نص القصة أو الأنشودة في كتاب الوزارة");
  expect(sql).toContain("bookContentUnverified");
 });
 it("does not rewrite student history or add secret answers or grades",()=>{
  expect(sql).toContain("c.code IS DISTINCT FROM 'BH'");
  expect(sql).toContain("g.grade_number IS DISTINCT FROM 1");
  expect(sql).toContain("l.semester IS DISTINCT FROM 2");
  expect(sql).toContain("student_lesson_progress");
  expect(sql).toContain("question_attempts");
  expect(sql).toContain("lesson_activity_attempts");
  expect(sql).toContain("IF n<>30 OR ids<>6 OR bad<>0");
  expect(sql).toContain("v.prompt,'{}'::jsonb,false");
  expect(sql).toContain("learning_objectives=jsonb_build_array");
  expect(sql).toContain("requiresTeacherRead");
  expect(sql).toContain("BEGIN;");
  expect(sql).toContain("COMMIT;");
  expect(sql).not.toMatch(/\bDELETE\s+FROM\b|\bTRUNCATE\b|\bGRANT\s|\bREVOKE\s/);
 });
});
