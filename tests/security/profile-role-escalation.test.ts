import path from "node:path";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST as completeProfile } from "@/app/api/auth/complete-profile/route";
import { POST as oauthIntent } from "@/app/api/auth/oauth-intent/route";
import { GET as authCallback } from "@/app/auth/callback/route";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

type QueryResult = { data: unknown; error: unknown };
type QueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
};

function makeDb(options: {
  user?: { id: string; email: string } | null;
  userError?: unknown;
  result?: QueryResult;
  exchangeError?: unknown;
  rpcResult?: QueryResult;
  rpcHandler?: (name: string, payload: Record<string, unknown>) => QueryResult;
}) {
  const state = {
    inserts: [] as Record<string, unknown>[],
    updates: [] as Record<string, unknown>[],
    eqs: [] as [string, unknown][],
    upserts: 0,
    rpcs: [] as [string, Record<string, unknown>][],
  };
  const builder = {} as QueryBuilder;
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn((column: string, value: unknown) => {
    state.eqs.push([column, value]);
    return builder;
  });
  builder.maybeSingle = vi.fn(async () => options.result ?? { data: null, error: null });
  builder.insert = vi.fn((payload: Record<string, unknown>) => {
    state.inserts.push(payload);
    return builder;
  });
  builder.update = vi.fn((payload: Record<string, unknown>) => {
    state.updates.push(payload);
    return builder;
  });
  builder.upsert = vi.fn(() => {
    state.upserts += 1;
    return builder;
  });

  const client = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: options.user === undefined ? { id: "u1", email: "user@example.test" } : options.user },
        error: options.userError ?? null,
      })),
      exchangeCodeForSession: vi.fn(async () => ({ error: options.exchangeError ?? null })),
    },
    from: vi.fn(() => builder),
    rpc: vi.fn(async (name: string, payload: Record<string, unknown>) => {
      state.rpcs.push([name, payload]);
      return options.rpcHandler?.(name, payload) ?? options.rpcResult ?? {
        data: payload.p_role ?? null,
        error: null,
      };
    }),
  };
  return { client, builder, state };
}

function sessionDb(result: QueryResult) {
  return makeDb({ result });
}

function connectClients(user: ReturnType<typeof makeDb>, admin: ReturnType<typeof makeDb>) {
  vi.mocked(createClient).mockResolvedValue(
    user.client as unknown as Awaited<ReturnType<typeof createClient>>,
  );
  vi.mocked(createAdminClient).mockReturnValue(
    admin.client as unknown as ReturnType<typeof createAdminClient>,
  );
}

