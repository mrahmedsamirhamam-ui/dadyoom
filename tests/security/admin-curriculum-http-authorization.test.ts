import { beforeEach, describe, expect, it, vi } from "vitest";

const st = vi.hoisted(() => ({
  decision: false,
  auth: vi.fn(),
  dbReads: vi.fn(),
  requestRead: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/require-curriculum-admin", () => ({
  authorizeCurriculumAdmin: st.auth,
}));

import { GET as qualityAudit } from "@/app/api/admin/lessons/quality-audit/route";
import { GET as runtimeAudit } from "@/app/api/admin/lessons/runtime-audit/route";
import { GET as rawMcqDump } from "@/app/api/admin/lessons/runtime-mcq-dump/route";
import { POST as qualityRepair } from "@/app/api/admin/lessons/quality-repair/route";

beforeEach(() => {
  vi.clearAllMocks();
  st.decision = false;
  st.auth.mockImplementation(async () => {
    if (!st.decision) return {
      authorized: false,
      response: new Response(
        JSON.stringify({ error: "not authorized" }),
        { status: 403 },
      ),
    };
    const query = {
      select: () => query,
      order: () => query,
      in: () => query,
      eq: () => query,
      then: (resolve: (v: unknown) => void) => {
        resolve({ data: [], error: null });
      },
    };
    return {
      authorized: true,
      supabase: {
        from: (table: string) => {
          st.dbReads(table);
          return query;
        },
      },
    };
  });
  st.requestRead.mockResolvedValue({ apply: true });
});

const routes = [
  { name: "quality audit", run: qualityAudit },
  { name: "runtime audit", run: runtimeAudit },
  { name: "raw MCQ debug dump", run: rawMcqDump },
];

describe("curriculum HTTP routes deny raw activity and answer access by default", () => {
  it.each(routes)("rejects unauthenticated/nonadmin $name before database reads", async ({ run }) => {
    const response = await run();
    expect(response.status).toBe(403);
    expect(st.auth).toHaveBeenCalledOnce();
    expect(st.dbReads).not.toHaveBeenCalled();
  });

  it("rejects repair requests even before parsing their body", async () => {
    const fakeRequest = { json: st.requestRead } as unknown as Request;
    const response = await qualityRepair(fakeRequest);
    expect(response.status).toBe(403);
    expect(st.dbReads).not.toHaveBeenCalled();
    expect(st.requestRead).not.toHaveBeenCalled();
  });

  it.each(routes)("preserves authorized $name read behavior", async ({ run }) => {
    st.decision = true;
    const response = await run();
    expect(response.status).toBe(200);
    expect(st.dbReads).toHaveBeenCalled();
  });

  it("preserves an authorized preview-only repair without writing rows", async () => {
    st.decision = true;
    st.requestRead.mockResolvedValueOnce({ apply: false });
    const response = await qualityRepair({ json: st.requestRead } as unknown as Request);
    expect(response.status).toBe(200);
    expect(st.requestRead).toHaveBeenCalledOnce();
    expect(st.dbReads).toHaveBeenCalledWith("lesson_activities");
  });
});
