import { createHmac, randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(), retrieveTapCharge: vi.fn(), finalizePaymentOrder: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/payments/orders", () => ({ finalizePaymentOrder: mocks.finalizePaymentOrder }));
vi.mock("@/lib/payments/tap", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/payments/tap")>(),
  retrieveTapCharge: mocks.retrieveTapCharge,
}));
import { POST } from "@/app/api/payments/tap/webhook/route";

const secret = randomBytes(32).toString("hex");
const event = {
  id: "chg_local_1", amount: 10, currency: "USD", status: "CAPTURED",
  reference: { gateway: "gateway-local", payment: "payment-local" },
  transaction: { created: "1789380000000" },
  source: { payment_method: "VISA" },
};

// Explicit decimal text is independent of the verifier's currency formatter.
function signature(payload = event, amount = "10.00") {
  const input = `x_id${payload.id}x_amount${amount}x_currency${payload.currency}` +
    `x_gateway_reference${payload.reference.gateway}x_payment_reference${payload.reference.payment}` +
    `x_status${payload.status}x_created${payload.transaction.created}`;
  return createHmac("sha256", secret).update(input).digest("hex");
}

function request(raw: string, hash?: string) {
  return new Request("http://localhost/api/payments/tap/webhook", {
    method: "POST", body: raw, headers: hash === undefined ? {} : { hashstring: hash },
  });
}

function expectUnprocessed() {
  expect(mocks.retrieveTapCharge).not.toHaveBeenCalled();
  expect(mocks.createAdminClient).not.toHaveBeenCalled();
  expect(mocks.finalizePaymentOrder).not.toHaveBeenCalled();
}

function database() {
  const payment = { id: "order-local", amount: 10, currency: "USD", status: "pending", payment_method: "visa" };
  const update = vi.fn(() => query);
  let updateError: unknown = null;
  const query = {
    select: vi.fn(() => query), eq: vi.fn(() => query), update,
    maybeSingle: vi.fn(async () => ({ data: payment, error: null })),
    then: (resolve: (result: { error: unknown }) => unknown) => Promise.resolve({ error: updateError }).then(resolve),
  };
  const from = vi.fn(() => query);
  mocks.createAdminClient.mockReturnValue({ from });
  mocks.finalizePaymentOrder.mockImplementation(async () => { payment.status = "completed"; });
  return { payment, update, from, query, failUpdate: () => { updateError = { code: "LOCAL_DB_FAILURE" }; } };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("TAP_SECRET_KEY", secret);
  mocks.retrieveTapCharge.mockResolvedValue(structuredClone(event));
});

describe("Tap webhook security", () => {
  it.each([
    ["missing", undefined], ["invalid digest", "0".repeat(64)],
    ["nonhex", "z".repeat(64)], ["short", "abc"], ["multibyte", "é".repeat(64)],
  ])("rejects %s signatures before provider access or payment processing", async (_label, hash) => {
    expect((await POST(request(JSON.stringify(event), hash))).status).toBe(401);
    expectUnprocessed();
  });

  it.each(["{", "null", "[]", "42", "{}", JSON.stringify({ id: "chg_local_1" }),
    JSON.stringify({ ...event, amount: "10" }), JSON.stringify({ ...event, reference: [] }),
    JSON.stringify({ ...event, transaction: {} }), JSON.stringify({ ...event, id: {} })])(
    "rejects a malformed payload without any processing: %s", async (raw) => {
      expect((await POST(request(raw, signature()))).status).toBe(400);
      expectUnprocessed();
    },
  );

  it("rejects missing signature before parsing the payload", async () => {
    expect((await POST(request("{"))).status).toBe(401);
    expectUnprocessed();
  });

  it.each([
    { ...event, amount: 11 }, { ...event, id: "chg_other" },
    { ...event, status: "FAILED" }, { ...event, currency: "BHD" },
    { ...event, reference: { ...event.reference, payment: "other-payment" } },
    { ...event, transaction: { created: "1789380000001" } },
  ])("rejects tampering with signed payment fields", async (payload) => {
    expect((await POST(request(JSON.stringify(payload), signature()))).status).toBe(401);
    expectUnprocessed();
  });

  it("fails closed when the secret is missing", async () => {
    vi.stubEnv("TAP_SECRET_KEY", "");
    expect((await POST(request(JSON.stringify(event), signature()))).status).toBe(503);
    expectUnprocessed();
  });

  it.each([["USD", "10.00"], ["BHD", "10.000"], ["KWD", "10.000"], ["JOD", "10.000"], ["OMR", "10.000"]])(
    "accepts the documented decimal format for %s and completes a verified payment", async (currency, amount) => {
      const db = database();
      db.payment.currency = currency;
      const payload = { ...event, currency };
      mocks.retrieveTapCharge.mockResolvedValue(payload);
      const result = await POST(request(JSON.stringify(payload), signature(payload, amount)));
      expect(result.status).toBe(200);
      expect(mocks.retrieveTapCharge).toHaveBeenCalledWith("chg_local_1");
      expect(db.update).toHaveBeenCalledWith({ payment_method: "visa" });
      expect(mocks.finalizePaymentOrder).toHaveBeenCalledExactlyOnceWith("order-local");
    },
  );

  it("does not finalize a completed payment again on sequential replay", async () => {
    const db = database();
    for (let count = 0; count < 2; count++) {
      expect((await POST(request(JSON.stringify(event), signature()))).status).toBe(200);
    }
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(mocks.finalizePaymentOrder).toHaveBeenCalledTimes(1);
  });

  it("uses the retrieved charge status as payment proof", async () => {
    const db = database();
    mocks.retrieveTapCharge.mockResolvedValue({ ...event, status: "INITIATED" });
    expect((await POST(request(JSON.stringify(event), signature()))).status).toBe(200);
    expect(db.update).not.toHaveBeenCalled();
    expect(mocks.finalizePaymentOrder).not.toHaveBeenCalled();
  });

  it.each([{ amount: 12 }, { currency: "BHD" }, { id: "chg_other" }])(
    "rejects mismatched retrieved charge details", async (change) => {
      const db = database();
      mocks.retrieveTapCharge.mockResolvedValue({ ...event, ...change });
      expect((await POST(request(JSON.stringify(event), signature()))).status).toBe(409);
      expect(db.update).not.toHaveBeenCalled();
      expect(mocks.finalizePaymentOrder).not.toHaveBeenCalled();
    },
  );

  it("preserves rejection of unsupported card brands", async () => {
    const db = database();
    db.payment.payment_method = "amex";
    mocks.retrieveTapCharge.mockResolvedValue({ ...event, source: { payment_method: "AMEX" } });
    expect((await POST(request(JSON.stringify(event), signature()))).status).toBe(409);
    expect(db.update).not.toHaveBeenCalled();
    expect(mocks.finalizePaymentOrder).not.toHaveBeenCalled();
  });

  it("does not finalize after a payment update error", async () => {
    const db = database();
    db.failUpdate();
    expect((await POST(request(JSON.stringify(event), signature()))).status).toBe(500);
    expect(mocks.finalizePaymentOrder).not.toHaveBeenCalled();
  });

  it("keeps provider exceptions out of the response", async () => {
    mocks.retrieveTapCharge.mockRejectedValue(new Error("local-private-diagnostic"));
    const result = await POST(request(JSON.stringify(event), signature()));
    expect(result.status).toBe(500);
    expect(await result.json()).toEqual({ error: "TAP_WEBHOOK_FAILED" });
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });
});