const completeRequest = (body: unknown) =>
  new Request("http://localhost/api/auth/complete-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const callbackRequest = () => new Request("http://localhost/auth/callback?code=synthetic");

const intentCookie = (role: string) =>
  Buffer.from(JSON.stringify({ fullName: "Google User", role, country: "BH" }), "utf8").toString("base64url");

const originalRpcMode = process.env.TASK03D_ONBOARDING_RPC_MODE;

function enableRpcMode() {
  process.env.TASK03D_ONBOARDING_RPC_MODE = "on";
}

beforeEach(() => {
  vi.clearAllMocks();
  if (originalRpcMode === undefined) delete process.env.TASK03D_ONBOARDING_RPC_MODE;
  else process.env.TASK03D_ONBOARDING_RPC_MODE = originalRpcMode;
});

afterEach(() => {
  if (originalRpcMode === undefined) delete process.env.TASK03D_ONBOARDING_RPC_MODE;
  else process.env.TASK03D_ONBOARDING_RPC_MODE = originalRpcMode;
});

describe("profile completion role escalation", () => {
  it("rejects self-selected privileged roles before any service-role write", async () => {
    const user = sessionDb({ data: null, error: null });
    const admin = makeDb({});
    connectClients(user, admin);

    const response = await completeProfile(
      completeRequest({ fullName: "Synthetic User", role: "teacher", country: "BH" }),
    );

    expect(response.status).toBe(403);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(admin.state.inserts).toHaveLength(0);
    expect(admin.state.updates).toHaveLength(0);
  });

  it("blocks role changes from an existing student profile", async () => {
    const user = sessionDb({
      data: { role: "student", country: null, full_name: "" },
      error: null,
    });
    const admin = makeDb({});
    connectClients(user, admin);

    const response = await completeProfile(
      completeRequest({ fullName: "Synthetic User", role: "parent", country: "BH" }),
    );

    expect(response.status).toBe(409);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("creates new profiles with a self-signup role and never uses upsert", async () => {
    const user = sessionDb({ data: null, error: null });
    const admin = makeDb({
      result: { data: { id: "u1", role: "student" }, error: null },
    });
    connectClients(user, admin);

    const response = await completeProfile(
      completeRequest({ fullName: "Synthetic User", role: "student", country: "BH" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, destination: "/student" });
    expect(admin.state.inserts).toEqual([{
      id: "u1",
      email: "user@example.test",
      full_name: "Synthetic User",
      role: "student",
      country: "BH",
    }]);
    expect(admin.state.upserts).toBe(0);
  });

  it("preserves a stored privileged role while completing only name and country", async () => {
    const user = sessionDb({
      data: { role: "teacher", country: null, full_name: "" },
      error: null,
    });
    const admin = makeDb({
      result: { data: { id: "u1", role: "teacher" }, error: null },
    });
    connectClients(user, admin);

    const response = await completeProfile(
      completeRequest({ fullName: "Existing Teacher", role: "teacher", country: "BH" }),
    );

    expect(response.status).toBe(200);
    expect(admin.state.updates).toEqual([{ full_name: "Existing Teacher", country: "BH" }]);
    expect(admin.state.eqs).toEqual([["id", "u1"], ["role", "teacher"]]);
    expect(admin.state.inserts).toHaveLength(0);
    expect(admin.state.upserts).toBe(0);
  });

  it("fails closed when the profile lookup fails", async () => {
    const user = sessionDb({ data: null, error: new Error("RLS_DENIED") });
    const admin = makeDb({});
    connectClients(user, admin);

    const response = await completeProfile(
      completeRequest({ fullName: "Synthetic User", role: "student", country: "BH" }),
    );

    expect(response.status).toBe(503);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("ignores the body role when a complete stored profile exists", async () => {
    const user = sessionDb({
      data: { role: "student", country: "BH", full_name: "Stored Student" },
      error: null,
    });
    const admin = makeDb({});
    connectClients(user, admin);

    const response = await completeProfile(
      completeRequest({ fullName: "Ignored", role: "school", country: "BH" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, destination: "/student" });
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});

describe("gated one-time onboarding", () => {
  const ONBOARDING_RPC = "task03d_complete_self_signup";
  const baseline = { data: { role: "student", country: null, full_name: "" }, error: null };

  it.each(["parent", "child"])("completes a legitimate %s baseline selection through the RPC", async (role) => {
    enableRpcMode();
    const user = makeDb({
      result: baseline,
      rpcHandler: (name, payload) => {
        expect(name).toBe(ONBOARDING_RPC);
        expect(payload).toEqual({
          p_full_name: "Synthetic Onboarder",
          p_country: "BH",
          p_role: role,
        });
        return { data: role, error: null };
      },
    });
    const admin = makeDb({});
    connectClients(user, admin);

    const response = await completeProfile(
      completeRequest({ fullName: "Synthetic Onboarder", role, country: "BH" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, destination: `/${role}` });
    expect(user.state.rpcs).toHaveLength(1);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(admin.state.inserts).toHaveLength(0);
    expect(admin.state.updates).toHaveLength(0);
  });

  it("does not re-open onboarding for an already complete student", async () => {
    enableRpcMode();
    const user = makeDb({
      result: {
        data: { role: "student", country: "BH", full_name: "Existing Student" },
        error: null,
      },
    });
    const admin = makeDb({});
    connectClients(user, admin);

    const response = await completeProfile(
      completeRequest({ fullName: "Ignored", role: "parent", country: "BH" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, destination: "/student" });
    expect(user.state.rpcs).toHaveLength(0);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("fails closed on a repeated onboarding request instead of writing directly", async () => {
    enableRpcMode();
    let calls = 0;
    const user = makeDb({
      result: baseline,
      rpcHandler: () => {
        calls += 1;
        return calls === 1
          ? { data: "parent", error: null }
          : { data: null, error: { code: "22023", message: "TASK03D_NO_PENDING_ONBOARDING" } };
      },
    });
    const admin = makeDb({});
    connectClients(user, admin);

    const first = await completeProfile(
      completeRequest({ fullName: "First Try", role: "parent", country: "BH" }),
    );
    const second = await completeProfile(
      completeRequest({ fullName: "Replay Try", role: "child", country: "BH" }),
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(503);
    expect(user.state.rpcs).toHaveLength(2);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(admin.state.inserts).toHaveLength(0);
  });

  it("allows exactly one concurrent onboarding request", async () => {
    enableRpcMode();
    let consumed = false;
    const user = makeDb({
      result: baseline,
      rpcHandler: (_name, payload) => {
        if (consumed) {
          return { data: null, error: { code: "22023", message: "token consumed" } };
        }
        consumed = true;
        return { data: payload.p_role, error: null };
      },
    });
    const admin = makeDb({});
    connectClients(user, admin);

    const responses = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        completeProfile(
          completeRequest({
            fullName: `Concurrent ${index}`,
            role: index % 2 === 0 ? "parent" : "child",
            country: "BH",
          }),
        ),
      ),
    );

    const statuses = responses.map((response) => response.status);
    expect(statuses.filter((status) => status === 200)).toHaveLength(1);
    expect(statuses.filter((status) => status === 503)).toHaveLength(7);
    expect(user.state.rpcs).toHaveLength(8);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(admin.state.inserts).toHaveLength(0);
  });

  it("rejects an incomplete baseline student with no one-time token", async () => {
    enableRpcMode();
    const user = makeDb({
      result: { data: { role: "student", country: null, full_name: "" }, error: null },
      rpcHandler: () => ({
        data: null,
        error: { code: "22023", message: "TASK03D_NO_PENDING_ONBOARDING" },
      }),
    });
    const admin = makeDb({});
    connectClients(user, admin);

    const response = await completeProfile(
      completeRequest({ fullName: "Pretend New", role: "parent", country: "BH" }),
    );

    expect(response.status).toBe(503);
    expect(user.state.rpcs).toHaveLength(1);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("refuses privileged escalation before invoking the onboarding RPC", async () => {
    enableRpcMode();
    for (const role of ["teacher", "school", "admin"]) {
      const user = makeDb({ result: baseline });
      const admin = makeDb({});
      connectClients(user, admin);

      const response = await completeProfile(
        completeRequest({ fullName: "Escalation Try", role, country: "BH" }),
      );

      expect(response.status).toBe(403);
      expect(user.state.rpcs).toHaveLength(0);
      expect(createAdminClient).not.toHaveBeenCalled();
    }
  });

  it("refuses to change a stored privileged role through the activated route", async () => {
    enableRpcMode();
    const user = makeDb({
      result: { data: { role: "teacher", country: null, full_name: "" }, error: null },
    });
    const admin = makeDb({});
    connectClients(user, admin);

    const response = await completeProfile(
      completeRequest({ fullName: "Escalation Try", role: "admin", country: "BH" }),
    );

    expect(response.status).toBe(403);
    expect(user.state.rpcs).toHaveLength(0);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("fails closed when the onboarding RPC is missing", async () => {
    enableRpcMode();
    const user = makeDb({
      result: baseline,
      rpcHandler: () => ({ data: null, error: { code: "42883", message: "function does not exist" } }),
    });
    const admin = makeDb({});
    connectClients(user, admin);

    const response = await completeProfile(
      completeRequest({ fullName: "Missing RPC", role: "parent", country: "BH" }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "إكمال الحساب غير مفعّل في قاعدة البيانات.",
    });
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(admin.state.inserts).toHaveLength(0);
  });

  it("rejects an RPC result that does not match the authorized selection", async () => {
    enableRpcMode();
    const user = makeDb({
      result: baseline,
      rpcHandler: () => ({ data: "student", error: null }),
    });
    const admin = makeDb({});
    connectClients(user, admin);

    const response = await completeProfile(
      completeRequest({ fullName: "Mismatch", role: "parent", country: "BH" }),
    );

    expect(response.status).toBe(503);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(admin.state.inserts).toHaveLength(0);
  });

  it("refuses to activate without an existing trigger-created profile", async () => {
    enableRpcMode();
    const user = makeDb({ result: { data: null, error: null } });
    const admin = makeDb({});
    connectClients(user, admin);

    const response = await completeProfile(
      completeRequest({ fullName: "No Profile", role: "parent", country: "BH" }),
    );

    expect(response.status).toBe(503);
    expect(user.state.rpcs).toHaveLength(0);
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});

describe("OAuth role escalation", () => {
  it("creates only a student profile from a forged privileged OAuth intent", async () => {
    const user = sessionDb({ data: null, error: null });
    const admin = makeDb({
      result: { data: { id: "u1", role: "student" }, error: null },
    });
    connectClients(user, admin);
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: intentCookie("school") })),
      delete: vi.fn(),
    } as never);

    const response = await authCallback(callbackRequest());

    expect(response.headers.get("location")).toBe("http://localhost/student");
    expect(admin.state.inserts).toEqual([{
      id: "u1",
      email: "user@example.test",
      full_name: "Google User",
      role: "student",
      country: "BH",
    }]);
    expect(admin.state.upserts).toBe(0);
  });

  it("uses the stored role, not the OAuth intent", async () => {
    const user = sessionDb({
      data: { role: "teacher", country: "BH", full_name: "Stored Teacher" },
      error: null,
    });
    const admin = makeDb({});
    connectClients(user, admin);
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: intentCookie("student") })),
      delete: vi.fn(),
    } as never);

    const response = await authCallback(callbackRequest());

    expect(response.headers.get("location")).toBe("http://localhost/teacher");
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("fails closed on a profile lookup error", async () => {
    const user = sessionDb({ data: null, error: new Error("RLS_DENIED") });
    const admin = makeDb({});
    connectClients(user, admin);
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => undefined),
      delete: vi.fn(),
    } as never);

    const response = await authCallback(callbackRequest());

    expect(response.headers.get("location")).toBe("http://localhost/onboarding?error=profile_lookup");
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("refuses to store a privileged role in the OAuth intent cookie", async () => {
    const response = await oauthIntent(
      new Request("http://localhost/api/auth/oauth-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: "Synthetic User", role: "admin", country: "BH" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

describe("activated OAuth onboarding", () => {
  const ONBOARDING_RPC = "task03d_complete_self_signup";

  it("uses the RPC for a legitimate parent OAuth intent on a baseline profile", async () => {
    enableRpcMode();
    const user = makeDb({
      result: { data: { role: "student", country: null, full_name: "" }, error: null },
      rpcHandler: (name, payload) => {
        expect(name).toBe(ONBOARDING_RPC);
        expect(payload.p_role).toBe("parent");
        return { data: "parent", error: null };
      },
    });
    const admin = makeDb({});
    connectClients(user, admin);
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: intentCookie("parent") })),
      delete: vi.fn(),
    } as never);

    const response = await authCallback(callbackRequest());

    expect(response.headers.get("location")).toBe("http://localhost/parent");
    expect(user.state.rpcs).toHaveLength(1);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("downgrades a privileged OAuth intent without invoking the onboarding RPC", async () => {
    enableRpcMode();
    const user = makeDb({ result: { data: null, error: null } });
    const admin = makeDb({
      result: { data: { id: "u1", role: "student" }, error: null },
    });
    connectClients(user, admin);
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: intentCookie("school") })),
      delete: vi.fn(),
    } as never);

    const response = await authCallback(callbackRequest());

    expect(response.headers.get("location")).toBe("http://localhost/student");
    expect(user.state.rpcs).toHaveLength(0);
    expect(admin.state.inserts).toEqual([{
      id: "u1",
      email: "user@example.test",
      full_name: "Google User",
      role: "student",
      country: "BH",
    }]);
  });

  it("fails closed when the OAuth onboarding RPC fails", async () => {
    enableRpcMode();
    const user = makeDb({
      result: { data: { role: "student", country: null, full_name: "" }, error: null },
      rpcHandler: () => ({ data: null, error: { code: "42501", message: "denied" } }),
    });
    const admin = makeDb({});
    connectClients(user, admin);
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: intentCookie("child") })),
      delete: vi.fn(),
    } as never);

    const response = await authCallback(callbackRequest());

    expect(response.headers.get("location")).toBe(
      "http://localhost/onboarding?error=profile_onboarding",
    );
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(admin.state.inserts).toHaveLength(0);
  });

  it("does not invoke the RPC for a lingering intent on a complete student", async () => {
    enableRpcMode();
    const user = makeDb({
      result: {
        data: { role: "student", country: "BH", full_name: "Existing Student" },
        error: null,
      },
    });
    const admin = makeDb({});
    connectClients(user, admin);
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: intentCookie("parent") })),
      delete: vi.fn(),
    } as never);

    const response = await authCallback(callbackRequest());

    expect(response.headers.get("location")).toBe("http://localhost/student");
    expect(user.state.rpcs).toHaveLength(0);
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});

