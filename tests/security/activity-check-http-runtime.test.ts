import { beforeEach, describe, expect, it, vi } from "vitest";

// Execute the real POST entry point with synthetic requests and no network,
// Supabase credentials, service-role keys or student data.
const { createClient, createAdminClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));

import { POST } from "../../app/api/lesson-activities/check/route";

const url = "http://localhost/api/lesson-activities/check";

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  createClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({
      data: { user: null }, error: null,
    }) },
  });
});

describe("real activity-check POST: malformed/oversized requests", () => {
  it("rejects malformed JSON and a missing body before a privileged read", async () => {
    const invalid = await POST(new Request(url, {
      method: "POST", body: "{not-json", headers: {
        "content-type": "application/json",
      },
    }));
    expect(invalid.status).toBe(400);

    const missing = await POST(new Request(url, { method: "POST" }));
    expect(missing.status).toBe(400);
    expect(createClient).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects non-object payloads and mixed/oversized answers before database access", async () => {
    for (const body of [
      null,
      ["not", "an", "object"],
      { activityId: "activity-1", answer: ["صحيح", 100] },
      { activityId: "activity-1", answer: ["أ".repeat(4097)] },
      { activityId: "activity-1", answer: Array(65).fill("كلمة") },
    ]) {
      const response = await POST(jsonRequest(body));
      expect(response.status).toBe(400);
    }
    expect(createClient).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects an advertised too-large Content-Length without reading Supabase", async () => {
    const response = await POST(jsonRequest(
      { activityId: "activity-1", answer: ["صواب"] },
      { "content-length": "32769" },
    ));
    expect(response.status).toBe(413);
    expect(createClient).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects chunked bodies above 32 KiB even without Content-Length", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(20000).fill(65));
        controller.enqueue(new Uint8Array(20000).fill(66));
        controller.close();
      },
    });
    const request = new Request(url, {
      method: "POST",
      body: stream,
      duplex: "half",
    } as RequestInit & { duplex: "half" });
    const response = await POST(request);
    expect(response.status).toBe(413);
    expect(createClient).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("preserves valid Arabic answer and matching formats through the HTTP boundary", async () => {
    const response = await POST(jsonRequest({
      activityId: "activity-1",
      answer: ["  طاووس  ", "رمان", "مفتاح|||باب"],
    }));
    // A syntactically valid answer reaches the normal authentication boundary,
    // not the input-validation rejection path.
    expect(response.status).toBe(401);
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});
