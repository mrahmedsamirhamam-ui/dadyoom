import { NextResponse } from "next/server";

import { offerFor } from "@/lib/payments/orders";
import { createClient } from "@/lib/supabase/server";
import { checkoutPausedResponse } from "@/lib/payments/checkout-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const paused = checkoutPausedResponse();
  if (paused) return paused;

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "سجل الدخول أولًا." }, { status: 401 });
    }

    const body = (await request.json()) as {
      kind?: "plus" | "course";
      courseId?: string;
    };

    const kind = body.kind === "course" ? "course" : "plus";
    const offer = await offerFor({ kind, courseId: body.courseId });

    const publicKey = process.env.NEXT_PUBLIC_TAP_PUBLIC_KEY?.trim();
    const merchantId = process.env.TAP_MERCHANT_ID?.trim();

    if (!publicKey || !merchantId) {
      return NextResponse.json(
        { error: "بوابة الدفع لم تُفعّل بعد على الخادم." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      publicKey,
      merchantId,
      amount: offer.amount,
      currency: offer.currency,
      customer: {
        name: String(
          user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
        ).trim(),
        email: user.email ?? "",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "PAYMENT_CONFIGURATION_FAILED",
      },
      { status: 500 },
    );
  }
}
