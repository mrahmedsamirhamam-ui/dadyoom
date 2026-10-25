import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, askAI } = vi.hoisted(() => ({
  createClient: vi.fn(),
  askAI: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/importer/ai/client", () => ({ askAI }));

import { POST } from "../../app/api/skills/writing/evaluate/route";

function setup(signedIn = true) {
  const getUser = vi.fn(async () => ({
    data: { user: signedIn ? { id: "student-verified" } : null },
    error: null,
  }));
  createClient.mockResolvedValue({ auth: { getUser } });
}
function request(body: unknown, type = "application/json") {
  return new Request("http://localhost/api/skills/writing/evaluate", {
    method: "POST",
    headers: { "content-type": type },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  askAI.mockResolvedValue(JSON.stringify({
    overallScore: 76, spellingScore: 72, grammarScore: 73,
    coherenceScore: 80, styleScore: 79,
    strengths: ["كتابة واضحة"], feedback: "أحسنت.",
  }));
});

describe("writing evaluation requires identity and bounded trusted input", () => {
  it("rejects logged-out users before parsing JSON or invoking AI", async () => {
    setup(false);
    const response = await POST(request("{not even json}"));
    expect(response.status).toBe(401);
    expect(askAI).not.toHaveBeenCalled();
  });

  it("rejects invalid content types and malformed JSON before the model", async () => {
    setup();
    const wrongType = await POST(request("not json", "text/plain"));
    expect(wrongType.status).toBe(415);
    const broken = await POST(request("{"));
    expect(broken.status).toBe(400);
    const array = await POST(request("[]"));
    expect(array.status).toBe(400);
    expect(askAI).not.toHaveBeenCalled();
  });

  it("caps an oversized declared body and a real oversized streaming body", async () => {
    setup();
    const declared = request({ text: "سلام", prompt: "نص" });
    declared.headers.set("content-length", "25000");
    expect((await POST(declared)).status).toBe(413);
    const large = request({ text: "ع".repeat(11000), prompt: "نص" });
    expect((await POST(large)).status).toBe(413);
    expect(askAI).not.toHaveBeenCalled();
  });

  it("rejects short essays, overly long prompts and control characters", async () => {
    setup();
    expect((await POST(request({ text: "س", prompt: "عنوان" }))).status).toBe(400);
    expect((await POST(request({ text: "بداية قصة", prompt: "أ".repeat(601) }))).status).toBe(400);
    expect((await POST(request({ text: "بداية قصة", prompt: "سطر\nآخر" }))).status).toBe(400);
    expect(askAI).not.toHaveBeenCalled();
  });

  it("returns only formative evaluation for valid authorized writing", async () => {
    setup();
    const response = await POST(request({
      text: "أقرأ كل صباح لأتعلم كلمات جديدة.",
      prompt: "اكتب عن القراءة",
      score: 100, xp: 100000,
    }));
    expect(response.status).toBe(200);
    const value = await response.json();
    expect(value).toMatchObject({
      ok: true,
      evaluation: { overallScore: 76, feedback: "أحسنت." },
    });
    expect(value).not.toHaveProperty("xp");
    expect(askAI).toHaveBeenCalledOnce();
    expect(String(askAI.mock.calls[0][0])).not.toContain("100000");
  });
});
