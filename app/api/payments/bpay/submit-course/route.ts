import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function validReference(value: string) {
  return (
    value.length >= 4 &&
    value.length <= 120 &&
    !/[\u0000-\u001F\u007F]/u.test(value)
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const body = (await request.json()) as {
      paymentOrderId?: string;
      reference?: string;
    };

    const paymentOrderId = String(body.paymentOrderId ?? "").trim();
    const reference = String(body.reference ?? "").trim();

    if (!paymentOrderId || !validReference(reference)) {
      return NextResponse.json(
        {
          error: "BPAY_REFERENCE_REQUIRED",
          message: "اكتب مرجع عملية BPay كما ظهر في التطبيق أو رسالة التأكيد.",
        },
        { status: 400 },
      );
    }

    const db = createAdminClient();

    const { data: payment, error } = await db
      .from("edu_payment_orders")
      .select("id,status,bank_reference")
      .eq("id", paymentOrderId)
      .eq("buyer_id", user.id)
      .eq("kind", "course")
      .eq("provider", "bpay")
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

    if (payment.status === "approved") {
      return NextResponse.json({
        ok: true,
        status: "approved",
        message: "تم إرسال المرجع بالفعل وينتظر تأكيد المعلم.",
      });
    }

    if (payment.status !== "pending") {
      return NextResponse.json(
        { error: "PAYMENT_ORDER_NOT_PENDING" },
        { status: 409 },
      );
    }

    /*
     * DADYOOM_BPAY_ATOMIC_REFERENCE_V1
     *
     * bank_reference already has a database UNIQUE constraint.
     * Let PostgreSQL arbitrate the reference atomically instead of
     * doing a read-before-write duplicate probe. This removes one
     * production round-trip and closes the race where two requests
     * could both pass the duplicate read before either update.
     */
    const {
      data: updatedPayment,
      error: updateError,
    } = await db
      .from("edu_payment_orders")
      .update({
        bank_reference: reference,
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentOrderId)
      .eq("buyer_id", user.id)
      .eq("kind", "course")
      .eq("provider", "bpay")
      .eq("status", "pending")
      .select("id,status,bank_reference")
      .maybeSingle();

    if (updateError) {
      if (updateError.code === "23505") {
        return NextResponse.json(
          {
            error: "BPAY_REFERENCE_ALREADY_USED",
            message: "مرجع العملية مستخدم بالفعل في طلب دفع آخر.",
          },
          { status: 409 },
        );
      }

      console.error(
        "BPAY_REFERENCE_UPDATE_FAILED",
        {
          paymentOrderId,
          buyerId: user.id,
          code: updateError.code,
          message: updateError.message,
        },
      );

      throw updateError;
    }

    if (!updatedPayment) {
      const {
        data: latestPayment,
        error: latestError,
      } = await db
        .from("edu_payment_orders")
        .select("status,bank_reference")
        .eq("id", paymentOrderId)
        .eq("buyer_id", user.id)
        .maybeSingle();

      if (latestError) {
        throw latestError;
      }

      if (
        latestPayment?.status === "approved" &&
        latestPayment.bank_reference === reference
      ) {
        return NextResponse.json({
          ok: true,
          status: "approved",
          message: "تم إرسال المرجع بالفعل وينتظر تأكيد المعلم.",
        });
      }

      return NextResponse.json(
        {
          error: "PAYMENT_ORDER_NOT_PENDING",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: "approved",
      message: "تم إرسال مرجع BPay. ستُفتح الدورة بعد تأكيد المعلم استلام التحويل.",
    });
  } catch (cause) {
    console.error(
      "BPAY_REFERENCE_SUBMIT_FAILED",
      cause instanceof Error
        ? cause.message
        : String(cause ?? "unknown"),
    );

    return NextResponse.json(
      {
        error: "BPAY_REFERENCE_SUBMIT_FAILED",
        message: "تعذر إرسال مرجع BPay الآن.",
      },
      { status: 500 },
    );
  }
}
