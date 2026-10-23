import { beforeEach, describe, expect, it, vi } from "vitest";

// Run the real API handler with in-memory RLS-shaped fixtures and no network.
const { createClient, createAdminClient, generateContent } = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  generateContent: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn() } }));
vi.mock("@/features/assessment/services/isSemanticallyDuplicateQuestion", () => ({
  isSemanticallyDuplicateQuestion: vi.fn(async () => ({ duplicate: false, similarity: 0 })),
}));

import { GET } from "../../app/api/ai/assessment/route";

const studentId = "11111111-1111-4111-8111-111111111111";
const lessonId = "22222222-2222-4222-8222-222222222222";
const sessionId = "33333333-3333-4333-8333-333333333333";
const email = "learner@example.invalid";
type Row = Record<string, unknown>;
type Call = { table: string; selected: string; filters: Record<string, unknown> };
type Fixtures = {
  user?: { id: string; email: string } | null;
  lesson?: Row | null;
  session?: Row | null;
  pending?: Row | null;
};

function database(opts: Fixtures = {}) {
  const calls: Call[] = [];
  const rows: Record<string, Row | null> = {
    lessons: opts.lesson === undefined
      ? { id: lessonId, title: "تدريب القراءة", content: "نص تعليمي طويل", status: "published" }
      : opts.lesson,
    assessment_sessions: opts.session === undefined
      ? {
          id: sessionId, student_id: studentId, lesson_id: lessonId,
          current_question: 1, total_questions: 5, correct_answers: 0,
          wrong_answers: 0, finished: false,
        }
      : opts.session,
    ai_assessments: opts.pending === undefined
      ? {
          id: "44444444-4444-4444-8444-444444444444", title: "تدريب القراءة",
          passage: "نص تعليمي طويل", question: "ما الفكرة الأساسية؟",
          choices: ["خيار أ", "خيار ب"], skill: "القراءة", difficulty: "easy",
          completed: false, created_at: "2026-10-23T00:00:00Z",
          correct_answer: 1, explanation: "سِرّ لا يجب إرساله",
          lesson_id: lessonId, student_email: email,
        }
      : opts.pending,
  };
  const from = vi.fn((table: string) => {
    const record: Call = { table, selected: "", filters: {} };
    calls.push(record);
    const q = {
      select(fields: string) { record.selected = fields; return q; },
      eq(key: string, value: unknown) { record.filters[key] = value; return q; },
      order(_key: string, _options: object) { return q; },
      limit(_num: number) { return q; },
      async maybeSingle() {
        const row = rows[table] ?? null;
        const matches = row && Object.entries(record.filters)
          .every(([key, value]) => row[key] === value);
        return { data: matches ? row : null, error: null };
      },
    };
    return q;
  });
  const user = opts.user === undefined ? { id: studentId, email } : opts.user;
  createClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from,
  });
  return calls;
}

function request(id: string | null = sessionId) {
  const url = new URL("http://localhost/api/ai/assessment");
  url.searchParams.set("lessonId", lessonId);
  url.searchParams.set("difficulty", "easy");
  if (id !== null) url.searchParams.set("sessionId", id);
  return new Request(url.toString());
}

beforeEach(() => { vi.clearAllMocks(); });

describe("AI generation requires active student-owned session and never exposes keys", () => {
  it("rejects requests with no assessment session before opening a database", async () => {
    const response = await GET(request(null));
    expect(response.status).toBe(400);
    expect(createClient).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("does not let unauthenticated callers generate questions", async () => {
    database({ user: null });
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("rejects unpublished lessons before session and privileged access", async () => {
    const calls = database({ lesson: { id: lessonId, title: "مسودة", status: "draft", content: "نص" } });
    const response = await GET(request());
    expect(response.status).toBe(404);
    expect(calls.map(c => c.table)).toEqual(["lessons"]);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("rejects other students' sessions even with a known session ID", async () => {
    const calls = database({ session: {
      id: sessionId, student_id: "someone-else", lesson_id: lessonId, finished: false,
      current_question: 1, total_questions: 5, correct_answers: 0, wrong_answers: 0,
    } });
    const response = await GET(request());
    expect(response.status).toBe(404);
    expect(calls.find(x => x.table === "assessment_sessions")?.filters)
      .toMatchObject({ id: sessionId, student_id: studentId, lesson_id: lessonId });
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("blocks finished or inconsistent sessions", async () => {
    database({ session: {
      id: sessionId, student_id: studentId, lesson_id: lessonId, finished: true,
      current_question: 5, total_questions: 5, correct_answers: 4, wrong_answers: 1,
    } });
    expect((await GET(request())).status).toBe(404);
    database({ session: {
      id: sessionId, student_id: studentId, lesson_id: lessonId, finished: false,
      current_question: 4, total_questions: 5, correct_answers: 0, wrong_answers: 0,
    } });
    expect((await GET(request())).status).toBe(409);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("reuses a safe unanswered question without exposing its stored correct key", async () => {
    const calls = database();
    const response = await GET(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.provider).toBe("stored");
    expect(body.assessment.correctAnswer).toBeNull();
    expect(body.assessment.explanation).toBeNull();
    expect(JSON.stringify(body)).not.toContain("سِرّ");
    expect(JSON.stringify(body)).not.toContain("correct_answer");
    expect(calls.map(c => c.table)).toEqual([
      "lessons", "assessment_sessions", "ai_assessments",
    ]);
    expect(calls.find(c => c.table === "ai_assessments")?.selected)
      .not.toContain("correct_answer");
    expect(calls.find(c => c.table === "ai_assessments")?.selected)
      .not.toContain("explanation");
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(generateContent).not.toHaveBeenCalled();
  });
});
