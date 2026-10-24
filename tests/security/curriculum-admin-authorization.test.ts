import { beforeEach, describe, expect, it, vi } from "vitest";

const st = vi.hoisted(() => ({
  user: null as null | { id: string },
  userError: null as null | { message: string },
  role: false as boolean | null,
  roleError: null as null | { message: string },
  getUser: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: st.getUser },
    rpc: st.rpc,
    from: st.from,
  }),
}));

import { authorizeCurriculumAdmin } from "@/lib/auth/require-curriculum-admin";

beforeEach(() => {
  vi.clearAllMocks();
  st.user = null;
  st.userError = null;
  st.role = false;
  st.roleError = null;
  st.getUser.mockImplementation(async () => ({
    data: { user: st.user }, error: st.userError,
  }));
  st.rpc.mockImplementation(async () => ({ data: st.role, error: st.roleError }));
});

describe("HTTP curriculum admin authorization", () => {
  it("rejects anonymous requests before invoking any database role RPC", async () => {
    const access = await authorizeCurriculumAdmin();
    expect(access.authorized).toBe(false);
    if (access.authorized) throw new Error("unexpected admin");
    expect(access.response.status).toBe(401);
    expect(access.response.headers.get("Cache-Control")).toBe("no-store");
    expect(st.rpc).not.toHaveBeenCalled();
    expect(st.from).not.toHaveBeenCalled();
  });

  it("rejects Supabase Auth errors before any role query", async () => {
    st.userError = { message: "expired token" };
    const access = await authorizeCurriculumAdmin();
    expect(access.authorized).toBe(false);
    if (!access.authorized) expect(access.response.status).toBe(401);
    expect(st.rpc).not.toHaveBeenCalled();
  });

  it("rejects a logged-in student or forged user_metadata admin role", async () => {
    st.user = { id: "student-id", user_metadata: { role: "admin" } } as never;
    const access = await authorizeCurriculumAdmin();
    expect(access.authorized).toBe(false);
    if (!access.authorized) expect(access.response.status).toBe(403);
    expect(st.rpc).toHaveBeenCalledOnce();
    expect(st.rpc).toHaveBeenCalledWith("is_admin");
    expect(st.from).not.toHaveBeenCalled();
  });

  it("fails closed if the trusted permission routine is unavailable", async () => {
    st.user = { id: "student-id" };
    st.roleError = { message: "database unavailable" };
    const access = await authorizeCurriculumAdmin();
    expect(access.authorized).toBe(false);
    if (!access.authorized) expect(access.response.status).toBe(403);
  });

  it("requires an exact boolean true, not a string or numeric truthy claim", async () => {
    st.user = { id: "student-id" };
    st.role = "true" as never;
    const access = await authorizeCurriculumAdmin();
    expect(access.authorized).toBe(false);
  });

  it("allows only an authenticated user with is_admin()=true", async () => {
    st.user = { id: "admin-id" };
    st.role = true;
    const access = await authorizeCurriculumAdmin();
    expect(access.authorized).toBe(true);
    expect(st.rpc).toHaveBeenCalledWith("is_admin");
    expect(st.from).not.toHaveBeenCalled();
  });
});
