import { NextResponse } from "next/server";

import {
  createPaymentRecord,
  offerFor,
} from "@/lib/payments/orders";
import {
  createTapCharge,
  verifiedTapCardMethod,
} from "@/lib/payments/tap";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "سجل الدخول أولًا." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      kind?: "plus" | "course";
      courseId?: string;
      tokenId?: string;
    };

    const tokenId = String(body.tokenId ?? "").trim();

    if (!tokenId) {
      return NextResponse.json(
        { error: "رمز البطاقة غير موجود." },
        { status: 400 },
      );
    }

    // Verify the token brand directly from Tap. Never trust browser brand data.
    const verifiedMethod = await verifiedTapCardMethod(tokenId);

    const kind = body.kind === "course" ? "course" : "plus";
    const offer = await offerFor({
      kind,
      courseId: body.courseId,
    });

    const db = createAdminClient();

    const paymentId = await createPaymentRecord({
      buyerId: user.id,
      kind,
      provider: "tap",
      amount: offer.amount,
      currency: offer.currency,
      planId: offer.planId,
      courseId: offer.courseId,
    });

    let destination:
      | {
          id: string;
          amount: number;
          currency: string;
        }
      | null = null;

    if (kind === "course" && offer.courseId) {
      const { data: course } = await db
        .from("edu_marketplace_courses")
        .select("teacher_id,commission_bps")
        .eq("id", offer.courseId)
        .single();

      if (course?.teacher_id) {
        const { data: routing } = await db
          .from("edu_teacher_payout_routing")
          .select(
            "tap_destination_id,onboarding_status,payout_enabled",
          )
          .eq("teacher_id", course.teacher_id)
          .maybeSingle();

        if (
          routing?.tap_destination_id &&
          routing.onboarding_status === "approved" &&
          routing.payout_enabled
        ) {
          const commissionBps = Number(
            course.commission_bps ?? 1500,
          );

          const teacherAmount = Number(
            (
              offer.amount *
              (1 - commissionBps / 10000)
            ).toFixed(3),
          );

          destination = {
            id: String(routing.tap_destination_id),
            amount: teacherAmount,
            currency: offer.currency,
          };
        }
      }
    }

    const charge = await createTapCharge({
      amount: offer.amount,
      currency: offer.currency,
      paymentOrderId: paymentId,
      description: offer.description,
      sourceId: tokenId,
      customer: {
        name:
          String(
            user.user_metadata?.full_name ??
              user.user_metadata?.name ??
              "",
          ) || null,
        email: user.email ?? null,
      },
      destination,
    });

    const { error: updateError } = await db
      .from("edu_payment_orders")
      .update({
        provider_order_id: charge.id,
        payment_method: verifiedMethod,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (updateError) throw updateError;

    const base =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/u, "") ||
      "http://localhost:3000";

    const paymentUrl =
      charge.transaction?.url ??
      `${base}/payments/tap/return?tap_id=${encodeURIComponent(
        charge.id,
      )}`;

    return NextResponse.json({
      paymentId,
      chargeId: charge.id,
      paymentUrl,
      marketplaceSplit: Boolean(destination),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "تعذر بدء الدفع بالبطاقة.";

    return NextResponse.json(
      { error: message },
      {
        status: message.includes("VISA_MASTERCARD_ONLY")
          ? 400
          : 500,
      },
    );
  }
}
