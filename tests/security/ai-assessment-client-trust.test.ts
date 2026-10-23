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

  it("prevents races in the session update", () => {
    expect(advance).toContain('.eq("current_question", session.current_question)');
    expect(advance).toContain('.eq("correct_answers", session.correct_answers)');
    expect(advance).toContain('.eq("wrong_answers", session.wrong_answers)');
    expect(advance).toContain(".maybeSingle()");
  });
});
