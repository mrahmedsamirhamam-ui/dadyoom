import { NextResponse } from "next/server";

import { finalizePaymentOrder } from "@/lib/payments/orders";
import {
  normalizeTapPaymentMethod,
  retrieveTapCharge,
} from "@/lib/payments/tap";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseTapWebhookCharge, verifyTapWebhookSignature } from "@/lib/payments/tap-webhook";

export async function POST(request: Request) {
  try {
    const secret = process.env.TAP_SECRET_KEY?.trim() ?? "";
    if (!secret) {
      return NextResponse.json({ error: "TAP_WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
    }
    const signature = request.headers.get("hashstring") ?? "";
    if (!signature) {
      return NextResponse.json({ error: "INVALID_TAP_SIGNATURE" }, { status: 401 });
    }
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "INVALID_TAP_EVENT" }, { status: 400 });
    }
    const webhook = parseTapWebhookCharge(raw);
    if (!webhook) {
      return NextResponse.json({ error: "INVALID_TAP_EVENT" }, { status: 400 });
    }
    if (!verifyTapWebhookSignature(webhook, signature, secret)) {
      return NextResponse.json({ error: "INVALID_TAP_SIGNATURE" }, { status: 401 });
    }

    // Only a verified webhook may trigger retrieval; retain provider-side payment proof.
    const charge = await retrieveTapCharge(webhook.id);
    if (charge.id !== webhook.id) {
      return NextResponse.json({ error: "TAP_CHARGE_MISMATCH" }, { status: 409 });
    }
    const db = createAdminClient();

    const { data: payment, error } = await db
      .from("edu_payment_orders")
      .select(
        "id,amount,currency,status,payment_method",
      )
      .eq("provider", "tap")
      .eq("provider_order_id", charge.id)
      .maybeSingle();

    if (error || !payment) {
      return NextResponse.json({ ok: true });
    }

    const amountOk =
      Math.abs(
        Number(payment.amount) - Number(charge.amount),
      ) < 0.0005;

    const currencyOk =
      String(payment.currency).toUpperCase() ===
      String(charge.currency).toUpperCase();

    if (!amountOk || !currencyOk) {
      return NextResponse.json(
        {
          error: "PAYMENT_AMOUNT_OR_CURRENCY_MISMATCH",
        },
        { status: 409 },
      );
    }

    const method =
      normalizeTapPaymentMethod(
        charge.source?.payment_method,
      ) ??
      normalizeTapPaymentMethod(
        payment.payment_method,
      );

    if (!method) {
      return NextResponse.json(
        { error: "CARD_BRAND_NOT_ALLOWED" },
        { status: 409 },
      );
    }

    if (
      charge.status === "CAPTURED" &&
      payment.status !== "completed"
    ) {
      const { error: updateError } = await db
        .from("edu_payment_orders")
        .update({
          payment_method: method,
        })
        .eq("id", payment.id);

      if (updateError) throw updateError;
      await finalizePaymentOrder(
        String(payment.id),
      );
    }

    return NextResponse.json({
      ok: true,
      status: charge.status,
    });
  } catch {
    return NextResponse.json(
      {
        error: "TAP_WEBHOOK_FAILED",
      },
      { status: 500 },
    );
  }
}
