import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type PaddleSubscriptionResponse = {
  data?: {
    id?: string;
    status?: string;
    next_billed_at?: string | null;
    management_urls?: {
      update_payment_method?: string | null;
      cancel?: string | null;
    };
  };
};

function apiBase() {
  return process.env.PADDLE_ENVIRONMENT?.trim().toLowerCase() ===
    "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      {
        error: "AUTH_REQUIRED",
        message: "سجّل الدخول لإدارة اشتراكك.",
      },
      { status: 401 },
    );
  }

  const { data: subscription, error } = await supabase
    .from("edu_subscriptions")
    .select(
      "status,provider,provider_subscription_id,current_period_end",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: "SUBSCRIPTION_LOOKUP_FAILED",
        message: "تعذر قراءة حالة الاشتراك.",
      },
      { status: 500 },
    );
  }

  if (
    !subscription ||
    subscription.provider !== "paddle" ||
    !String(subscription.provider_subscription_id ?? "").startsWith(
      "sub_",
    )
  ) {
    return NextResponse.json(
      {
        managedByPaddle: false,
        trial:
          subscription?.provider === "manual" &&
          String(
            subscription?.provider_subscription_id ?? "",
          ).startsWith("welcome-trial:"),
        currentPeriodEnd:
          subscription?.current_period_end ?? null,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const apiKey = process.env.PADDLE_API_KEY?.trim() ?? "";

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "PADDLE_API_NOT_CONFIGURED",
        message:
          "إدارة اشتراك Paddle تنتظر مفتاح API الآمن في بيئة التشغيل.",
      },
      { status: 503 },
    );
  }

  const providerSubscriptionId = String(
    subscription.provider_subscription_id,
  );

  const response = await fetch(
    `${apiBase()}/subscriptions/${encodeURIComponent(
      providerSubscriptionId,
    )}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Paddle-Version": "1",
      },
      cache: "no-store",
    },
  );

  const payload =
    (await response.json()) as PaddleSubscriptionResponse;

  if (!response.ok || !payload.data) {
    return NextResponse.json(
      {
        error: "PADDLE_SUBSCRIPTION_LOOKUP_FAILED",
        message:
          "تعذر فتح إدارة اشتراك Paddle الآن.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      managedByPaddle: true,
      status: payload.data.status ?? subscription.status,
      nextBilledAt:
        payload.data.next_billed_at ??
        subscription.current_period_end ??
        null,
      updatePaymentMethodUrl:
        payload.data.management_urls
          ?.update_payment_method ?? null,
      cancelUrl:
        payload.data.management_urls?.cancel ?? null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
