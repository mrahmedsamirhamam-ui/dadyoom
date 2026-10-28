import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClient,
  createAdminClient,
  advanceAssessmentSession,
  getAssessmentSessionAnalytics,
  completeAdaptiveStep,
  verifyAssessmentCompletionReceipt,
} = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  advanceAssessmentSession: vi.fn(),
  getAssessmentSessionAnalytics: vi.fn(),
  completeAdaptiveStep: vi.fn(),
  verifyAssessmentCompletionReceipt: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("@/features/assessment/services/advanceAssessmentSession", () => ({
  advanceAssessmentSession,
}));
vi.mock("@/features/assessment/services/getAssessmentSessionAnalytics", () => ({
  getAssessmentSessionAnalytics,
}));
vi.mock("@/features/learning-plan/services/adaptive-path-lifecycle", () => ({
  completeAdaptiveStep,
}));
vi.mock("@/features/assessment/services/verifyAssessmentCompletionReceipt", () => ({
  verifyAssessmentCompletionReceipt,
}));

import { POST } from "../../app/api/ai/assessment/next/route";

const sessionId = "11111111-1111-4111-8111-111111111111";
const studentId = "22222222-2222-4222-8222-222222222222";
const lessonId = "33333333-3333-4333-8333-333333333333";
const assessmentId = "44444444-4444-4444-8444-444444444444";
const email = "test-student@example.invalid";

