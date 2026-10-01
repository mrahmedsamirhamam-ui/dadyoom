import { NextResponse } from "next/server";

import {
  createPaymentRecord,
  offerFor,
} from "@/lib/payments/orders";
import { createTapCharge } from "@/lib/payments/tap";
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

    const tapReady = Boolean(
      process.env.TAP_SECRET_KEY?.trim() &&
        process.env.TAP_MERCHANT_ID?.trim(),
    );

    if (!tapReady) {
      return NextResponse.json(
        {
          error: "COURSE_PAYMENT_NOT_CONFIGURED",
          message:
            "شراء الدورات جاهز في ضاديوم وينتظر تفعيل بيانات بوابة الدفع.",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      courseId?: string;
    };
    const courseId = String(body.courseId ?? "").trim();

    if (!courseId) {
      return NextResponse.json(
        {
          error: "COURSE_ID_REQUIRED",
          message: "الدورة غير محددة.",
        },
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
        {
          error: "COURSE_NOT_FOUND",
          message: "الدورة غير متاحة للشراء.",
        },
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

    const { data: existing } = await db
      .from("edu_marketplace_purchases")
      .select("id")
      .eq("buyer_id", user.id)
      .eq("course_id", courseId)
      .in("status", ["active", "completed"])
      .maybeSingle();

    if (existing) {
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
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("course_id", courseId)
        .in("status", ["active", "completed"]);

      if (countError) throw countError;

      if (Number(count ?? 0) >= maxStudents) {
        return NextResponse.json(
          {
            error: "COURSE_FULL",
            message: "اكتمل عدد المقاعد في هذه الدورة.",
          },
          { status: 409 },
        );
      }
    }

    const offer = await offerFor({
      kind: "course",
      courseId,
    });

    const paymentOrderId = await createPaymentRecord({
      buyerId: user.id,
      kind: "course",
      provider: "tap",
      amount: offer.amount,
      currency: offer.currency,
      courseId,
      paymentMethod: "hosted_card",
    });

    const charge = await createTapCharge({
      amount: offer.amount,
      currency: offer.currency,
      paymentOrderId,
      description: offer.description,
      sourceId: "src_card",
      customer: {
        name:
          String(user.user_metadata?.full_name ?? "").trim() ||
          null,
        email: user.email ?? null,
      },
      destination: null,
    });

    const { error: updateError } = await db
      .from("edu_payment_orders")
      .update({
        provider_order_id: charge.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentOrderId)
      .eq("buyer_id", user.id);

    if (updateError) throw updateError;

    const url = String(charge.transaction?.url ?? "").trim();

    if (!url) {
      return NextResponse.json(
        {
          error: "PAYMENT_URL_MISSING",
          message: "تعذر فتح صفحة الدفع الآمنة.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { url },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        error: "COURSE_CHECKOUT_FAILED",
        message: "تعذر تجهيز عملية شراء الدورة.",
      },
      { status: 500 },
    );
  }
}
