import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClient, createAdminClient, updateProgress,
  updateStudentMemory, invalidateStudentCaches,
} = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  updateProgress: vi.fn(),
  updateStudentMemory: vi.fn(),
  invalidateStudentCaches: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("@/services/progress/progress-engine", () => ({ updateProgress }));
vi.mock("@/features/student-memory/services/updateStudentMemory", () => ({ updateStudentMemory }));
vi.mock("@/features/student-progress/services/invalidate-student-caches", () => ({
  invalidateStudentCaches,
}));

import { POST } from "../../app/api/ai/assessment/submit/route";

const studentId = "11111111-1111-4111-8111-111111111111";
const lessonId = "22222222-2222-4222-8222-222222222222";
const sessionId = "33333333-3333-4333-8333-333333333333";
const assessmentId = "44444444-4444-4444-8444-444444444444";
const email = "student@example.invalid";

type Fixtures = {
  user?: { id: string; email: string } | null;
  assessment?: Record<string, unknown> | null;
  session?: Record<string, unknown> | null;
  lesson?: { id: string } | null;
  key?: Record<string, unknown> | null;
  claim?: { id: string } | null;
  recordedAnswers?: number | null;
  recordedAnswersError?: boolean;
};

function setup(options: Fixtures = {}) {
  const studentTables: string[] = [];
  const privateTables: string[] = [];
  const student = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: options.user === undefined ? { id: studentId, email } : options.user },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      studentTables.push(table);
      if (!["ai_assessments", "assessment_sessions", "assessment_session_answers", "lessons", "learning_plans"].includes(table)) {
        throw new Error("Student client touched a canonical grade table: " + table);
      }
      const q = {
        select: vi.fn(() => q),
        eq: vi.fn(() => q),
        then: (resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) =>
          Promise.resolve({
            count: options.recordedAnswers === undefined ? 0 : options.recordedAnswers,
            error: options.recordedAnswersError
              ? { message: "private table access denied" } : null,
          }).then(resolve, reject),
        update: vi.fn(() => q),
        or: vi.fn(async () => ({ error: null })),
        maybeSingle: vi.fn(async () => ({
          data: table === "ai_assessments"
            ? options.assessment === undefined
              ? {
                  id: assessmentId, lesson_id: lessonId, student_email: email,
                  question: "ما الحرف؟", choices: ["ألف", "باء"],
                  skill: "القراءة", completed: false,
                } : options.assessment
            : table === "assessment_sessions"
              ? options.session === undefined
                ? { id: sessionId, lesson_id: lessonId, student_id: studentId, finished: false,
                    current_question: 1, total_questions: 10, correct_answers: 0, wrong_answers: 0 }
                : options.session
              : table === "lessons"
                ? options.lesson === undefined ? { id: lessonId } : options.lesson
                : null,
          error: null,
        })),
      };
      return q;
    }),
  };
  const admin = {
    from: vi.fn((table: string) => {
      privateTables.push(table);
      if (table !== "ai_assessments" && table !== "assessment_session_answers") {
        throw new Error("Unexpected privileged table: " + table);
      }
      const q = {
        select: vi.fn(() => q),
        eq: vi.fn(() => q),
        update: vi.fn(() => q),
        upsert: vi.fn(async () => ({ error: null })),
        maybeSingle: vi.fn(async () => ({
          data: table !== "ai_assessments" ? null
            : q.update.mock.calls.length
              ? options.claim === undefined ? { id: assessmentId } : options.claim
              : options.key === undefined
                ? { id: assessmentId, lesson_id: lessonId,
                    correct_answer: 1, explanation: "إجابة معتمدة" }
                : options.key,
          error: null,
        })),
      };
      return q;
    }),
  };
  createClient.mockResolvedValue(student);
  createAdminClient.mockReturnValue(admin);
  updateProgress.mockResolvedValue(undefined);
  updateStudentMemory.mockResolvedValue([]);
  invalidateStudentCaches.mockResolvedValue(undefined);
  return { student, admin, studentTables, privateTables };
}

