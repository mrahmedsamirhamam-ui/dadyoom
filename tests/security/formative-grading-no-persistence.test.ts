import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Execute the real endpoint with mocked authentication and a fake Gemini
// response. A real database is never contacted and user data is synthetic.
const { createServerClient, getUser, from, cookies } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
  cookies: vi.fn(),
}));
vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/headers", () => ({ cookies }));
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { POST } from "../../app/api/assessments/check/route";

const studentEmail = "student@example.invalid";

function request(items: unknown[] = [{
  question: "ما اسم الحرف؟",
  modelAnswer: "الألف",
  studentAnswer: "الألف",
}]) {
  return new Request("http://localhost/api/assessments/check", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      lessonId: "fake-lesson",
      items,
      studentId: "forged-student",
      awardXP: 9000,
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn(() => {
    throw new Error("UNMOCKED_NETWORK_ACCESS_IN_FORMATIVE_TEST");
  }));
  vi.stubEnv("GEMINI_API_KEY", "test-only-no-network");
  vi.stubEnv("GEMINI_API_KEY_BACKUP", "");
  vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
  getUser.mockResolvedValue({
    data: { user: { id: "trusted-id", email: studentEmail } },
    error: null,
  });
  from.mockImplementation(() => {
    throw new Error("Untrusted formative route touched the database");
  });
  createServerClient.mockReturnValue({
    auth: { getUser },
    from,
  });
  cookies.mockResolvedValue({ getAll: () => [], set: vi.fn() });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /api/assessments/check remains formative when answers come from browser", () => {
  it("returns AI feedback without inserting official assessments or skills", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify({
          results: [{
            correct: true, score: 100, skill: "القراءة",
            feedback: "إجابة صحيحة", teacherComment: "جيد",
            mistakeCategory: null, difficulty: "سهل",
            recommendation: "استمر", strengths: ["قراءة"], mistakes: [],
          }],
        }) }] } }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      practiceOnly: true,
      persisted: false,
      results: [{ correct: true, score: 100, skill: "القراءة" }],
    });
    expect(from).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(createServerClient).toHaveBeenCalledTimes(1);
  });

  it("rejects an unauthenticated user before invoking Gemini or any grading write", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a payload with more than twenty self-provided answers", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(request(Array.from({ length: 21 }, () => ({
      question: "test", modelAnswer: "a", studentAnswer: "a",
    }))));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("returns a no-persistence fallback on Gemini rate-limit and rejects empty model answers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { code: 429, message: "Synthetic throttle" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const pending = POST(request([{
      question: "أي حرف؟", modelAnswer: "", studentAnswer: "أي شيء",
    }]));
    const response = await pending;
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      fallback: true,
      practiceOnly: true,
      persisted: false,
      results: [{ correct: false, score: 40 }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(from).not.toHaveBeenCalled();
  });
});
