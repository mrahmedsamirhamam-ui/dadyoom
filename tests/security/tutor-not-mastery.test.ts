import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(resolve(process.cwd(),p),"utf8");
const stream = read("app/api/semantic-search/stream/route.ts");
const client = read("features/semantic-search/components/LessonSemanticSearch.tsx");

describe("tutoring must never certify lesson mastery", () => {
  it("does not grade student when assistant successfully answers a question", () => {
    expect(stream).not.toContain("updateLessonMastery");
    expect(stream).not.toContain("answeredCorrectly");
    expect(stream).not.toContain('.from("lesson_mastery")');
    expect(stream).toContain("await saveLessonChat({");
    expect(stream).toContain("await createLessonSuggestions({");
    expect(existsSync(resolve(process.cwd(),
      "features/semantic-search/services/updateLessonMastery.ts"))).toBe(false);
  });

  it("requires a published lesson before reading stored chat and lesson context", () => {
    const auth = stream.indexOf("supabase.auth.getUser()");
    const lesson = stream.indexOf('.from("lessons")');
    const published = stream.indexOf('.eq("status", "published")');
    const deny = stream.indexOf("if (!publishedLesson)");
    const history = stream.indexOf("await loadLessonChat({");
    expect(auth).toBeGreaterThan(-1);
    expect(lesson).toBeGreaterThan(auth);
    expect(published).toBeGreaterThan(lesson);
    expect(deny).toBeGreaterThan(published);
    expect(history).toBeGreaterThan(deny);
  });

  it("AI MCQ attempts stay in assessment sessions, not canonical lesson mastery", () => {
    const submit = read("app/api/ai/assessment/submit/route.ts");
    expect(submit).not.toContain("updateLessonMastery");
    expect(submit).not.toContain('.from("lesson_mastery")');
    expect(submit).toContain("await saveAssessmentSessionAnswer({");
    expect(submit).toContain("await updateProgress(");
    expect(submit).toContain("isCorrect:");
    expect(submit).toContain("correct,");
  });

  it("AI assessment validates user-owned session and published lesson before private answer key", () => {
    const submit = read("app/api/ai/assessment/submit/route.ts");
    const session = submit.indexOf('.from("assessment_sessions")');
    const lesson = submit.indexOf('.from("lessons")');
    const publish = submit.indexOf('.eq("status", "published")');
    const keyAdmin = submit.indexOf("const admin = createAdminClient()");
    const privateKey = submit.indexOf('.select("id,lesson_id,correct_answer,explanation")');
    const claim = submit.indexOf("completed: true");
    const safeQuestionRead = submit.slice(0, session);
    expect(safeQuestionRead).toContain('.from("ai_assessments")');
    expect(safeQuestionRead).not.toContain("correct_answer,");
    expect(session).toBeGreaterThan(0);
    expect(lesson).toBeGreaterThan(session);
    expect(publish).toBeGreaterThan(lesson);
    expect(keyAdmin).toBeGreaterThan(publish);
    expect(privateKey).toBeGreaterThan(keyAdmin);
    expect(claim).toBeGreaterThan(privateKey);
    expect(submit).toContain(".eq(\"student_id\", user.id)");
    expect(submit).toContain(".eq(\"student_email\", user.email)");
  });

  it("keeps forged AI grades off the client and wrong-answer key hidden", () => {
    const submit = read("app/api/ai/assessment/submit/route.ts");
    expect(submit).toContain("supabase: admin,");
    expect(submit).toContain("claimedAssessmentId = null;");
    expect(submit).toContain("claimedStudentEmail = user.email");
    expect(submit).toContain("correctAnswer: correct ? privateAssessment.correct_answer : null");
    expect(submit).toContain("explanation: correct ? privateAssessment.explanation : null");
    expect(submit).not.toMatch(/await supabase\s*\.from\("ai_assessments"\)\s*\.update\(/);
  });

  it("does not broadcast academic mastery changes on mere chat completion", () => {
    expect(client).not.toContain("lesson-mastery-updated");
    expect(client).toContain('event.type === "done"');
  });
});
