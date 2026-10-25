import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, createAdminClient, revalidatePath } = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { submitStudyPlay } from "../../features/study-play/actions/submitStudyPlay";

const lessonId = "11111111-1111-4111-8111-111111111111";
const questionId = "22222222-2222-4222-8222-222222222222";

beforeEach(() => vi.clearAllMocks());

describe("study-play Server Action rejects forged payloads before any DB access", () => {
  it("rejects oversized, malformed and replayed answer IDs without calling Supabase", async () => {
    const valid = { questionId, optionId: "b" };
    const invalidSubmissions: unknown[] = [
      null,
      [],
      [{ questionId, optionId: "x".repeat(257) }],
      [{ questionId, optionId: { malicious: "nested" } }],
      [{ questionId: "fake", optionId: "b" }],
      [{ questionId, optionId: "  " }],
      [valid, valid],
      Array.from({ length: 101 }, () => valid),
    ];
    for (const submission of invalidSubmissions) {
      await expect(submitStudyPlay(
        lessonId, "review", submission as never,
      )).rejects.toThrow("بيانات إجابات غير صالحة أو مكررة.");
    }
    expect(createClient).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("checks authentication for a valid bounded answer set without private key reads", async () => {
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });
    await expect(submitStudyPlay(
      lessonId, "challenge", [{ questionId, optionId: "b" }],
    )).rejects.toThrow("سجل الدخول أولًا");
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