describe("client role submission guards", () => {
  const root = path.resolve(import.meta.dirname, "../..");

  it("email signup does not publish a role in metadata or write profiles from the browser", () => {
    const source = readFileSync(
      path.join(root, "components/auth/EmailPasswordAuthForm.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/\.upsert\(|\.update\(/);
    const signupCall = source.slice(
      source.indexOf("supabase.auth.signUp"),
      source.indexOf("if (signUpError)"),
    );
    expect(signupCall).not.toMatch(/\brole\b/);
  });

  it("onboarding UI offers only self-signup roles", () => {
    const source = readFileSync(
      path.join(root, "components/auth/ProfileOnboardingForm.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/value:\s*"(teacher|school|admin)"/);
    expect(source).toMatch(/SELF_SIGNUP_ROLES/);
  });

  it("only shows onboarding to an incomplete baseline when RPC mode is on", () => {
    const source = readFileSync(
      path.join(root, "app/onboarding/page.tsx"),
      "utf8",
    );
    expect(source).toMatch(/select\("role,full_name,country"\)/);
    expect(source).toMatch(/const incompleteBaseline =/);
    expect(source).toMatch(/isOnboardingRpcEnabled\(\) && incompleteBaseline/);
  });
});

describe("onboarding activation contract guards", () => {
  const root = path.resolve(import.meta.dirname, "../..");

  it("keeps the database RPC activation opt-in and server-only", () => {
    const source = readFileSync(
      path.join(root, "lib/auth/onboarding-activation.ts"),
      "utf8",
    );
    expect(source).toMatch(/import "server-only"/);
    expect(source).toMatch(/TASK03D_ONBOARDING_RPC_MODE === "on"/);
    expect(source).toMatch(/Default 'off'/);
  });

  it("keeps the activated completion path free of direct profile writes and upserts", () => {
    const source = readFileSync(
      path.join(root, "app/api/auth/complete-profile/route.ts"),
      "utf8",
    );
    expect(source).toMatch(/if \(rpcEnabled\)/);
    expect(source).toMatch(/PROFILE_ONBOARDING_RPC_ERROR/);
    expect(source.match(/const admin = createAdminClient\(\)/g)).toHaveLength(1);
    expect(source).not.toMatch(/\.upsert\(/);
  });

  it("never creates family relationships from onboarding routes or SQL", () => {
    const sources = [
      "app/api/auth/complete-profile/route.ts",
      "app/auth/callback/route.ts",
      "docs/security/TASK_03D_REVIEW_ONLY_ISSUE117_DB_PROTECTION.sql",
    ].map((file) => readFileSync(path.join(root, file), "utf8"));
    for (const source of sources) {
      expect(source).not.toMatch(/link_child_by_code|create_parent_link_code|parent_student|student_parent/i);
    }
    expect(sources[2]).toMatch(/DELETE FROM public.profile_onboarding_pending/);
  });

  it("requires independent operator approval for legacy incomplete profiles", () => {
    const sql = readFileSync(
      path.join(root, "docs/security/TASK_03D_REVIEW_ONLY_ISSUE117_DB_PROTECTION.sql"),
      "utf8",
    );
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public.task03d_issue_legacy_onboarding_token/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public.task03d_issue_legacy_onboarding_token[\s\S]{0,120}TO service_role/);
    expect(sql).toMatch(/v_requested_role NOT IN \('student','child','parent'\)/);
    expect(sql).toMatch(/TASK03D_REVIEWER_NOT_INDEPENDENTLY_AUTHORIZED/);
  });

  it("keeps the guarded RPC context narrow and rollback free of broken references", () => {
    const sql = readFileSync(
      path.join(root, "docs/security/TASK_03D_REVIEW_ONLY_ISSUE117_DB_PROTECTION.sql"),
      "utf8",
    );
    const rollback = readFileSync(
      path.join(root, "docs/security/TASK_03D_REVIEW_ONLY_ROLLBACK.sql"),
      "utf8",
    );
    expect(sql).toMatch(/v_onboarding_sub IS DISTINCT FROM OLD\.id::text/);
    expect(sql).toMatch(/set_config\('task03d\.onboarding_update', v_user_id::text, true\)/);
    expect(sql).toMatch(/CREATE POLICY task03d_own_role_request_read[\s\S]{0,180}FOR SELECT TO authenticated/);
    expect(rollback).toMatch(/DROP FUNCTION IF EXISTS public\.task03d_complete_self_signup/);
    expect(rollback).toMatch(/VALUES \(NEW\.id, NEW\.email, 'student', NULL, NULL\)/);
  });
});
