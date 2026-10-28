import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const path = "supabase/migrations/20261028153044_guard_published_activity_content_against_nested_answer_keys.sql";
const sql = readFileSync(resolve(process.cwd(), path), "utf8");
const executable = sql.replace(/--[^\n]*/g, "");

describe("Published activities: deeply nested answer keys stay private", () => {
  it("validates a content-only, security-invoker recursive JSON check", () => {
    expect(executable).toContain("CREATE OR REPLACE FUNCTION public.dadyoom_published_activity_content_safe");
    expect(executable).toMatch(/IMMUTABLE SECURITY INVOKER/i);
    expect(executable).toContain("SET search_path = pg_catalog, pg_temp");
    expect(executable).toContain("pg_catalog.jsonb_each(p_content)");
    expect(executable).toContain("pg_catalog.jsonb_array_elements(p_content)");
    expect(executable).toContain("public.dadyoom_published_activity_content_safe(v)");
    expect(executable).toContain("pg_catalog.regexp_replace(k,'[^a-zA-Z0-9]','','g')");
  });

  it("rejects grading metadata only when published, keeping draft answers intact", () => {
    expect(executable).toContain("is_published IS DISTINCT FROM true");
    expect(executable).toContain("lesson_activities_published_content_has_no_grading_keys");
    expect(executable).toContain("VALIDATE CONSTRAINT lesson_activities_published_content_has_no_grading_keys");
    for (const normalizedKey of [
      "answer", "answerkey", "correctanswer", "correctword", "iscorrect",
      "solution", "grading", "expectedanswer", "markscheme",
      "correctchoice", "answerindex", "pointsawarded",
    ]) expect(executable).toContain("'" + normalizedKey + "'");
  });

  it("does not manipulate student results, answer columns or published rows", () => {
    expect(executable).not.toMatch(/\b(?:UPDATE|DELETE FROM|INSERT INTO|TRUNCATE TABLE|DROP TABLE)\b/i);
    expect(executable).not.toMatch(/question_attempts|student_lesson_progress|lesson_activity_attempts/i);
    expect(executable).not.toMatch(/SET\s+answer\b/i);
  });
});
