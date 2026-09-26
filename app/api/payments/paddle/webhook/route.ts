import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

type JsonObject = Record<string, unknown>;

function record(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function verifySignature(
  rawBody: string,
  header: string,
  secret: string,
) {
  const parts = header
    .split(/[;,]/u)
    .map((part) => part.trim())
    .filter(Boolean);

  const ts = parts
    .find((part) => part.startsWith("ts="))
    ?.slice(3);

  const signatures = parts
    .filter((part) => part.startsWith("h1="))
    .map((part) => part.slice(3));

  if (!ts || signatures.length === 0) {
    return false;
  }

  const timestamp = Number(ts);

  if (
    !Number.isFinite(timestamp) ||
    Math.abs(Date.now() / 1000 - timestamp) > 300
  ) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${ts}:${rawBody}`)
    .digest("hex");

  return signatures.some((candidate) => {
    if (!/^[a-f0-9]{64}$/iu.test(candidate)) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(candidate, "hex"),
      Buffer.from(expected, "hex"),
    );
  });
}

function periodFromTransaction(data: JsonObject) {
  const billing = record(data.billing_period);
  const startsAt = stringValue(billing.starts_at);
  const endsAt = stringValue(billing.ends_at);

  if (startsAt && endsAt) {
    return {
      start: startsAt,
      end: endsAt,
    };
  }

  const start = new Date();
  const end = new Date(start);
  const originalDay = end.getUTCDate();

  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + 1);

  const lastDay = new Date(
    Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();

  end.setUTCDate(Math.min(originalDay, lastDay));

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function periodFromSubscription(data: JsonObject) {
  const billing = record(data.current_billing_period);
  const startsAt = stringValue(billing.starts_at);
  const endsAt = stringValue(billing.ends_at);

  return {
    start: startsAt,
    end: endsAt,
  };
}

function scheduledCancellationFromSubscription(
  data: JsonObject,
) {
  const scheduledChange = record(data.scheduled_change);

  return (
    stringValue(scheduledChange.action) === "cancel" &&
    Boolean(stringValue(scheduledChange.effective_at))
  );
}

function customUser(data: JsonObject) {
  const custom = record(data.custom_data);

  return {
    userId: stringValue(custom.dadyoom_user_id),
    planId: stringValue(custom.dadyoom_plan_id),
  };
}

function transactionPriceId(data: JsonObject) {
  const items = Array.isArray(data.items) ? data.items : [];
  const first = record(items[0]);
  const price = record(first.price);
  return stringValue(price.id);
}

function verifyCheckoutBinding(args: {
  data: JsonObject;
  secret: string;
  priceId: string;
}) {
  const { userId, planId } = customUser(args.data);
  const custom = record(args.data.custom_data);
  const candidate = stringValue(
    custom.dadyoom_checkout_sig,
  );

  if (
    !userId ||
    planId !== "plus" ||
    !args.priceId ||
    !/^[a-f0-9]{64}$/iu.test(candidate)
  ) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", args.secret)
    .update(
      `dadyoom-paddle-checkout-v1:${userId}:${planId}:${args.priceId}`,
    )
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(candidate, "hex"),
    Buffer.from(expected, "hex"),
  );
}

async function alreadyHandled(
  db: ReturnType<typeof createAdminClient>,
  eventId: string,
) {
  const { data, error } = await db
    .from("edu_subscription_events")
    .select("id")
    .eq("provider", "paddle")
    .eq("provider_event_id", eventId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function saveEvent(args: {
  db: ReturnType<typeof createAdminClient>;
  eventId: string;
  userId: string;
  subscriptionId?: string | null;
  action:
    | "payment_activated"
    | "payment_cancelled";
  metadata: JsonObject;
}) {
  const { error } = await args.db
    .from("edu_subscription_events")
    .insert({
      subscription_id: args.subscriptionId ?? null,
      user_id: args.userId,
      action: args.action,
      months: null,
      note: null,
      provider: "paddle",
      provider_event_id: args.eventId,
      performed_by: null,
      metadata: args.metadata,
    });

  if (error && error.code !== "23505") {
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const secret =
      process.env.PADDLE_WEBHOOK_SECRET?.trim() ?? "";

    if (!secret) {
      return NextResponse.json(
        { error: "PADDLE_WEBHOOK_NOT_CONFIGURED" },
        { status: 503 },
      );
    }

    const rawBody = await request.text();
    const signature =
      request.headers.get("paddle-signature") ?? "";

    if (!verifySignature(rawBody, signature, secret)) {
      return NextResponse.json(
        { error: "INVALID_PADDLE_SIGNATURE" },
        { status: 401 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "INVALID_EVENT" },
        { status: 400 },
      );
    }
    const event = record(parsed);
    const eventId = stringValue(event.event_id);
    const eventType = stringValue(event.event_type);
    const data = record(event.data);

    if (
      !eventId.trim() || !eventType.trim() ||
      !event.data || typeof event.data !== "object" || Array.isArray(event.data)
    ) {
      return NextResponse.json(
        { error: "INVALID_EVENT" },
        { status: 400 },
      );
    }

    const db = createAdminClient();

    if (await alreadyHandled(db, eventId)) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
      });
    }

    if (eventType === "transaction.completed") {
      const { userId, planId } = customUser(data);

      if (!userId || planId !== "plus") {
        return NextResponse.json({
          ok: true,
          ignored: true,
        });
      }

      const expectedPrice =
        process.env.PADDLE_PLUS_PRICE_ID?.trim() ||
        process.env.NEXT_PUBLIC_PADDLE_PLUS_PRICE_ID?.trim() ||
        "";

      const receivedPrice = transactionPriceId(data);

      if (
        !expectedPrice ||
        receivedPrice !== expectedPrice
      ) {
        return NextResponse.json(
          { error: "PADDLE_PRICE_MISMATCH" },
          { status: 409 },
        );
      }

      if (
        !verifyCheckoutBinding({
          data,
          secret,
          priceId: expectedPrice,
        })
      ) {
        return NextResponse.json(
          { error: "PADDLE_USER_BINDING_INVALID" },
          { status: 409 },
        );
      }

      const period = periodFromTransaction(data);
      const providerSubscriptionId =
        stringValue(data.subscription_id) || null;

      const { data: subscription, error } = await db
        .from("edu_subscriptions")
        .upsert(
          {
            user_id: userId,
            plan_id: "plus",
            status: "active",
            provider: "paddle",
            provider_subscription_id:
              providerSubscriptionId,
            current_period_start: period.start,
            current_period_end: period.end,
            cancel_at_period_end: false,
            grant_source: "paddle_payment",
            admin_note: null,
            granted_by: null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          },
        )
        .select("id")
        .single();

      if (error || !subscription) {
        throw error ?? new Error("SUBSCRIPTION_UPSERT_FAILED");
      }

      await saveEvent({
        db,
        eventId,
        userId,
        subscriptionId: String(subscription.id),
        action: "payment_activated",
        metadata: {
          event_type: eventType,
          transaction_id: stringValue(data.id),
          paddle_subscription_id:
            providerSubscriptionId,
          price_id: receivedPrice,
          currency_code:
            stringValue(data.currency_code),
        },
      });

      return NextResponse.json({
        ok: true,
        activated: true,
      });
    }

    if (
      eventType === "subscription.updated" ||
      eventType === "subscription.activated"
    ) {
      const { userId, planId } = customUser(data);

      if (!userId || planId !== "plus") {
        return NextResponse.json({
          ok: true,
          ignored: true,
        });
      }

      const expectedPrice =
        process.env.PADDLE_PLUS_PRICE_ID?.trim() ||
        process.env.NEXT_PUBLIC_PADDLE_PLUS_PRICE_ID?.trim() ||
        "";

      if (
        !verifyCheckoutBinding({
          data,
          secret,
          priceId: expectedPrice,
        })
      ) {
        return NextResponse.json(
          { error: "PADDLE_USER_BINDING_INVALID" },
          { status: 409 },
        );
      }

      const status = stringValue(data.status);
      const period = periodFromSubscription(data);
      const cancelAtPeriodEnd =
        scheduledCancellationFromSubscription(data);

      const mappedStatus =
        status === "past_due"
          ? "past_due"
          : status === "canceled"
            ? "cancelled"
            : "active";

      const { data: subscription, error } = await db
        .from("edu_subscriptions")
        .upsert(
          {
            user_id: userId,
            plan_id: "plus",
            status: mappedStatus,
            provider: "paddle",
            provider_subscription_id:
              stringValue(data.id) || null,
            current_period_start:
              period.start || new Date().toISOString(),
            current_period_end:
              period.end || null,
            cancel_at_period_end:
              mappedStatus === "cancelled" ||
              cancelAtPeriodEnd,
            grant_source: "paddle_payment",
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          },
        )
        .select("id")
        .single();

      if (error || !subscription) {
        throw error ?? new Error("SUBSCRIPTION_SYNC_FAILED");
      }

      await saveEvent({
        db,
        eventId,
        userId,
        subscriptionId: String(subscription.id),
        action:
          mappedStatus === "cancelled"
            ? "payment_cancelled"
            : "payment_activated",
        metadata: {
          event_type: eventType,
          paddle_subscription_id:
            stringValue(data.id),
          paddle_status: status,
          scheduled_cancel: cancelAtPeriodEnd,
          scheduled_cancel_at: cancelAtPeriodEnd
            ? stringValue(
                record(data.scheduled_change).effective_at,
              )
            : null,
        },
      });

      return NextResponse.json({
        ok: true,
        synced: true,
      });
    }

    if (eventType === "subscription.canceled") {
      const { userId, planId } = customUser(data);

      if (!userId || planId !== "plus") {
        return NextResponse.json({
          ok: true,
          ignored: true,
        });
      }

      const expectedPrice =
        process.env.PADDLE_PLUS_PRICE_ID?.trim() ||
        process.env.NEXT_PUBLIC_PADDLE_PLUS_PRICE_ID?.trim() ||
        "";

      if (
        !verifyCheckoutBinding({
          data,
          secret,
          priceId: expectedPrice,
        })
      ) {
        return NextResponse.json(
          { error: "PADDLE_USER_BINDING_INVALID" },
          { status: 409 },
        );
      }

      const { data: subscription, error } = await db
        .from("edu_subscriptions")
        .update({
          status: "cancelled",
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();

      if (error) {
        throw error;
      }

      await saveEvent({
        db,
        eventId,
        userId,
        subscriptionId:
          subscription?.id
            ? String(subscription.id)
            : null,
        action: "payment_cancelled",
        metadata: {
          event_type: eventType,
          paddle_subscription_id:
            stringValue(data.id),
        },
      });

      return NextResponse.json({
        ok: true,
        cancelled: true,
      });
    }

    return NextResponse.json({
      ok: true,
      ignored: true,
      eventType,
    });
  } catch {
    return NextResponse.json(
      {
        error: "PADDLE_WEBHOOK_FAILED",
      },
      { status: 500 },
    );
  }
}
