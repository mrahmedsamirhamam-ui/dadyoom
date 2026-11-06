import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClient,
  createTapCharge,
  createPaymentRecord,
} = vi.hoisted(() => ({
  createClient: vi.fn(),
  createTapCharge: vi.fn(),
  createPaymentRecord: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/payments/tap", () => ({
  createTapCharge,
  verifiedTapCardMethod: vi.fn(),
}));
vi.mock("@/lib/payments/orders", () => ({
  createPaymentRecord,
  offerFor: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { liveCheckoutApproved } from "@/lib/payments/checkout-gate";
import { POST as paddleConfig } from "@/app/api/payments/paddle/config/route";
import { POST as tapConfig } from "@/app/api/payments/tap/config/route";
import { POST as tapCreate } from "@/app/api/payments/tap/create/route";

const request = (route: string) =>
  new Request(`http://localhost:3000/api/payments/${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });

const endpoints: Array<readonly [string, (request: Request) => Promise<Response>]> = [
  ["paddle/config", () => paddleConfig()],
  ["tap/config", (request) => tapConfig(request)],
  ["tap/create", (request) => tapCreate(request)],
];

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of [
    "DADYOOM_LIVE_BILLING_ENABLED",
    "DADYOOM_PAYMENT_OWNER_APPROVED",
    "DADYOOM_PADDLE_LIVE_ENABLED",
    "DADYOOM_TAP_LIVE_ENABLED",
    "NEXT_PUBLIC_PADDLE_ENV",
  ]) {
    vi.stubEnv(key, "");
  }
  createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null } })),
    },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("zero-charge payment initiation gate", () => {
  it("defaults to paused for both Paddle and Tap", () => {
    expect(liveCheckoutApproved("paddle")).toBe(false);
    expect(liveCheckoutApproved("tap")).toBe(false);
  });

  it("requires separate global, owner, and provider activation flags", () => {
    vi.stubEnv("DADYOOM_LIVE_BILLING_ENABLED", "true");
    expect(liveCheckoutApproved("paddle")).toBe(false);
    vi.stubEnv("DADYOOM_PAYMENT_OWNER_APPROVED", "true");
    expect(liveCheckoutApproved("paddle")).toBe(false);
    vi.stubEnv("DADYOOM_PADDLE_LIVE_ENABLED", "true");
    expect(liveCheckoutApproved("paddle")).toBe(false); // Sandbox cannot accept live subscriptions.
    vi.stubEnv("NEXT_PUBLIC_PADDLE_ENV", "production");
    expect(liveCheckoutApproved("paddle")).toBe(true);
    expect(liveCheckoutApproved("tap")).toBe(false);
    vi.stubEnv("DADYOOM_TAP_LIVE_ENABLED", "true");
    expect(liveCheckoutApproved("tap")).toBe(true);
  });

  it.each(endpoints)("keeps %s paused with no authorization flags, before any provider action", async (name, handler) => {
    const response = await handler(request(name));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "PAYMENTS_PAUSED" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(createClient).not.toHaveBeenCalled();
    expect(createTapCharge).not.toHaveBeenCalled();
    expect(createPaymentRecord).not.toHaveBeenCalled();
  });

  it.each(endpoints)("remains paused on %s if only the visible pricing flag is set", async (name, handler) => {
    vi.stubEnv("DADYOOM_LIVE_BILLING_ENABLED", "true");
    const response = await handler(request(name));
    expect(response.status).toBe(503);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("does not allow a Paddle sandbox token in live-approved checkout", () => {
    vi.stubEnv("DADYOOM_LIVE_BILLING_ENABLED", "true");
    vi.stubEnv("DADYOOM_PAYMENT_OWNER_APPROVED", "true");
    vi.stubEnv("DADYOOM_PADDLE_LIVE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_ENV", "sandbox");
    expect(liveCheckoutApproved("paddle")).toBe(false);
  });

  it("still requires authentication when explicitly approved, with no charges", async () => {
    vi.stubEnv("DADYOOM_LIVE_BILLING_ENABLED", "true");
    vi.stubEnv("DADYOOM_PAYMENT_OWNER_APPROVED", "true");
    vi.stubEnv("DADYOOM_PADDLE_LIVE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_ENV", "production");
    vi.stubEnv("DADYOOM_TAP_LIVE_ENABLED", "true");
    for (const [name, handler] of endpoints) {
      const response = await handler(request(name));
      expect(response.status).toBe(401);
    }
    expect(createTapCharge).not.toHaveBeenCalled();
    expect(createPaymentRecord).not.toHaveBeenCalled();
  });
});
