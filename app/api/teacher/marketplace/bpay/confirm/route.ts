import { NextResponse } from "next/server";

import { finalizePaymentOrder } from "@/lib/payments/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A small JSON API avoids rendering a full Server Action RSC tree on the
// resource-constrained Cloudflare worker. This endpoint NEVER creates a
// payment, charges a card, or initiates any transfer.
export async function POST(request: Request) {
  const noStore = { "Cache-Control": "no-store" };

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { ok: false, message: "مصدر الطلب غير مسموح." },
      { status: 403, headers: noStore },
    );
  }

  if (!(request.headers.get("content-type") ?? "").startsWith("application/json")) {
    return NextResponse.json(
      { ok: false, message: "صيغة الطلب غير صحيحة." },
      { status: 415, headers: noStore },
    );
  }

  let paymentOrderId: string;
  try {
    const raw = await request.text();
    if (raw.length > 1024) throw new Error("BODY_TOO_LARGE");
    const input = JSON.parse(raw) as Record<string, unknown>;
    paymentOrderId =
      typeof input.paymentOrderId === "string" ? input.paymentOrderId.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(paymentOrderId)) {
      throw new Error("INVALID_ID");
    }
  } catch {
    return NextResponse.json(
      { ok: false, message: "طلب BPay غير محدد أو غير صالح." },
      { status: 400, headers: noStore },
    );
  }

  try {
    const db = await createClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, message: "سجّل الدخول أولًا." },
        { status: 401, headers: noStore },
      );
    }

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !["teacher", "admin"].includes(
      typeof profile?.role === "string" ? profile.role.trim().toLowerCase() : "",
    )) {
      return NextResponse.json(
        { ok: false, message: "هذه المساحة للمعلمين." },
        { status: 403, headers: noStore },
      );
    }

    const admin = createAdminClient();
    const { data: payment, error: paymentError } = await admin
      .from("edu_payment_orders")
      .select("id,course_id,status,bank_reference")
      .eq("id", paymentOrderId)
      .eq("kind", "course")
      .eq("provider", "bpay")
      .maybeSingle();

    if (paymentError || !payment?.course_id) {
      return NextResponse.json(
        { ok: false, message: "طلب BPay غير موجود." },
        { status: 404, headers: noStore },
      );
    }

    // Ownership is checked BEFORE any status is disclosed, including for
    // previously completed orders. A different teacher must not confirm it.
    const { data: ownedCourse, error: ownerError } = await db
      .from("edu_marketplace_courses")
      .select("id")
      .eq("id", payment.course_id)
      .eq("teacher_id", user.id)
      .maybeSingle();

    if (ownerError || !ownedCourse) {
      return NextResponse.json(
        { ok: false, message: "لا تملك صلاحية تأكيد هذه الدفعة." },
        { status: 403, headers: noStore },
      );
    }

    if (payment.status === "completed") {
      return NextResponse.json(
        { ok: true, message: "تم تأكيد استلام BPay وفتح الدورة للطالب.", status: "completed" },
        { headers: noStore },
      );
    }

    if (payment.status !== "approved" || !payment.bank_reference) {
      return NextResponse.json(
        { ok: false, message: "الطالب لم يرسل مرجع BPay بعد." },
        { status: 409, headers: noStore },
      );
    }

    await finalizePaymentOrder(paymentOrderId);

    return NextResponse.json(
      { ok: true, message: "تم تأكيد استلام BPay وفتح الدورة للطالب.", status: "completed" },
      { headers: noStore },
    );
  } catch (error) {
    console.error(
      "TEACHER_BPAY_CONFIRM_FAILED",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      { ok: false, message: "تعذر تأكيد دفعة BPay. تحقق من حالتها قبل إعادة المحاولة." },
      { status: 503, headers: noStore },
    );
  }
}
