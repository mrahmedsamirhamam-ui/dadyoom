import { NextResponse } from "next/server";

import {
  createPaymentRecord,
  offerFor,
} from "@/lib/payments/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "AUTH_REQUIRED",
          message: "سجّل الدخول أولًا لشراء الدورة.",
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { courseId?: string };
    const courseId = String(body.courseId ?? "").trim();

    if (!courseId) {
      return NextResponse.json(
        { error: "COURSE_ID_REQUIRED", message: "الدورة غير محددة." },
        { status: 400 },
      );
    }

    const db = createAdminClient();

    const { data: course, error: courseError } = await db
      .from("edu_marketplace_courses")
      .select("id,teacher_id,max_students,status")
      .eq("id", courseId)
      .eq("status", "published")
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json(
        { error: "COURSE_NOT_FOUND", message: "الدورة غير متاحة للشراء." },
        { status: 404 },
      );
    }

    if (course.teacher_id === user.id) {
      return NextResponse.json(
        {
          error: "COURSE_OWNER",
          message: "أنت مالك هذه الدورة ولديك وصول كامل إليها.",
        },
        { status: 409 },
      );
    }

    const { data: existingPurchase } = await db
      .from("edu_marketplace_purchases")
      .select("id")
      .eq("buyer_id", user.id)
      .eq("course_id", courseId)
      .in("status", ["active", "completed"])
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json(
        {
          error: "ALREADY_PURCHASED",
          message: "هذه الدورة موجودة بالفعل في حسابك.",
        },
        { status: 409 },
      );
    }

    const maxStudents = Number(course.max_students ?? 0);
    if (Number.isFinite(maxStudents) && maxStudents > 0) {
      const { count, error: countError } = await db
        .from("edu_marketplace_purchases")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId)
        .in("status", ["active", "completed"]);

      if (countError) throw countError;

      if (Number(count ?? 0) >= maxStudents) {
        return NextResponse.json(
          { error: "COURSE_FULL", message: "اكتمل عدد المقاعد في هذه الدورة." },
          { status: 409 },
        );
      }
    }

    const { data: payout, error: payoutError } = await db
      .from("edu_teacher_payout_profiles")
      .select("bpay_mobile,bpay_name")
      .eq("teacher_id", course.teacher_id)
      .maybeSingle();

    if (payoutError || !payout?.bpay_mobile) {
      return NextResponse.json(
        {
          error: "TEACHER_BPAY_NOT_CONFIGURED",
          message: "المعلم لم يفعّل استقبال مدفوعات BPay لهذه الدورة بعد.",
        },
        { status: 503 },
      );
    }

    const offer = await offerFor({ kind: "course", courseId });

    if (String(offer.currency).toUpperCase() !== "BHD") {
      return NextResponse.json(
        {
          error: "BPAY_REQUIRES_BHD",
          message: "BPay للدورات متاح حاليًا للدفع بالدينار البحريني فقط.",
        },
        { status: 409 },
      );
    }

    const { data: existingOrder } = await db
      .from("edu_payment_orders")
      .select("id,status,amount,currency,bank_reference")
      .eq("buyer_id", user.id)
      .eq("course_id", courseId)
      .eq("provider", "bpay")
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingOrder) {
      return NextResponse.json(
        {
          paymentOrderId: existingOrder.id,
          status: existingOrder.status,
          reference: existingOrder.bank_reference,
          amount: Number(existingOrder.amount),
          currency: existingOrder.currency,
          bpayMobile: payout.bpay_mobile,
          bpayName: payout.bpay_name,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const paymentOrderId = await createPaymentRecord({
      buyerId: user.id,
      kind: "course",
      provider: "bpay",
      amount: offer.amount,
      currency: offer.currency,
      courseId,
      paymentMethod: "bpay_p2p",
    });

    return NextResponse.json(
      {
        paymentOrderId,
        status: "pending",
        amount: offer.amount,
        currency: offer.currency,
        bpayMobile: payout.bpay_mobile,
        bpayName: payout.bpay_name,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        error: "BPAY_COURSE_CHECKOUT_FAILED",
        message: "تعذر تجهيز طلب الدفع عبر BPay.",
      },
      { status: 500 },
    );
  }
}
