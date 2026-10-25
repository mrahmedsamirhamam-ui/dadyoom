import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const { createClient, resolveTrustedDailyChallenge, getBahrainDate } = vi.hoisted(() => ({
  createClient: vi.fn(),
  resolveTrustedDailyChallenge: vi.fn(),
  getBahrainDate: vi.fn(() => "2026-10-25"),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/features/gamification/resolve-trusted-daily-challenge", () => ({
  resolveTrustedDailyChallenge,
}));
vi.mock("@/features/gamification/daily-challenge-server", () => ({
  getBahrainDate,
}));

import { POST } from "../../app/api/journey/daily/challenge/route";

const allowed = {
  id: "2026-10-25-reading",
  skill: "reading",
  title: "تحدي القارئ الذكي",
  targetScore: 60,
};
function fixture({ signedIn = true, existing = false }: {
  signedIn?: boolean; existing?: boolean;
} = {}) {
  const inserted: Record<string, unknown>[] = [];
  const q = {
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    maybeSingle: vi.fn(async () => ({
      data: existing ? { challenge_id: allowed.id, status: "accepted" } : null,
      error: null,
    })),
    insert: vi.fn((record: Record<string, unknown>) => {
      inserted.push(record);
      return q;
    }),
    single: vi.fn(async () => ({ data: inserted[0] ?? null, error: null })),
  };
  const from = vi.fn(() => q);
  createClient.mockResolvedValue({
    auth: { getUser: vi.fn(async () => ({
      data: { user: signedIn ? { id: "student-1" } : null },
      error: null,
    })) },
    from,
  });
  resolveTrustedDailyChallenge.mockResolvedValue(allowed);
  return { inserted, from, q };
}
async function submit(body: unknown) {
  return POST(new Request("http://localhost/api/journey/daily/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
}
beforeEach(() => vi.clearAllMocks());

describe("daily challenge cannot accept a browser-forged XP target", () => {
  it("does not query reward data or create a challenge for unauthenticated users", async () => {
    const { from } = fixture({ signedIn: false });
    const response = await submit(allowed);
    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
    expect(resolveTrustedDailyChallenge).not.toHaveBeenCalled();
  });

  it("rejects a client-forged zero or 1-point target before any INSERT", async () => {
    for (const forgedScore of [0, 1, 100]) {
      const ctx = fixture();
      const response = await submit({ ...allowed, targetScore: forgedScore });
      expect(response.status).toBe(409);
      expect(ctx.inserted).toHaveLength(0);
      expect(resolveTrustedDailyChallenge).toHaveBeenCalled();
    }
  });

  it("rejects forged skill, challenge ID and title", async () => {
    for (const override of [
      { skill: "writing" },
      { challengeId: "2026-10-25-speaking" },
      { title: "مزور" },
    ]) {
      const ctx = fixture();
      const response = await submit({
        challengeId: allowed.id, skill: allowed.skill,
        title: allowed.title, targetScore: allowed.targetScore,
        ...override,
      });
      expect(response.status).toBe(409);
      expect(ctx.inserted).toHaveLength(0);
    }
  });

  it("uses only server-calculated skill and score for accepted student challenge", async () => {
    const ctx = fixture();
    const response = await submit({
      challengeId: allowed.id,
      skill: allowed.skill,
      targetScore: allowed.targetScore,
      title: allowed.title,
    });
    expect(response.status).toBe(200);
    expect(ctx.inserted).toHaveLength(1);
    expect(ctx.inserted[0]).toMatchObject({
      user_id: "student-1",
      challenge_date: "2026-10-25",
      skill: allowed.skill,
      challenge_id: allowed.id,
      title: allowed.title,
      target_score: allowed.targetScore,
      bonus_xp: 0,
      bonus_awarded: false,
    });
    expect(ctx.q.eq).toHaveBeenCalledWith("user_id", "student-1");
  });

  it("preserves already-accepted challenge instead of rewriting the award", async () => {
    const ctx = fixture({ existing: true });
    const response = await submit({ challengeId: allowed.id });
    expect(response.status).toBe(200);
    expect(ctx.inserted).toEqual([]);
    expect(resolveTrustedDailyChallenge).not.toHaveBeenCalled();
  });

  it("enforces the same owner-scoped recommendation and rejects legacy 0-score XP", () => {
    const resolver = readFileSync(
      resolve(process.cwd(), "features/gamification/resolve-trusted-daily-challenge.ts"), "utf8"
    );
    const awarding = readFileSync(
      resolve(process.cwd(), "features/gamification/daily-challenge-server.ts"), "utf8"
    );
    expect(resolver).toContain('count: "exact"');
    expect(resolver).toContain('.eq("user_id", studentId)');
    expect(resolver).toContain(".range(offset, offset + limit - 1)");
    expect(resolver).toContain("recommendAdaptiveSkill(progress)");
    expect(resolver).toContain("createDailyChallenge({");
    expect(awarding).toContain("targetScore < 55 || targetScore > 100");
    expect(awarding).toContain("هدف التحدي اليومي غير موثوق");
  });
});
