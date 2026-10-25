import { beforeEach, describe, expect, it, vi } from "vitest";
import { readBoundedMultipart } from "../../lib/http/read-bounded-multipart";

const { createClient, generateContent } = vi.hoisted(() => ({
  createClient: vi.fn(),
  generateContent: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

import { POST } from "../../app/api/skills/speaking/evaluate/route";

function wavBytes() {
  const bytes = new Uint8Array(64);
  bytes.set([82, 73, 70, 70], 0); // RIFF
  bytes.set([87, 65, 86, 69], 8); // WAVE
  return bytes;
}
function audioRequest(
  options: {
    type?: string;
    bytes?: Uint8Array;
    expectedText?: string;
    contentLength?: string;
  } = {},
) {
  const data = new FormData();
  data.set(
    "audio",
    new File(
      [options.bytes ?? wavBytes()],
      "student.wav",
      { type: options.type ?? "audio/wav" },
    ),
  );
  data.set("expectedText", options.expectedText ?? "أحب القراءة باللغة العربية");
  const req = new Request("http://localhost/api/skills/speaking/evaluate", {
    method: "POST",
    body: data,
  });
  if (options.contentLength !== undefined) {
    req.headers.set("content-length", options.contentLength);
  }
  return req;
}
function setup(signedIn: boolean) {
  createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: signedIn ? { id: "test-learner" } : null },
        error: null,
      })),
    },
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("GEMINI_API_KEY_BACKUP", "TEST_ONLY_PLACEHOLDER");
  generateContent.mockResolvedValue({
    text: JSON.stringify({
      transcript: "أحب القراءة",
      overallScore: 71,
      pronunciationScore: 74,
      fluencyScore: 70,
      clarityScore: 72,
      accuracyScore: 68,
      feedback: "أحسنت.",
    }),
  });
});

describe("speaking evaluator protects paid AI and microphone data", () => {
  it("rejects anonymous requests before parsing any multipart audio or invoking AI", async () => {
    setup(false);
    const req = new Request("http://localhost/api/skills/speaking/evaluate", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "untrusted voice data",
    });
    const response = await POST(req);
    expect(response.status).toBe(401);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("rejects malformed multipart and invalid content length before AI", async () => {
    setup(true);
    const unsupported = await POST(new Request("http://localhost/voice", {
      method: "POST", body: "hello",
      headers: { "content-type": "text/plain" },
    }));
    expect(unsupported.status).toBe(415);
    const missingBoundary = await POST(new Request("http://localhost/voice", {
      method: "POST", body: "abc",
      headers: { "content-type": "multipart/form-data" },
    }));
    expect(missingBoundary.status).toBe(415);
    const malformedLength = await POST(audioRequest({ contentLength: "not-a-number" }));
    expect(malformedLength.status).toBe(400);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("rejects forged Content-Length and streaming payloads larger than the cap", async () => {
    setup(true);
    const declared = await POST(audioRequest({
      contentLength: String(10 * 1024 * 1024),
    }));
    expect(declared.status).toBe(413);

    const over = new Request("http://localhost/voice", {
      method: "POST",
      headers: { "content-type": "multipart/form-data; boundary=fake" },
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(512));
          controller.enqueue(new Uint8Array(512));
          controller.close();
        },
      }),
      duplex: "half",
    } as RequestInit);
    const bounded = await readBoundedMultipart(over, 800);
    expect(bounded).toEqual({ ok: false, status: 413 });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("rejects fake WAV bytes and incorrect audio MIME before model use", async () => {
    setup(true);
    const mime = await POST(audioRequest({ type: "application/octet-stream" }));
    expect(mime.status).toBe(400);
    const bad = await POST(audioRequest({ bytes: new Uint8Array(64) }));
    expect(bad.status).toBe(400);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("rejects extremely long student-supplied instructions before the model", async () => {
    setup(true);
    const result = await POST(audioRequest({ expectedText: "ض".repeat(601) }));
    expect(result.status).toBe(400);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("sends authorized WAV audio to the mocked AI and never grants skill XP", async () => {
    setup(true);
    const response = await POST(audioRequest());
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      ok: true,
      evaluation: { overallScore: 71, transcript: "أحب القراءة" },
    });
    expect(generateContent).toHaveBeenCalledOnce();
    const opts = generateContent.mock.calls[0][0];
    expect(opts.contents[1].inlineData.mimeType).toBe("audio/wav");
    expect(opts.contents[1].inlineData.data).toBeTruthy();
    expect(String(opts.contents[0].text)).toContain("أحب القراءة باللغة العربية");
  });

  it("does not expose provider error messages to learners", async () => {
    setup(true);
    generateContent.mockRejectedValue(new Error("private API or provider diagnostic"));
    const response = await POST(audioRequest());
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).not.toContain("private");
  });
});
