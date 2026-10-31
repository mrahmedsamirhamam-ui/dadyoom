import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const script = readFileSync(
  resolve(process.cwd(), "scripts/curriculum-bh-g3-ten-stored-source-34-optional-practices-20261031.sql"),
  "utf8",
);

describe("Bahrain grade 3 original-text based supplementary tasks", () => {
  it("restricts production mutation to 10 unused published Bahrain grade-3 lessons", () => {
    expect(script).toContain("c.code='BH'");
    expect(script).toContain("g.grade_number=3");
    expect(script).toContain("l.status='published'");
    expect(script).toContain("student_lesson_progress");
    expect(script).toContain("question_attempts");
    expect(script).toContain("lesson_activity_attempts");
    expect(script).toContain("n<>10");
    expect(script).toContain("n<>34");
    expect(script).toContain("g1<>6 OR g2<>4");
    expect(script).toContain("BEGIN;");
    expect(script).toContain("COMMIT;");
    expect(script).not.toMatch(/\bDELETE\s+FROM\b|\bTRUNCATE\b|\bGRANT\s|\bREVOKE\s/i);
  });
  it("adds non-graded lessons supported by original body text", () => {
    expect(script).toContain("نص تعليمي أصلي داعم:");
    expect(script).toContain("نص قراءة أصلي:");
    expect(script).toContain("النص التدريبي الأصلي:");
    expect(script).toContain("v.task_prompt,'{}'::jsonb,false");
    expect(script).toContain("bookContentUnverified");
    expect(script).toContain("requiresTeacherRead");
    expect(script).toContain("teacherFeedbackRequired");
    expect(script).toContain("WHERE t.semester=2 OR v.ord<7");
    expect(script).toContain("IF six<>10");
  });
  it("preserves all four earlier unpublished semester-2 activities", () => {
    expect(script).toContain("AND counts.live_count=2 AND counts.all_count=3");
    expect(script).toContain("IF pub_sem2<>4 OR old_sem2<>4");
    expect(script).toContain("AND NOT a.is_published");
  });
});
