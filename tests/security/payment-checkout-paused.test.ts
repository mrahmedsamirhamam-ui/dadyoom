import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  offerFor: vi.fn(),
  createPaymentRecord: vi.fn(),
  verifiedTapCardMethod: vi.fn(),
  createTapCharge: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: dependencies.createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: dependencies.createAdminClient }));
vi.mock("@/lib/payments/orders", () => ({
  offerFor: dependencies.offerFor,
  createPaymentRecord: dependencies.createPaymentRecord,
}));
vi.mock("@/lib/payments/tap", () => ({
  verifiedTapCardMethod: dependencies.verifiedTapCardMethod,
  createTapCharge: dependencies.createTapCharge,
}));

import { isCheckoutApproved } from "@/lib/payments/readiness";
import { POST as paddleConfig } from "@/app/api/payments/paddle/config/route";
import { POST as tapConfig } from "@/app/api/payments/tap/config/route";
import { POST as tapCreate } from "@/app/api/payments/tap/create/route";

const malformed = () => new Request("http://localhost/api/payments/tap", {
  method: "POST", body: "{invalid-json",
  headers: { "Content-Type": "application/json" },
});

const valid = () => new Request("http://localhost/api/payments/tap", {
  method: "POST",
  body: JSON.stringify({ kind: "course", courseId: "public-local", tokenId: "tok_local" }),
  headers: { "Content-Type": "application/json" },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DADYOOM_LIVE_BILLING_ENABLED", "false");
  vi.stubEnv("DADYOOM_PAYMENT_ACTIVATION_APPROVED", "false");
});
afterEach(() => vi.unstubAllEnvs());

describe("Dadyoom owner-approved checkout safety gate", () => {
  it("fails closed if either switch is unset or false", () => {
    expect(isCheckoutApproved()).toBe(false);
    vi.stubEnv("DADYOOM_LIVE_BILLING_ENABLED", "true");
    expect(isCheckoutApproved()).toBe(false);
    vi.stubEnv("DADYOOM_PAYMENT_ACTIVATION_APPROVED", "TRUE");
    expect(isCheckoutApproved()).toBe(false);
    vi.stubEnv("DADYOOM_PAYMENT_ACTIVATION_APPROVED", "true");
    expect(isCheckoutApproved()).toBe(true);
    vi.stubEnv("DADYOOM_LIVE_BILLING_ENABLED", "false");
    expect(isCheckoutApproved()).toBe(false);
  });

  it.each([
    ["Paddle config", () => paddleConfig()],
    ["Tap config", () => tapConfig(malformed())],
    ["Tap charge creation", () => tapCreate(malformed())],
  ])("returns 503 PAYMENTS_PAUSED from %s without authenticating or processing", async (_, request) => {
    const response = await request();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "PAYMENTS_PAUSED" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(dependencies.createClient).not.toHaveBeenCalled();
    expect(dependencies.createAdminClient).not.toHaveBeenCalled();
    expect(dependencies.offerFor).not.toHaveBeenCalled();
    expect(dependencies.createPaymentRecord).not.toHaveBeenCalled();
    expect(dependencies.verifiedTapCardMethod).not.toHaveBeenCalled();
    expect(dependencies.createTapCharge).not.toHaveBeenCalled();
  });

  it("pauses all endpoints if only the legacy marketing flag is enabled", async () => {
    vi.stubEnv("DADYOOM_LIVE_BILLING_ENABLED", "true");
    for (const post of [() => paddleConfig(), () => tapConfig(malformed()), () => tapCreate(malformed())]) {
      expect((await post()).status).toBe(503);
    }
    expect(dependencies.createClient).not.toHaveBeenCalled();
  });

  it("does not leak Tap gateway diagnostics if an approved charge attempt fails", async () => {
    vi.stubEnv("DADYOOM_LIVE_BILLING_ENABLED", "true");
    vi.stubEnv("DADYOOM_PAYMENT_ACTIVATION_APPROVED", "true");
    dependencies.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "buyer-test" } } })) },
    });
    dependencies.verifiedTapCardMethod.mockRejectedValue(new Error("PRIVATE_GATEWAY_DIAGNOSTIC"));
    const result = await tapCreate(valid());
    expect(result.status).toBe(500);
    const body = await result.json();
    expect(body).toEqual({ error: "PAYMENT_CREATION_FAILED" });
    expect(JSON.stringify(body)).not.toContain("PRIVATE_GATEWAY_DIAGNOSTIC");
    expect(dependencies.createPaymentRecord).not.toHaveBeenCalled();
    expect(dependencies.createTapCharge).not.toHaveBeenCalled();
  });

  it("does not leak offer or database diagnostics from Tap configuration", async () => {
    vi.stubEnv("DADYOOM_LIVE_BILLING_ENABLED", "true");
    vi.stubEnv("DADYOOM_PAYMENT_ACTIVATION_APPROVED", "true");
    dependencies.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "buyer-test" } } })) },
    });
    dependencies.offerFor.mockRejectedValue(new Error("PRIVATE_DATABASE_DIAGNOSTIC"));
    const result = await tapConfig(valid());
    expect(result.status).toBe(500);
    expect(await result.json()).toEqual({ error: "PAYMENT_CONFIGURATION_FAILED" });
  });
});