function request(body: Record<string, unknown> = {
  assessmentId, sessionId, answer: 1, studentId: "forged-student", correct: true,
}) {
  return new Request("http://localhost/api/ai/assessment/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("AI assessment submit: all canonical updates use a trusted client", () => {
  it("never opens a private writer for an unauthenticated request", async () => {
    const db = setup({ user: null });
    const res = await POST(request());
    expect(res.status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(db.studentTables).toEqual([]);
    expect(updateProgress).not.toHaveBeenCalled();
  });

  it("rejects a missing student assessment before any private key access", async () => {
    setup({ assessment: null });
    const res = await POST(request());
    expect(res.status).toBe(404);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(updateProgress).not.toHaveBeenCalled();
  });

  it("rejects a draft/unpublished lesson without accessing the private key", async () => {
    const db = setup({ lesson: null });
    const res = await POST(request());
    expect(res.status).toBe(404);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(db.studentTables).toEqual(["ai_assessments", "assessment_sessions", "lessons"]);
    expect(updateProgress).not.toHaveBeenCalled();
  });

  it("blocks already-finished sessions before trusted grading", async () => {
    setup({ session: {
      id: sessionId, lesson_id: lessonId, student_id: studentId, finished: true,
    } });
    expect((await POST(request())).status).toBe(500);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(updateProgress).not.toHaveBeenCalled();
  });

  it("refuses a second submitted question while the previous answer awaits /next", async () => {
    const db = setup({ recordedAnswers: 1 });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ success: false });
    expect(db.privateTables).toEqual([]);
    expect(updateProgress).not.toHaveBeenCalled();
  });

  it("refuses forged or malformed session counters before private key access", async () => {
    const session = {
      id: sessionId, lesson_id: lessonId, student_id: studentId, finished: false,
      current_question: 2, total_questions: 10,
      correct_answers: 0, wrong_answers: 0,
    };
    const db = setup({ session });
    expect((await POST(request())).status).toBe(409);
    expect(db.privateTables).toEqual([]);
    expect(updateProgress).not.toHaveBeenCalled();
  });

  it("fails closed when the student's own saved-answer count cannot be verified", async () => {
    let db = setup({ recordedAnswers: null });
    expect((await POST(request())).status).toBe(409);
    expect(db.privateTables).toEqual([]);
    expect(updateProgress).not.toHaveBeenCalled();

    vi.clearAllMocks();
    db = setup({ recordedAnswersError: true });
    expect((await POST(request())).status).toBe(500);
    expect(db.privateTables).toEqual([]);
    expect(updateProgress).not.toHaveBeenCalled();
  });

  it("accepts the next session slot only after the preceding answer was advanced", async () => {
    const db = setup({
      session: {
        id: sessionId, lesson_id: lessonId, student_id: studentId, finished: false,
        current_question: 2, total_questions: 10,
        correct_answers: 1, wrong_answers: 0,
      },
      recordedAnswers: 1,
    });
    expect((await POST(request())).status).toBe(200);
    expect(db.privateTables).toEqual([
      "ai_assessments", "ai_assessments", "assessment_session_answers",
    ]);
    expect(updateProgress).toHaveBeenCalledOnce();
  });

  it("rejects a duplicate assessment claim without awarding skill or XP", async () => {
    const db = setup({ claim: null });
    expect((await POST(request())).status).toBe(409);
    expect(db.privateTables).toEqual(["ai_assessments", "ai_assessments"]);
    expect(updateProgress).not.toHaveBeenCalled();
    expect(updateStudentMemory).not.toHaveBeenCalled();
  });

  it("saves verified question result then writes skill, XP and memory with trusted credentials", async () => {
    const db = setup();
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      success: true, correct: true, score: 100, memorySynced: true,
    });
    expect(db.privateTables).toEqual([
      "ai_assessments", "ai_assessments", "assessment_session_answers",
    ]);
    expect(updateProgress).toHaveBeenCalledExactlyOnceWith(db.admin, {
      studentEmail: email, skill: "القراءة", correct: true,
    });
    expect(updateStudentMemory).toHaveBeenCalledExactlyOnceWith({
      supabase: db.admin, studentId, studentEmail: email,
    });
    expect(invalidateStudentCaches).toHaveBeenCalledWith({
      studentId, studentEmail: email, supabase: db.student,
    });
    expect(db.studentTables).toEqual([
      "ai_assessments", "assessment_sessions", "lessons", "learning_plans",
    ]);
  });

  it("does not discard a committed correct answer when historical memory cannot be verified", async () => {
    const db = setup();
    updateStudentMemory.mockRejectedValueOnce(
      new Error("Synthetic unverifiable prior answer")
    );
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      success: true, correct: true, score: 100, memorySynced: false,
    });
    expect(updateProgress).toHaveBeenCalledOnce();
    expect(updateStudentMemory).toHaveBeenCalledWith({
      supabase: db.admin, studentId, studentEmail: email,
    });
    expect(invalidateStudentCaches).toHaveBeenCalled();
    expect(db.privateTables).toEqual([
      "ai_assessments", "ai_assessments", "assessment_session_answers",
    ]);
  });

  it("does not award a student XP from a forged client 'correct' flag", async () => {
    const db = setup();
    const res = await POST(request({
      assessmentId, sessionId, answer: 0, correct: true, skill: "forged",
      studentEmail: "attacker@example.invalid",
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ correct: false, score: 0 });
    expect(updateProgress).toHaveBeenCalledWith(db.admin, {
      studentEmail: email, skill: "القراءة", correct: false,
    });
    expect(updateStudentMemory).toHaveBeenCalledWith({
      supabase: db.admin, studentId, studentEmail: email,
    });
  });
});
