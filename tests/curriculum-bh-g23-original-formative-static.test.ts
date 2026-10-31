import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const scripts = [
  ["Bahrain G2 original assessment revisions",2,9,27,
    "scripts/curriculum-bh-grade2-nine-original-reviews-27-formative-20261031.sql"],
  ["Bahrain G2 three original poetry supports",2,3,9,
    "scripts/curriculum-bh-grade2-three-original-poetry-support-9-formative-20261031.sql"],
  ["Bahrain G3 original dialogue units",3,3,12,
    "scripts/curriculum-bh-grade3-three-original-speaking-units-12-formative-20261031.sql"],
] as const;

describe("Dadyoom Bahrain grades 2-3 live non-graded original materials", () => {
  it.each(scripts)("%s is guarded to real, unused, published Bahrain lessons",
    (_name,grade,lessons,activities,path) => {
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
      expect(sql).toContain("v.prompt,'{}'::jsonb,false");
      expect(sql).toContain("bookContentUnverified");
      expect(sql).toMatch(/points<>0 OR answer<>'\{\}'::jsonb|answer<>'\{\}'::jsonb OR points<>0/);
      expect(sql).not.toMatch(/\bDELETE\s+FROM\b|\bTRUNCATE\b|\bGRANT\s|\bREVOKE\s/i);
    });
  it("uses real distinct authored passages, not published Ministry poem lyrics",()=>{
    const g2=readFileSync(resolve(process.cwd(),scripts[0][4]),"utf8");
    const g2poetry=readFileSync(resolve(process.cwd(),scripts[1][4]),"utf8");
    const g3=readFileSync(resolve(process.cwd(),scripts[2][4]),"utf8");
    expect(g2).toContain("عنوان التدريب:");
    expect(g2poetry).toContain("نص القراءة الأصلي:");
    expect(g2poetry).toContain("النص التدريبي الأصلي:");
    expect(g2poetry).toContain("originalPoemNotOfficial");
    expect(g3).toContain("النص التعليمي الأصلي من ضاديوم:");
    expect(g3).toContain("learning_objectives=jsonb_build_array");
  });
});
