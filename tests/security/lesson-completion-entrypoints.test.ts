import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Source-level regression gates: all old entry points MUST use the same
 * authenticated, assessment-gated completion action. No live sessions
 * or student data are created by this test.
 */
const source = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

const canonicalRoute = "app/api/lessons/complete/route.ts";
const action = "features/student-progress/actions/completeLesson.ts";
const aliases = [
  "app/api/progress/route.ts",
  "app/api/progress/complete/route.ts",
] as const;

describe("canonical lesson completion entry points", () => {
  it.each(aliases)("%s delegates POST to the canonical handler", (path) => {
    const code = source(path);
    expect(code).toMatch(
      /export\s*\{\s*POST\s*\}\s*from\s*["']@\/app\/api\/lessons\/complete\/route["']/
    );
    expect(code).not.toMatch(/\.from\(["'](?:student_progress|lesson_progress)["']\)/);
    expect(code).not.toMatch(/\.insert\s*\(|\.upsert\s*\(|\.update\s*\(/);
  });

  it("legacy client button cannot write or undo lesson completion directly", () => {
    const code = source("app/lessons/[id]/CompleteLessonButton.tsx");
    expect(code).toContain('fetch("/api/lessons/complete"');
    expect(code).not.toMatch(/\.from\(["'](?:lesson_progress|student_progress|student_lesson_progress)["']\)/);
    expect(code).not.toMatch(/\.upsert\s*\(|nextCompleted|!completed\s*;/);
    expect(code).toContain("response.ok");
    expect(code).toContain("setError(");
  });

  it("canonical server handler validates identity and delegates to mastery gate", () => {
    const code = source(canonicalRoute);
    expect(code).toContain("supabase.auth.getUser()");
    expect(code).toContain('.from("student_lesson_progress")');
    expect(code).toMatch(/\.eq\(\s*["']student_id["']\s*,\s*user\.id\s*\)/);
    expect(code).toContain("completeLessonAction(");
    expect(code).toContain("status: 409");
  });

  it("canonical action rejects incomplete activities and mastery below 90%", () => {
    const code = source(action);
    expect(code).toMatch(/REQUIRED_MASTERY_SCORE\s*=\s*90/);
    expect(code).toContain("requiredCompletionActivities");
    expect(code).toContain("answeredQuestions <");
    expect(code).toContain("score < REQUIRED_MASTERY_SCORE");
    expect(code).toContain("throw new Error(");
  });
});
