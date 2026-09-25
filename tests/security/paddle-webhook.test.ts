import { createHmac, randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClient } = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
import { POST } from "@/app/api/payments/paddle/webhook/route";

const secret = randomBytes(32).toString("hex");
const now = new Date("2026-09-14T10:00:00.000Z");
const event = {
  event_id: "evt_local_1",
  event_type: "transaction.completed",
  data: {
    id: "txn_local_1", subscription_id: "sub_local_1", currency_code: "USD",
    custom_data: {
      dadyoom_user_id: "buyer-local",
      dadyoom_plan_id: "plus",
      dadyoom_checkout_sig: createHmac("sha256", secret)
        .update("dadyoom-paddle-checkout-v1:buyer-local:plus:pri_local_plus")
        .digest("hex"),
    },
    items: [{ price: { id: "pri_local_plus" } }],
    billing_period: { starts_at: "2026-09-14T10:00:00Z", ends_at: "2026-10-14T10:00:00Z" },
  },
};

function signature(body: string, timestamp = now.getTime() / 1000) {
  return `ts=${timestamp};h1=${createHmac("sha256", secret).update(`${timestamp}:${body}`).digest("hex")}`;
}

function request(body: string, header?: string) {
  return new Request("http://localhost/api/payments/paddle/webhook", {
    method: "POST", body, headers: header === undefined ? {} : { "paddle-signature": header },
  });
}

function database() {
  const seen = new Set<string>();
  const mutations: Array<{ table: string; operation: string; value: Record<string, unknown> }> = [];
  let lookupError: unknown = null;
  const from = vi.fn((table: string) => {
    const filters: Record<string, unknown> = {};
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn((field: string, value: unknown) => { filters[field] = value; return query; }),
      maybeSingle: vi.fn(async () => ({
        data: table === "edu_subscription_events"
          ? (seen.has(String(filters.provider_event_id)) ? { id: "seen" } : null)
          : { id: "subscription-local" },
        error: table === "edu_subscription_events" ? lookupError : null,
      })),
      single: vi.fn(async () => ({ data: { id: "subscription-local" }, error: null })),
      upsert: vi.fn((value: Record<string, unknown>) => { mutations.push({ table, operation: "upsert", value }); return query; }),
      update: vi.fn((value: Record<string, unknown>) => { mutations.push({ table, operation: "update", value }); return query; }),
      insert: vi.fn(async (value: Record<string, unknown>) => {
        mutations.push({ table, operation: "insert", value });
        seen.add(String(value.provider_event_id));
        return { error: null };
      }),
    };
    return query;
  });
  createAdminClient.mockReturnValue({ from });
  return { from, mutations, failLookup: () => { lookupError = { code: "LOCAL_DB_FAILURE" }; } };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.stubEnv("PADDLE_WEBHOOK_SECRET", secret);
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PLUS_PRICE_ID", "pri_local_plus");
});

describe("Paddle webhook security", () => {
  it.each([
    ["missing", undefined],
    ["wrong digest", `ts=${now.getTime() / 1000};h1=${"0".repeat(64)}`],
    ["nonhex", `ts=${now.getTime() / 1000};h1=${"z".repeat(64)}`],
    ["multibyte digest", `ts=${now.getTime() / 1000};h1=${"é".repeat(64)}`],
    ["invalid timestamp", `ts=invalid;h1=${"0".repeat(64)}`],
  ])("rejects %s signatures without creating a database client", async (_label, header) => {
    const db = database();
    expect((await POST(request(JSON.stringify(event), header))).status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(db.mutations).toEqual([]);
  });

  it.each([-301, 301])("rejects a signature outside the replay time window (%i seconds)", async (offset) => {
    const raw = JSON.stringify(event);
    expect((await POST(request(raw, signature(raw, now.getTime() / 1000 + offset)))).status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("binds the signature to the exact raw body", async () => {
    const raw = JSON.stringify(event);
    expect((await POST(request(raw + " ", signature(raw)))).status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it.each(["{", "null", "[]", "42", "{}", JSON.stringify({ ...event, data: [] }), JSON.stringify({ ...event, data: null })])(
    "rejects a signed malformed payload before database access: %s", async (raw) => {
      expect((await POST(request(raw, signature(raw)))).status).toBe(400);
      expect(createAdminClient).not.toHaveBeenCalled();
    },
  );

  it("verifies before even parsing malformed JSON", async () => {
    expect((await POST(request("{"))).status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("fails closed when the webhook is not configured", async () => {
    vi.stubEnv("PADDLE_WEBHOOK_SECRET", "");
    expect((await POST(request(JSON.stringify(event)))).status).toBe(503);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("accepts valid delivery and skips a sequential replay of the event", async () => {
    const db = database();
    const raw = JSON.stringify(event);
    const first = await POST(request(raw, signature(raw)));
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ ok: true, activated: true });
    expect(db.mutations).toHaveLength(2);
    expect(db.mutations[0]).toMatchObject({ table: "edu_subscriptions", value: { user_id: "buyer-local", plan_id: "plus", status: "active" } });
    const second = await POST(request(raw, signature(raw)));
    expect(await second.json()).toEqual({ ok: true, duplicate: true });
    expect(db.mutations).toHaveLength(2);
  });

  it("accepts a matching rotated signature among multiple h1 values", async () => {
    const db = database();
    const raw = JSON.stringify(event);
    expect((await POST(request(raw, `${signature(raw)};h1=${"0".repeat(64)}`))).status).toBe(200);
    expect(db.mutations).toHaveLength(2);
  });

  it("does not mutate state if the idempotency lookup fails", async () => {
    const db = database();
    db.failLookup();
    const raw = JSON.stringify(event);
    expect((await POST(request(raw, signature(raw)))).status).toBe(500);
    expect(db.mutations).toEqual([]);
  });

  it("preserves the transaction price check", async () => {
    const db = database();
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PLUS_PRICE_ID", "different-price");
    const raw = JSON.stringify(event);
    expect((await POST(request(raw, signature(raw)))).status).toBe(409);
    expect(db.mutations).toEqual([]);
  });

  it("rejects a tampered checkout user binding", async () => {
    const db = database();
    const raw = JSON.stringify({
      ...event,
      data: {
        ...event.data,
        custom_data: {
          ...event.data.custom_data,
          dadyoom_user_id: "another-user",
        },
      },
    });
    expect((await POST(request(raw, signature(raw)))).status).toBe(409);
    expect(db.mutations).toEqual([]);
  });

  it.each(["subscription.updated", "subscription.activated", "subscription.canceled"])(
    "preserves valid %s processing", async (eventType) => {
      const db = database();
      const raw = JSON.stringify({ ...event, event_type: eventType, data: {
        ...event.data, id: "sub_local_1", status: "active", current_billing_period: event.data.billing_period,
      } });
      expect((await POST(request(raw, signature(raw)))).status).toBe(200);
      expect(db.mutations).toHaveLength(2);
      expect(db.mutations[0].value.status).toBe(eventType === "subscription.canceled" ? "cancelled" : "active");
    },
  );
});