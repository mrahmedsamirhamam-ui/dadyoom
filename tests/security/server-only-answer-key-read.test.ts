import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "app/api/questions/answer/route.ts"),
  "utf8"
);

describe("server-only stored MCQ answer-key access", () => {
  it("authenticates before looking up student-visible questions", () => {
    const authentication = source.indexOf("supabase.auth.getUser()");
    const authReject = source.indexOf("if (authError || !user)");
    const identifierGuard = source.indexOf('typeof questionId !== "string"');
    const safeView = source.indexOf('.from("dadyoom_student_questions")');
    expect(authentication).toBeGreaterThan(-1);
    expect(authReject).toBeGreaterThan(authentication);
    expect(identifierGuard).toBeGreaterThan(authReject);
    expect(safeView).toBeGreaterThan(identifierGuard);
    expect(source).toContain('.select("id,lesson_id")');
  });

  it("enforces student RLS and published lesson before any privileged key read", () => {
    const safeView = source.indexOf('.from("dadyoom_student_questions")');
    const visibleGuard = source.indexOf("if (!visibleQuestion)");
    const lessonLookup = source.indexOf('.from("lessons")');
    const publishGuard = source.indexOf('lesson.status !== "published"');
    const admin = source.indexOf("const admin = createAdminClient()");
    const keyLookup = source.indexOf('.from("questions")');
    const grade = source.indexOf("gradeStoredMcq(");
    const persist = source.indexOf('.from("question_attempts")');
    expect(safeView).toBeGreaterThan(-1);
    expect(visibleGuard).toBeGreaterThan(safeView);
    expect(lessonLookup).toBeGreaterThan(visibleGuard);
    expect(publishGuard).toBeGreaterThan(lessonLookup);
    expect(admin).toBeGreaterThan(publishGuard);
    expect(keyLookup).toBeGreaterThan(admin);
    expect(grade).toBeGreaterThan(keyLookup);
    expect(persist).toBeGreaterThan(grade);
    expect(source).toMatch(/await admin\s*\.from\("questions"\)/);
    expect(source).not.toMatch(/await supabase\s*\.from\("questions"\)/);
    expect(source).toContain('.eq("id", visibleQuestion.id)');
    expect(source).toContain('.eq("lesson_id", visibleQuestion.lesson_id)');
  });

  it("binds the saved attempt to the authenticated user and trusted grade", () => {
    expect(source).toContain("user_id: user.id");
    expect(source).toContain("is_correct: grade.isCorrect");
    expect(source).not.toContain("raw?.userId");
    expect(source).not.toContain("raw?.isCorrect");
    expect(source.match(/const admin = createAdminClient\(\)/g)).toHaveLength(1);
  });
});
