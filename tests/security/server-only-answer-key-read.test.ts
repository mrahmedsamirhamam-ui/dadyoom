import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "app/api/questions/answer/route.ts"),
  "utf8"
);

describe("server-only stored MCQ answer-key access", () => {
  it("authenticates before any privileged answer-key read", () => {
    const authentication = source.indexOf("supabase.auth.getUser()");
    const authReject = source.indexOf("if (authError || !user)");
    const admin = source.indexOf("const admin = createAdminClient()");
    const keyLookup = source.indexOf('.from("questions")');
    expect(authentication).toBeGreaterThan(-1);
    expect(authReject).toBeGreaterThan(authentication);
    expect(admin).toBeGreaterThan(authReject);
    expect(keyLookup).toBeGreaterThan(admin);
    expect(source).toMatch(/await admin\s*\.from\("questions"\)/);
    expect(source).not.toMatch(/await supabase\s*\.from\("questions"\)/);
  });

  it("checks RLS-bound published lesson before grading and privileged write", () => {
    const keyLookup = source.indexOf('.from("questions")');
    const lessonLookup = source.indexOf('.from("lessons")');
    const publishGuard = source.indexOf('lesson.status !== "published"');
    const grade = source.indexOf("gradeStoredMcq(");
    const persist = source.indexOf('.from("question_attempts")');
    expect(lessonLookup).toBeGreaterThan(keyLookup);
    expect(source).toMatch(/await supabase\s*\.from\("lessons"\)/);
    expect(publishGuard).toBeGreaterThan(lessonLookup);
    expect(grade).toBeGreaterThan(publishGuard);
    expect(persist).toBeGreaterThan(grade);
  });

  it("does not accept user id or correctness from request body", () => {
    expect(source).toContain("user_id: user.id");
    expect(source).toContain("is_correct: grade.isCorrect");
    expect(source).not.toContain("raw?.userId");
    expect(source).not.toContain("raw?.isCorrect");
    expect(source.match(/const admin = createAdminClient\(\)/g)).toHaveLength(1);
  });
});
