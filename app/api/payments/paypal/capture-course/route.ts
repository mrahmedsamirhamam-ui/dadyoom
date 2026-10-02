import { NextResponse } from "next/server";

import { finalizePaymentOrder } from "@/lib/payments/orders";
import { capturePayPalOrder } from "@/lib/payments/paypal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (process.env.PAYPAL_ENV?.trim().toLowerCase() === "live") {
      return NextResponse.json(
        { error: "PAYPAL_LIVE_DISABLED" },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const body = (await request.json()) as {
      orderId?: string;
      paymentOrderId?: string;
    };

    const orderId = String(body.orderId ?? "").trim();
    const paymentOrderId = String(body.paymentOrderId ?? "").trim();

    if (!orderId || !paymentOrderId) {
      return NextResponse.json(
        { error: "PAYPAL_ORDER_REQUIRED" },
        { status: 400 },
      );
    }

    const db = createAdminClient();

    const { data: payment, error } = await db
      .from("edu_payment_orders")
      .select("id,buyer_id,kind,provider,provider_order_id,amount,currency,status")
      .eq("id", paymentOrderId)
      .eq("buyer_id", user.id)
      .eq("kind", "course")
      .eq("provider", "paypal")
      .maybeSingle();

    if (error || !payment) {
      return NextResponse.json(
        { error: "PAYMENT_ORDER_NOT_FOUND" },
        { status: 404 },
      );
    }

    if (payment.status === "completed") {
      return NextResponse.json({ ok: true, status: "completed" });
    }

    if (payment.provider_order_id !== orderId) {
      return NextResponse.json(
        { error: "PAYPAL_ORDER_MISMATCH" },
        { status: 409 },
      );
    }

    const captured = await capturePayPalOrder(orderId);

    const amountOk =
      Number.isFinite(captured.amount) &&
      Math.abs(Number(payment.amount) - captured.amount) < 0.0005;

    const currencyOk =
      String(payment.currency).toUpperCase() ===
      String(captured.currency ?? "").toUpperCase();

    const referenceOk = captured.referenceId === paymentOrderId;

    if (
      captured.status !== "COMPLETED" ||
      captured.captureStatus !== "COMPLETED" ||
      !amountOk ||
      !currencyOk ||
      !referenceOk
    ) {
      return NextResponse.json(
        {
          error: "PAYPAL_CAPTURE_VERIFICATION_FAILED",
          status: captured.status,
        },
        { status: 409 },
      );
    }

    await finalizePaymentOrder(paymentOrderId);

    return NextResponse.json(
      {
        ok: true,
        status: "completed",
        environment: "sandbox",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "PAYPAL_COURSE_CAPTURE_FAILED" },
      { status: 500 },
    );
  }
}
