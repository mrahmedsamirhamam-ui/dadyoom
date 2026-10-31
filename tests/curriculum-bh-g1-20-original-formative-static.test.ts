import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const batch17 = readFileSync(resolve(process.cwd(),
  "scripts/curriculum-bh-grade1-17-objective-repairs-five-original-tasks-20261031.sql"),"utf8");
const batch3 = readFileSync(resolve(process.cwd(),
  "scripts/curriculum-bh-grade1-three-unit-reviews-15-formative-20261031.sql"),"utf8");

describe("Dadyoom Bahrain grade 1 reviewed original formative batches", () => {
  it.each([
    ["17 mismatch repairs",batch17,17,85],
    ["3 actual phonics unit review lessons",batch3,3,15],
  ])("%s is limited to unused published grade-1 Bahrain lessons and atomic rollback",
    (_name,sql,lessons,records) => {
      expect(sql).toMatch(/c\.code='BH'/);
      expect(sql).toMatch(/g\.grade_number=1/);
      expect(sql).toMatch(/l\.status='published'/);
      expect(sql).toMatch(/student_lesson_progress/);
      expect(sql).toMatch(/question_attempts/);
      expect(sql).toMatch(/lesson_activity_attempts/);
      expect(sql).toMatch(/BEGIN;/);
      expect(sql).toMatch(/COMMIT;/);
      expect(sql).toContain("n<>"+lessons);
      expect(sql).toContain("n<>"+records);
      expect(sql).toMatch(/answer,'\{\}'::jsonb,false/);
      expect(sql).toMatch(/0,true/);
      expect(sql).toMatch(/bookContentUnverified/);
      expect(sql).toMatch(/learning_objectives=jsonb_build_array/);
      expect(sql).not.toMatch(/\bDELETE\s+FROM\b|\bTRUNCATE\b|\bDROP\s+TABLE\s+(?!IF\s+EXISTS)/i);
      expect(sql).not.toMatch(/\bGRANT\s|\bREVOKE\s|service_role/);
    });
  it("the 17 lesson repair ties the new objectives to the actual enrichment text",()=>{
    expect(batch17).toContain("الكلمات المفتاحية:");
    expect(batch17).toContain("أطبق بنفسي:");
    expect(batch17).toContain("previous_objectives");
    expect(batch17).toContain("NOT (l.learning_objectives::text ILIKE");
    expect(batch17).toContain("requiresTeacherRead");
    expect(batch17).toContain("originalText");
  });
  it("the three phonics unit reviews use real lesson letter and word lists",()=>{
    expect(batch3).toContain("نراجع الحروف:");
    expect(batch3).toContain("في المستوى الثاني نربط الكلمات التالية بحروفها الأولى:");
    expect(batch3).toContain("letterCards");
    expect(batch3).toContain("wordCards");
    expect(batch3).toContain("source review");
  });
});
