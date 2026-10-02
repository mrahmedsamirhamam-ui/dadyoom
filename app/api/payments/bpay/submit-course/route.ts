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

    const { data: duplicate } = await db
      .from("edu_payment_orders")
      .select("id")
      .eq("bank_reference", reference)
      .neq("id", paymentOrderId)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          error: "BPAY_REFERENCE_ALREADY_USED",
          message: "مرجع العملية مستخدم بالفعل في طلب دفع آخر.",
        },
        { status: 409 },
      );
    }

    const { error: updateError } = await db
      .from("edu_payment_orders")
      .update({
        bank_reference: reference,
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentOrderId)
      .eq("buyer_id", user.id)
      .eq("status", "pending");

    if (updateError) throw updateError;

    return NextResponse.json({
      ok: true,
      status: "approved",
      message: "تم إرسال مرجع BPay. ستُفتح الدورة بعد تأكيد المعلم استلام التحويل.",
    });
  } catch {
    return NextResponse.json(
      {
        error: "BPAY_REFERENCE_SUBMIT_FAILED",
        message: "تعذر إرسال مرجع BPay الآن.",
      },
      { status: 500 },
    );
  }
}
