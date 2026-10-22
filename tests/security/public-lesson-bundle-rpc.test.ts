import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const path =
  "supabase/migrations/20261022195032_sanitize_public_get_lesson_page_bundle_answer_keys.sql";
const sql = readFileSync(resolve(process.cwd(), path), "utf8");
const start = sql.indexOf("CREATE OR REPLACE FUNCTION public.get_lesson_page_bundle(");
const end = sql.indexOf("COMMENT ON FUNCTION public.get_lesson_page_bundle");
const functionSQL = sql.slice(start, end);

describe("public lesson bundle never exposes question answer keys", () => {
  it("preserves the existing RPC signature without privileged escalation", () => {
    expect(start).toBeGreaterThan(0);
    expect(functionSQL).toContain("get_lesson_page_bundle(p_lesson_id uuid)");
    expect(functionSQL).toContain("RETURNS jsonb");
    expect(functionSQL).not.toMatch(/SECURITY DEFINER/i);
    expect(functionSQL).toContain("v_uid uuid := auth.uid()");
  });

  it("selects question data only through published student-safe view", () => {
    expect(functionSQL).toContain("from public.dadyoom_student_questions q");
    expect(functionSQL).not.toMatch(/from public\.questions q\s/i);
    expect(functionSQL).not.toMatch(/'correct_answer'\s*,/);
    expect(functionSQL).not.toMatch(/'explanation'\s*,/);
  });

  it("retains question shape and user's own progress fields", () => {
    expect(functionSQL).toContain("'question_order', q.question_order");
    expect(functionSQL).toContain("'options', q.options");
    expect(functionSQL).toContain("'points', q.points");
    expect(functionSQL).toContain("'questionAttempts', v_attempts");
    expect(functionSQL).toContain("'learningProgress', v_progress");
    expect(functionSQL).toContain("where slp.student_id = v_uid");
    expect(functionSQL).toContain("where qa.user_id = v_uid");
  });

  it("a rerun does not reset broader grants or mutate student data", () => {
    expect(functionSQL).not.toMatch(/\b(?:REVOKE|GRANT|DROP|TRUNCATE)\s/i);
    expect(functionSQL).not.toMatch(/\b(?:UPDATE|INSERT INTO|DELETE FROM)\s+public\.(?:student|question_attempts)/i);
  });
});
