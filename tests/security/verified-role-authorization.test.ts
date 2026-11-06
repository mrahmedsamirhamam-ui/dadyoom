import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { authorizeSession } from "@/lib/auth/authorization";
import { hasVerifiedPrivilegedRole } from "@/lib/auth/pending-role-request";

type RoleRow = { role: string } | null;
type ApprovalRow = {
  requested_role: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
} | null;

function fakeClient(args: {
  userId?: string | null;
  profile?: RoleRow;
  profileError?: boolean;
  approval?: ApprovalRow;
  approvalError?: boolean;
  throwApproval?: boolean;
}) {
  const calls: string[] = [];
  const client = {
    auth: { getUser: vi.fn(async () => ({
      data: { user: args.userId ? { id: args.userId } : null },
      error: null,
    })) },
    from: vi.fn((table: string) => {
      calls.push(table);
      if (table !== "profiles" && table !== "profile_role_requests") {
        throw new Error("unexpected table");
      }
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        maybeSingle: vi.fn(async () => {
          if (table === "profiles") return {
            data: args.profile ?? null,
            error: args.profileError ? { message: "db unavailable" } : null,
          };
          if (args.throwApproval) throw new Error("connection interrupted");
          return {
            data: args.approval ?? null,
            error: args.approvalError ? { message: "rls denied" } : null,
          };
        }),
      };
      return chain;
    }),
  };
  return { client: client as unknown as SupabaseClient, calls };
}

const approvedTeacher: ApprovalRow = {
  requested_role: "teacher",
  status: "approved",
  reviewed_by: "verified-admin",
  reviewed_at: "2026-11-06T10:00:00Z",
};

describe("Verified role authorization (no real user data)", () => {
  it("rejects missing authentication before querying profile data", async () => {
    const { client, calls } = fakeClient({ userId: null });
    expect(await authorizeSession(client, ["teacher"])).toMatchObject({
      ok: false, status: 401,
    });
    expect(calls).toEqual([]);
  });

  it.each(["pending", "rejected"])(
    "rejects a teacher profile with %s role application",
    async (status) => {
      const { client } = fakeClient({
        userId: "test-id",
        profile: { role: "teacher" },
        approval: { ...approvedTeacher!, status },
      });
      expect(await authorizeSession(client, ["teacher"])).toEqual({
        ok: false, status: 403, error: "ROLE_APPROVAL_REQUIRED",
      });
    },
  );

  it("rejects an unreviewed teacher profile even when role is teacher", async () => {
    const { client } = fakeClient({
      userId: "test-id", profile: { role: "teacher" },
    });
    expect((await authorizeSession(client, ["teacher"])).ok).toBe(false);
  });

  it("rejects approval with no reviewer or verification time", async () => {
    const { client } = fakeClient({
      userId: "test-id",
      profile: { role: "teacher" },
      approval: { ...approvedTeacher!, reviewed_by: null },
    });
    expect(await hasVerifiedPrivilegedRole(client, "test-id", "teacher")).toBe(false);
  });

  it("rejects a wrong role approval and a failed RLS lookup", async () => {
    for (const failure of [
      { approval: { ...approvedTeacher!, requested_role: "school" } },
      { approvalError: true },
      { throwApproval: true },
    ]) {
      const { client } = fakeClient({
        userId: "test-id",
        profile: { role: "teacher" },
        ...failure,
      });
      expect((await authorizeSession(client, ["teacher"])).ok).toBe(false);
    }
  });

  it("accepts only the matching independently approved teacher role", async () => {
    const { client, calls } = fakeClient({
      userId: "test-id",
      profile: { role: "teacher" },
      approval: approvedTeacher,
    });
    expect(await authorizeSession(client, ["teacher"])).toMatchObject({ ok: true });
    expect(calls).toEqual(["profiles", "profile_role_requests"]);
  });

  it("rejects teacher routes for an ordinary student despite a forged metadata role", async () => {
    const { client, calls } = fakeClient({
      userId: "test-id", profile: { role: "student" }, approval: approvedTeacher,
    });
    expect(await authorizeSession(client, ["teacher"])).toMatchObject({
      ok: false, status: 403,
    });
    expect(calls).toEqual(["profiles"]);
  });

  it("allows normal student and admin roles without extra approval queries", async () => {
    for (const role of ["student", "admin"]) {
      const { client, calls } = fakeClient({
        userId: "test-id", profile: { role },
      });
      expect(await authorizeSession(client, [role])).toMatchObject({ ok: true });
      expect(calls).toEqual(["profiles"]);
    }
  });

  it("fails closed if profile query is unavailable", async () => {
    const { client } = fakeClient({
      userId: "test-id", profile: { role: "teacher" },
      profileError: true, approval: approvedTeacher,
    });
    expect(await authorizeSession(client, ["teacher"])).toMatchObject({
      ok: false, status: 403,
    });
  });

  it("guards teacher resource APIs and server-rendered portal", () => {
    const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
    const ai = read("app/api/teacher/assignment-ai/route.ts");
    const media = read("app/api/teacher/lesson-media/route.ts");
    const layout = read("components/roles/RolePortalLayout.tsx");
    expect(ai).toContain("await authorizeSession(");
    expect(ai.indexOf("await authorizeSession(")).toBeLessThan(ai.indexOf("await request.json()"));
    expect(media).toContain("await hasVerifiedPrivilegedRole(");
    expect(layout).toContain("await hasVerifiedPrivilegedRole(");
    expect(layout).toContain("redirect(\"/account/role-status\")");
  });
});
