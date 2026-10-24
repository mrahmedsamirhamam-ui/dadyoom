import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, createAdminClient, generateContent, isSemanticallyDuplicateQuestion } =
  vi.hoisted(() => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
    generateContent: vi.fn(),
    isSemanticallyDuplicateQuestion: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class { models = { generateContent }; },
}));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn() } }));
vi.mock("@/features/assessment/services/isSemanticallyDuplicateQuestion", () => ({
  isSemanticallyDuplicateQuestion,
}));

import { GET } from "../../app/api/ai/assessment/route";

const studentId = "11111111-1111-4111-8111-111111111111";
const lessonId = "22222222-2222-4222-8222-222222222222";
const sessionId = "33333333-3333-4333-8333-333333333333";
const email = "verified-student@example.invalid";

type Recorded = { table: string; selected: string; predicates: Record<string, unknown> };
type FixtureOptions = { duplicate?: boolean; authenticated?: boolean };

function fixture(options: FixtureOptions = {}) {
  const studentCalls: Recorded[] = [];
  const adminCalls: Recorded[] = [];

  const studentFrom = vi.fn((table: string) => {
    if (!["lessons", "assessment_sessions", "assessment_session_answers",
      "ai_assessments", "learning_plans"].includes(table)) {
      throw new Error("Unexpected student table: " + table);
    }
    const record: Recorded = { table, selected: "", predicates: {} };
    studentCalls.push(record);
    const query = {
      select: vi.fn((fields: string) => { record.selected = fields; return query; }),
      eq: vi.fn((key: string, value: unknown) => {
        if (key === "question_hash" || key === "correct_answer") {
          throw new Error("Student token accessed a private assessment field");
        }
        record.predicates[key] = value;
        return query;
      }),
      order: vi.fn(() => query),
      limit: vi.fn(() => query),
      not: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({
        data: table === "lessons"
          ? { id: lessonId, title: "القراءة", content: "نص تعليمي", status: "published" }
          : table === "assessment_sessions"
            ? {
              id: sessionId, student_id: studentId, lesson_id: lessonId,
              current_question: 1, total_questions: 5,
              correct_answers: 0, wrong_answers: 0, finished: false,
            }
            : null,
        error: null,
      })),
      then: (resolve: (x: unknown) => unknown, reject?: (error: unknown) => unknown) =>
        Promise.resolve({
          data: table === "ai_assessments" ? [] : null,
          count: table === "assessment_session_answers" ? 0 : null,
          error: null,
        }).then(resolve, reject),
    };
    return query;
  });

  const saved = {
    id: "44444444-4444-4444-8444-444444444444",
    title: "القراءة", passage: "نص تعليمي", question: "ما الحرف الأول؟",
    choices: ["ألف", "باء", "جيم", "دال"],
    skill: "الاستيعاب المباشر", difficulty: "easy", completed: false,
    created_at: "2026-10-24T00:00:00Z",
  };
  const adminFrom = vi.fn((table: string) => {
    if (table !== "ai_assessments") throw new Error("Unexpected admin table");
    const record: Recorded = { table, selected: "", predicates: {} };
    adminCalls.push(record);
    let isInsert = false;
    const query = {
      select: vi.fn((fields: string) => { record.selected = fields; return query; }),
      eq: vi.fn((key: string, value: unknown) => {
        record.predicates[key] = value; return query;
      }),
      limit: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({
        data: options.duplicate ? { id: saved.id } : null,
        error: null,
      })),
      insert: vi.fn(() => { isInsert = true; return query; }),
      single: vi.fn(async () => ({
        data: isInsert ? saved : null,
        error: null,
      })),
    };
    return query;
  });
  const student = {
    auth: { getUser: vi.fn(async () => ({
      data: { user: options.authenticated === false ? null : { id: studentId, email } },
      error: null,
    })) },
    from: studentFrom,
  };
  const admin = { from: adminFrom };
  createClient.mockResolvedValue(student);
  createAdminClient.mockReturnValue(admin);
  generateContent.mockResolvedValue({
    text: JSON.stringify({
      question: "ما الحرف الأول؟",
      choices: ["ألف", "باء", "جيم", "دال"],
      correctAnswer: 1,
      explanation: "مفتاح سري",
      skill: "الاستيعاب المباشر", difficulty: "easy",
    }),
  });
  isSemanticallyDuplicateQuestion.mockResolvedValue({ duplicate: false, similarity: 0 });
  return { student, admin, studentCalls, adminCalls };
}

const request = () => new Request(
  "http://localhost/api/ai/assessment?lessonId=" + lessonId +
  "&sessionId=" + sessionId + "&difficulty=easy"
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("GEMINI_API_KEY", "ci-test-placeholder-not-real");
  vi.stubEnv("GEMINI_API_KEY_BACKUP", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("student safe AI generation after question_hash grants cutover", () => {
  it("queries private duplicate hashes using admin only after published lesson and owned session", async () => {
    const db = fixture();
    const response = await GET(request());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      success: true, provider: "gemini",
      assessment: { question: "ما الحرف الأول؟", correctAnswer: null, explanation: null },
    });
    expect(JSON.stringify(body)).not.toContain("مفتاح سري");
    expect(db.studentCalls.some(x => x.predicates.question_hash !== undefined)).toBe(false);
    expect(db.studentCalls.some(x => x.selected.includes("correct_answer"))).toBe(false);
    const hash = db.adminCalls.find(x => x.predicates.question_hash !== undefined);
    expect(hash).toBeDefined();
    expect(hash?.predicates).toMatchObject({
      student_email: email, lesson_id: lessonId,
      question_hash: expect.any(String),
    });
    expect(hash?.selected).toBe("id");
    expect(db.adminCalls.some(x => x.selected.includes("id,title,passage"))).toBe(true);
    expect(db.studentCalls.map(c => c.table).slice(0,3)).toEqual([
      "lessons", "assessment_sessions", "assessment_session_answers",
    ]);
  });

  it("rejects anonymous generation before privileged client or provider is used", async () => {
    const db = fixture({ authenticated: false });
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(db.adminCalls).toEqual([]);
    expect(generateContent).not.toHaveBeenCalled();
  });
});
