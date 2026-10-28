import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
const detail=read("app/api/ai/assessment/[id]/route.ts");
const creator=read("app/api/ai/assessment/route.ts");
const next=read("app/api/ai/assessment/next/route.ts");
const advance=read("features/assessment/services/advanceAssessmentSession.ts");

describe("AI assessment answer-key confidentiality and authoritative progression", () => {
  it("never returns keys before a question is answered", () => {
    for(const src of [detail,creator]) {
      expect(src).toContain("correctAnswer: null");
      expect(src).toContain("explanation: null");
      expect(src).not.toContain(".select(\"*\")");
    }
    expect(creator).toContain("generated.correctAnswer");
    expect(creator).toContain("correct_answer:");
  });
  it("ignores the client-provided boolean and requires a new owned attempt", () => {
    const auth=next.indexOf("supabase.auth.getUser()");
    const session=next.indexOf('.from("assessment_sessions")');
    const lesson=next.indexOf('.eq("status", "published")');
    const answers=next.indexOf('.from("assessment_session_answers")');
    const key=next.indexOf('.select("id,lesson_id,student_email,correct_answer,completed")');
    const advanceCall=next.indexOf("await advanceAssessmentSession({");
    expect(auth).toBeGreaterThan(-1);
    expect(session).toBeGreaterThan(auth);
    expect(lesson).toBeGreaterThan(session);
    expect(answers).toBeGreaterThan(lesson);
    expect(key).toBeGreaterThan(answers);
    expect(advanceCall).toBeGreaterThan(key);
    expect(next).toContain("latest.selected_answer === privateQuestion.correct_answer");
    expect(next).toContain("savedAnswers.length !== previous + 1");
    expect(next).toContain("savedAnswers.length !== authorizedSession.current_question");
    expect(next).not.toContain('typeof body.correct !==');
    expect(next).not.toContain('answeredCorrectly:\n          body.correct');
    expect(next).toContain("supabase: admin,");
  });
  it("student UI accepts redacted pre-submit fields and safe post-submit feedback", () => {
    const assessmentType=read("types/assessment.ts");
    const view=read("features/assessment/components/LessonAssessment.tsx");
    expect(assessmentType).toContain("correctAnswer: number | null");
    expect(assessmentType).toContain("explanation: string | null");
    expect(view).toContain("correctAnswer: number | null");
    expect(view).toContain("assessment.explanation ||");
    expect(view).toContain("راجع شرح الدرس");
  });

  it("checks published lesson before creating or returning AI test data", () => {
    const create = creator.indexOf('const lesson =');
    const status = creator.indexOf('lesson.status !== "published"');
    const admin = creator.indexOf("const admin = createAdminClient()");
    const saved = creator.indexOf('.from("ai_assessments")\n      .insert({');
    expect(create).toBeGreaterThan(-1);
    expect(status).toBeGreaterThan(create);
    expect(admin).toBeGreaterThan(status);
    expect(saved).toBeGreaterThan(admin);
    expect(creator).toMatch(/await admin\s*\.from\("ai_assessments"\)\s*\.insert/);

    const start = read("app/api/ai/assessment/session/route.ts");
    const user = start.indexOf("supabase.auth.getUser()");
    const published = start.indexOf('.eq("status", "published")');
    const privateWriter = start.indexOf("const admin = createAdminClient()");
    expect(user).toBeGreaterThan(-1);
    expect(published).toBeGreaterThan(user);
    expect(privateWriter).toBeGreaterThan(published);
    expect(start).toContain("supabase: admin,");
  });

  it("blocks display of an old question after its lesson is unpublished", () => {
    const safeQuestion = detail.indexOf('.from("ai_assessments")');
    const parent = detail.indexOf('.from("lessons")');
    const published = detail.indexOf('.eq("status", "published")');
    const response = detail.indexOf("return NextResponse.json({\n    success: true");
    expect(safeQuestion).toBeGreaterThan(-1);
    expect(parent).toBeGreaterThan(safeQuestion);
    expect(published).toBeGreaterThan(parent);
    expect(response).toBeGreaterThan(published);
    expect(detail).toContain('id,lesson_id,title,passage');
  });

  it("recomputes session analytics from trusted keys rather than writable is_correct", () => {
    const analytics = read("features/assessment/services/getAssessmentSessionAnalytics.ts");
    expect(analytics).toContain("assessment_id,");
    expect(analytics).toContain("selected_answer,");
    expect(analytics).toContain('.select("id,correct_answer,skill")');
    expect(analytics).toContain('.eq("student_email", studentEmail)');
    expect(analytics).toContain('.eq("lesson_id", lessonId)');
    expect(analytics).toContain("answer.selected_answer === correctByAssessment.get(answer.assessment_id)");
    expect(analytics).not.toContain("answer.is_correct === true");
    expect(next).toContain("supabase: admin,");
    expect(next).toContain("studentEmail: user.email,");
    expect(next).toContain("lessonId: publishedLesson.id,");
  });

  it("latest analytics verifies authenticated ownership before private keys", () => {
    const latest=read("features/assessment/services/getLatestAssessmentAnalytics.ts");
    const auth=latest.indexOf("supabase.auth.getUser()");
    const ownership=latest.indexOf("user.id !== studentId");
    const session=latest.indexOf('.from("assessment_sessions")');
    const admin=latest.indexOf("supabase: createAdminClient()");
    expect(latest).toContain('import "server-only"');
    expect(auth).toBeGreaterThan(-1);
    expect(ownership).toBeGreaterThan(auth);
    expect(session).toBeGreaterThan(ownership);
    expect(admin).toBeGreaterThan(session);
    expect(latest).toContain("studentEmail: user.email");
    expect(latest).toContain("lessonId: session.lesson_id");
  });

  it("trusts server question skill and handles empty analytics without NaN", () => {
    const analytics = read("features/assessment/services/getAssessmentSessionAnalytics.ts");
    const scoring = read("features/assessment/services/analyzeAssessment.ts");
    expect(analytics).toContain('.select("id,correct_answer,skill")');
    expect(analytics).not.toContain("answer.skill.trim()");
    expect(scoring).toContain("Math.max(questions.length, 1)");
  });

  it("prevents races in the session update", () => {
    expect(advance).toContain('.eq("current_question", session.current_question)');
    expect(advance).toContain('.eq("correct_answers", session.correct_answers)');
    expect(advance).toContain('.eq("wrong_answers", session.wrong_answers)');
    expect(advance).toContain(".maybeSingle()");
  });
});
