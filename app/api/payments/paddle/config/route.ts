import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

function envValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  return "";
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      {
        error: "AUTH_REQUIRED",
        message: "سجّل الدخول أولًا لتفعيل ضاديوم Plus.",
      },
      { status: 401 },
    );
  }

  const clientToken = envValue(
    "PADDLE_CLIENT_TOKEN",
    "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN",
  );
  const priceId = envValue(
    "PADDLE_PLUS_PRICE_ID",
    "NEXT_PUBLIC_PADDLE_PLUS_PRICE_ID",
  );
  const environment =
    envValue("PADDLE_ENVIRONMENT").toLowerCase() === "production"
      ? "production"
      : "sandbox";

  if (!clientToken || !priceId) {
    return NextResponse.json(
      {
        error: "PADDLE_NOT_CONFIGURED",
        message:
          "بوابة Paddle جاهزة في ضاديوم، وتنتظر مفاتيح الحساب والسعر من لوحة Paddle.",
      },
      {
        status: 503,
        headers: {
          "Retry-After": "3600",
        },
      },
    );
  }

  const { data: plan, error: planError } = await supabase
    .from("edu_subscription_plans")
    .select("monthly_price,currency")
    .eq("id", "plus")
    .maybeSingle();

  if (planError || !plan) {
    return NextResponse.json(
      {
        error: "PLUS_PLAN_NOT_FOUND",
        message: "تعذر تحميل خطة ضاديوم Plus.",
      },
      { status: 503 },
    );
  }

  const amount = Number(plan.monthly_price);
  const currency = String(plan.currency ?? "USD").toUpperCase();

  if (!Number.isFinite(amount) || amount <= 0 || currency !== "USD") {
    return NextResponse.json(
      {
        error: "PLUS_PLAN_INVALID",
        message: "إعداد سعر ضاديوم Plus يحتاج مراجعة.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      clientToken,
      environment,
      priceId,
      userId: user.id,
      email: user.email ?? "",
      amount,
      currency,
      successUrl: new URL(
        "/payments/paddle/success",
        getSiteUrl(),
      ).toString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
