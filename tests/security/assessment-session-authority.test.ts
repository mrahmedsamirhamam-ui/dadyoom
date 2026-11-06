import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("AI assessment answer authority", () => {
  const nextRoute = read("app/api/ai/assessment/next/route.ts");
  const advance = read("features/assessment/services/advanceAssessmentSession.ts");
  const assessmentClient = read("features/assessment/components/LessonAssessment.tsx");
  const generator = read("app/api/ai/assessment/route.ts");
  const byId = read("app/api/ai/assessment/[id]/route.ts");
  const submit = read("app/api/ai/assessment/submit/route.ts");

  it("requires a specific saved assessment ID, not client-declared correctness", () => {
    expect(nextRoute).toContain("assessmentId?: string");
    expect(nextRoute).toContain("assessmentId,");
    expect(nextRoute).not.toContain("correct?: boolean");
    expect(nextRoute).not.toContain("body.correct");
    expect(assessmentClient).toMatch(/assessmentId:\s*assessment\?\.id/);
    expect(assessmentClient).not.toMatch(/correct:\s*result\.correct/);
  });

  it("counts only a persisted server-graded answer owned by the student", () => {
    expect(advance).toContain('from("assessment_session_answers")');
    expect(advance).toContain('.eq("session_id", sessionId)');
    expect(advance).toContain('.eq("student_id", studentId)');
    expect(advance).toContain("savedAnswer.assessment_id !== assessmentId");
    expect(advance).toContain("savedAnswer.lesson_id !== session.lesson_id");
    expect(advance).toContain("savedAnswers?.length !== previousCount + 1");
    expect(advance).toContain("savedAnswer.assessment_id !== assessmentId");
    expect(advance).toContain('.order("created_at", { ascending: true })');
    expect(advance).toContain("const answeredCorrectly = savedAnswer.is_correct");
    expect(submit).toMatch(/const correct\s*=\s*answer ===\s*assessment\.correct_answer/);
  });

  it("uses an optimistic session update to avoid double counting on replay", () => {
    expect(advance).toContain('.eq("current_question", session.current_question)');
    expect(advance).toContain('.eq("correct_answers", session.correct_answers)');
    expect(advance).toContain('.eq("wrong_answers", session.wrong_answers)');
    expect(advance).toContain(".maybeSingle()");
  });

  it("never includes the stored answer key in an unsubmitted question payload", () => {
    const start = generator.lastIndexOf("return NextResponse.json({\n      success: true,\n      assessment:");
    expect(start).toBeGreaterThan(-1);
    const publicPayload = generator.slice(start);
    expect(publicPayload).not.toMatch(/correctAnswer:\s*savedAssessment/);
    expect(publicPayload).not.toMatch(/explanation:\s*savedAssessment/);

    expect(byId).not.toContain("correctAnswer: data.correct_answer");
    expect(byId).not.toContain("explanation: data.explanation");
    expect(byId).toContain('.eq("student_email", user.email)');
  });
});