function request(body: Record<string, unknown> = { sessionId, correct: true }) {
  return new Request("http://localhost/api/ai/assessment/next", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

type StubOptions = {
  user?: { id: string; email: string } | null;
  session?: Record<string, unknown> | null;
  lesson?: { id: string } | null;
  answers?: Record<string, unknown>[];
  privateKey?: Record<string, unknown> | null;
  advanced?: Record<string, unknown>;
};

function stub(options: StubOptions = {}) {
  const studentTables: string[] = [];
  const privateTables: string[] = [];
  const user = options.user === undefined ? { id: studentId, email } : options.user;
  const session = options.session === undefined
    ? {
        id: sessionId, lesson_id: lessonId, student_id: studentId,
        current_question: 1, total_questions: 1,
        correct_answers: 0, wrong_answers: 0, finished: false,
      } : options.session;
  const lesson = options.lesson === undefined ? { id: lessonId } : options.lesson;
  const answers = options.answers === undefined
    ? [{
        id: "answer-1", assessment_id: assessmentId,
        selected_answer: 0, created_at: "2026-10-23T00:00:00Z",
      }] : options.answers;
  const key = options.privateKey === undefined
    ? { id: assessmentId, lesson_id: lessonId, student_email: email,
        correct_answer: 1, completed: true } : options.privateKey;

  const fromStudent = vi.fn((table: string) => {
    studentTables.push(table);
    if (table === "assessment_sessions" || table === "lessons") {
      const q = {
        select: vi.fn(() => q),
        eq: vi.fn(() => q),
        maybeSingle: vi.fn(async () => ({
          data: table === "assessment_sessions" ? session : lesson,
          error: null,
        })),
      };
      return q;
    }
    if (table === "assessment_session_answers") {
      const q = {
        select: vi.fn(() => q),
        eq: vi.fn(() => q),
        order: vi.fn(() => q),
        then: (onOk: (value: unknown) => unknown, onError?: (error: unknown) => unknown) =>
          Promise.resolve({ data: answers, error: null }).then(onOk, onError),
      };
      return q;
    }
    throw new Error("Unexpected student-table query: " + table);
  });

  const fromAdmin = vi.fn((table: string) => {
    privateTables.push(table);
    if (table !== "ai_assessments") throw new Error("Unexpected admin query: " + table);
    const q = {
      select: vi.fn(() => q),
      eq: vi.fn(() => q),
      maybeSingle: vi.fn(async () => ({ data: key, error: null })),
    };
    return q;
  });

  const authClient = {
    auth: { getUser: vi.fn(async () => ({
      data: { user }, error: null,
    })) },
    from: fromStudent,
  };
  const adminClient = { from: fromAdmin };
  createClient.mockResolvedValue(authClient);
  createAdminClient.mockReturnValue(adminClient);
  advanceAssessmentSession.mockResolvedValue(options.advanced ?? {
    id: sessionId, lesson_id: lessonId, current_question: 1,
    total_questions: 1, correct_answers: 0, wrong_answers: 1,
    difficulty: "easy", finished: true,
  });
  getAssessmentSessionAnalytics.mockResolvedValue({ numberOfQuestions: 1 });
  completeAdaptiveStep.mockResolvedValue({
    updated: true, reason: "completed", pathCompleted: true,
    currentStep: { status: "completed" }, nextStep: null,
  });
  return { studentTables, privateTables, adminClient, authClient };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DADYOOM_TRUSTED_ASSESSMENT_RECEIPTS", "");
  verifyAssessmentCompletionReceipt.mockResolvedValue(true);
});
afterEach(() => vi.unstubAllEnvs());

describe("AI assessment next: authenticated and server-only adaptive advancement", () => {
  it("rejects unauthenticated clients without opening the private session writer", async () => {
    const db = stub({ user: null });
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(db.studentTables).toEqual([]);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(completeAdaptiveStep).not.toHaveBeenCalled();
  });

  it("rejects an RLS-invisible session and a draft lesson before privilege elevation", async () => {
    let db = stub({ session: null });
    let response = await POST(request());
    expect(response.status).toBe(404);
    expect(db.studentTables).toEqual(["assessment_sessions"]);
    expect(createAdminClient).not.toHaveBeenCalled();

    vi.clearAllMocks();
    db = stub({ lesson: null });
    response = await POST(request());
    expect(response.status).toBe(404);
    expect(db.studentTables).toEqual(["assessment_sessions", "lessons"]);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("ignores forged browser correctness and uses the trusted answer key", async () => {
    const db = stub();
    const response = await POST(request({ sessionId, correct: true }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      success: true, session: { finished: true, correctAnswers: 0, wrongAnswers: 1 },
      adaptivePath: { updated: true },
    });
    expect(advanceAssessmentSession).toHaveBeenCalledWith({
      supabase: db.adminClient,
      sessionId, studentId, answeredCorrectly: false,
    });
    expect(completeAdaptiveStep).toHaveBeenCalledWith({
      supabase: db.adminClient,
      studentId, lessonId, stepType: "assessment",
    });
    expect(db.privateTables).toEqual(["ai_assessments"]);
  });

  it("cannot advance a session without a newly recorded and verifiable answer", async () => {
    const db = stub({ answers: [] });
    const response = await POST(request({ sessionId, correct: true }));
    expect(response.status).toBe(409);
    expect(db.privateTables).toEqual([]);
    expect(advanceAssessmentSession).not.toHaveBeenCalled();
    expect(completeAdaptiveStep).not.toHaveBeenCalled();
  });

  it("requires a server receipt for an opt-in fresh, verified finish", async () => {
    vi.stubEnv("DADYOOM_TRUSTED_ASSESSMENT_RECEIPTS", "enabled");
    const db = stub();
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(verifyAssessmentCompletionReceipt).toHaveBeenCalledWith({
      admin: db.adminClient,
      session: expect.objectContaining({ id: sessionId, finished: true }),
      studentId, lessonId,
      analytics: expect.any(Object),
      allowCreate: true,
    });
    expect(completeAdaptiveStep).toHaveBeenCalledWith({
      supabase: db.adminClient,
      studentId, lessonId, stepType: "assessment",
    });
  });

  it("reconciles an interrupted already-finished session only with a trusted receipt", async () => {
    vi.stubEnv("DADYOOM_TRUSTED_ASSESSMENT_RECEIPTS", "enabled");
    const db = stub({ session: {
      id: sessionId, lesson_id: lessonId, student_id: studentId,
      current_question: 1, total_questions: 1,
      correct_answers: 0, wrong_answers: 1, finished: true,
    } });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect((await response.json()).adaptivePath).toMatchObject({ updated: true });
    expect(verifyAssessmentCompletionReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        admin: db.adminClient, allowCreate: false, studentId, lessonId,
      })
    );
    expect(db.studentTables).not.toContain("assessment_session_answers");
    expect(completeAdaptiveStep).toHaveBeenCalledTimes(1);
  });

  it("fails closed if a finished session has no matching immutable receipt", async () => {
    vi.stubEnv("DADYOOM_TRUSTED_ASSESSMENT_RECEIPTS", "enabled");
    verifyAssessmentCompletionReceipt.mockResolvedValue(false);
    stub({ session: {
      id: sessionId, lesson_id: lessonId, student_id: studentId,
      current_question: 1, total_questions: 1,
      correct_answers: 0, wrong_answers: 1, finished: true,
    } });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(completeAdaptiveStep).not.toHaveBeenCalled();
  });

  it("will not grant adaptive completion from a previously finished, client-writable session", async () => {
    const db = stub({ session: {
      id: sessionId, lesson_id: lessonId, student_id: studentId,
      current_question: 1, total_questions: 1,
      correct_answers: 1, wrong_answers: 0, finished: true,
    } });
    const response = await POST(request({ sessionId, correct: true }));
    expect(response.status).toBe(200);
    expect((await response.json()).adaptivePath).toBeNull();
    expect(advanceAssessmentSession).toHaveBeenCalledWith({
      supabase: db.adminClient,
      sessionId, studentId, answeredCorrectly: false,
    });
    expect(completeAdaptiveStep).not.toHaveBeenCalled();
    expect(db.studentTables).not.toContain("assessment_session_answers");
  });
});
