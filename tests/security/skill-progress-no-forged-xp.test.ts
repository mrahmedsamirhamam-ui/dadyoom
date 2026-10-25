import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

import { GET, POST } from "../../app/api/skills/progress/route";

const authenticatedId = "student-verified";
function setup(signedIn = true) {
  const from = vi.fn(() => {
    throw new Error("Skill POST must not read or write grading tables");
  });
  const getUser = vi.fn().mockResolvedValue({
    data: { user: signedIn ? { id: authenticatedId } : null },
    error: null,
  });
  createClient.mockResolvedValue({ auth: { getUser }, from });
  return { from, getUser };
}
beforeEach(() => vi.clearAllMocks());

describe("unverified browser skill scores cannot create XP or daily challenge rewards", () => {
  it("refuses unauthenticated score posts before touching grading tables", async () => {
    const db = setup(false);
    const response = await POST();
    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(db.from).not.toHaveBeenCalled();
  });

  it("rejects signed-in arbitrary 100% results without persisting any record", async () => {
    const db = setup();
    const response = await POST();
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body).toMatchObject({ ok: false, code: "UNVERIFIED_SKILL_SCORE" });
    expect(db.from).not.toHaveBeenCalled();
  });

  it("retains ownership-scoped progress GET without allowing reward changes", async () => {
    const filters: Array<[string, unknown]> = [];
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn((k: string, v: unknown) => {
        filters.push([k, v]);
        return Promise.resolve({
          data: [{ skill: "reading", best_score: 78, latest_score: 65, attempts: 2, xp: 15 }],
          error: null,
        });
      }),
    };
    const from = vi.fn((table: string) => {
      expect(table).toBe("student_skill_progress");
      return query;
    });
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({
        data: { user: { id: authenticatedId } },
        error: null,
      }) },
      from,
    });
    const response = await GET();
    expect(response.status).toBe(200);
    expect((await response.json()).progress[0].skill).toBe("reading");
    expect(filters).toContainEqual(["user_id", authenticatedId]);
    expect(query.select).toHaveBeenCalled();
  });

  it("never calls daily reward awarding or decodes submitted client score", async () => {
    const db = setup();
    const source = (await import("node:fs")).readFileSync(
      (await import("node:path")).resolve(
        process.cwd(), "app/api/skills/progress/route.ts"
      ), "utf8",
    );
    const post = source.slice(source.indexOf("export async function POST()"));
    expect(post).toContain("UNVERIFIED_SKILL_SCORE");
    expect(post).not.toContain("request.json()");
    expect(post).not.toContain(".upsert(");
    expect(post).not.toContain("completeDailyChallengeFromSkillResult");
    const response = await POST();
    expect(response.status).toBe(409);
    expect(db.from).not.toHaveBeenCalled();
  });
});
