import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const { createAdminClient, rpc } = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));

import { consumeSkillEvaluationQuota } from "../../lib/ai/consume-skill-evaluation-quota";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DADYOOM_ENFORCE_AI_SKILL_QUOTA", "enabled");
  createAdminClient.mockReturnValue({ rpc });
});
afterEach(() => vi.unstubAllEnvs());

describe("staged server-only AI evaluation budget", () => {
  it("does not pretend to enforce rate limits while the feature is disabled", async () => {
    vi.stubEnv("DADYOOM_ENFORCE_AI_SKILL_QUOTA", "disabled");
    expect(await consumeSkillEvaluationQuota("student-1", "ai_speaking_evaluate"))
      .toEqual({ enforced: false, allowed: true });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("reserves the right student's speaker evaluation with server role", async () => {
    rpc.mockResolvedValue({
      data: [{ allowed: true, used_count: 2, daily_limit: 3 }],
      error: null,
    });
    expect(await consumeSkillEvaluationQuota("student-1", "ai_speaking_evaluate"))
      .toEqual({ enforced: true, allowed: true, unavailable: false });
    expect(rpc).toHaveBeenCalledWith("dadyoom_consume_ai_skill_quota", {
      p_student_id: "student-1", p_feature: "ai_speaking_evaluate",
    });
  });

  it("blocks exhausted writing usage without attempting an AI call", async () => {
    rpc.mockResolvedValue({
      data: [{ allowed: false, used_count: 5, daily_limit: 5 }],
      error: null,
    });
    expect(await consumeSkillEvaluationQuota("student-2", "ai_writing_evaluate"))
      .toEqual({ enforced: true, allowed: false, unavailable: false });
  });

  it("fails closed if the RPC is absent, throws or returns fabricated results", async () => {
    for (const value of [
      { data: null, error: { code: "42883" } },
      { data: [], error: null },
      { data: [{ allowed: true, used_count: 999, daily_limit: 3 }], error: null },
      { data: [{ allowed: "true", used_count: 1, daily_limit: 3 }], error: null },
    ]) {
      rpc.mockResolvedValueOnce(value);
      expect(await consumeSkillEvaluationQuota("student-3", "ai_speaking_evaluate"))
        .toEqual({ enforced: true, allowed: false, unavailable: true });
    }
    rpc.mockRejectedValueOnce(new Error("DB connection lost"));
    expect(await consumeSkillEvaluationQuota("student-3", "ai_speaking_evaluate"))
      .toEqual({ enforced: true, allowed: false, unavailable: true });
  });

  it("rejects missing user IDs without even initializing privileged credentials", async () => {
    expect(await consumeSkillEvaluationQuota("", "ai_writing_evaluate"))
      .toEqual({ enforced: true, allowed: false, unavailable: true });
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});
