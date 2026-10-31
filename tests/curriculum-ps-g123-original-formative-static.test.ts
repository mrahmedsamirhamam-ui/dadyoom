import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve(process.cwd(),
  "scripts/curriculum-ps-grades123-57-source-grounded-formative-20261031.sql"), "utf8");
const postAudit = readFileSync(resolve(process.cwd(),
  "scripts/curriculum-ps-grades123-formative-readonly-audit-20261031.sql"), "utf8");

describe("Palestinian grades 1-3 original supplementary tasks", () => {
  it("targets only previously activity-free published Palestinian grade 1-3 lessons", () => {
    expect(sql).toContain("c.code='PS'");
    expect(sql).toContain("g.grade_number BETWEEN 1 AND 3");
    expect(sql).toContain("l.status='published'");
    expect(sql).toContain("student_lesson_progress");
    expect(sql).toContain("question_attempts");
    expect(sql).toContain("lesson_activity_attempts");
    expect(sql).toContain("candidate_count <> 57");
    expect(sql).toContain("inserted_count<>171");
  });

  it("uses only original lesson passages and vocab, without grading or secret answers", () => {
    expect(sql).toContain("l.content");
    expect(sql).toContain("l.vocabulary");
    expect(sql).toContain("requiresTeacherRead");
    expect(sql).toContain("originalText");
    expect(sql).toContain("0, true, v.section, v.prompt, '{}'::jsonb, false");
    expect(sql).toContain("completion-only");
    expect(sql).not.toMatch(/service_role|GRANT\s|REVOKE\s|TRUNCATE\s/i);
    expect(postAudit).toContain("graded_or_secret_bearing");
    expect(postAudit).toContain("without_published_activities");
  });
});
