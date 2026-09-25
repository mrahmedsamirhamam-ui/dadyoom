import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

type PaddlePriceResponse = {
  data?: {
    id?: string;
    status?: string;
    unit_price?: {
      amount?: string;
      currency_code?: string;
    };
    billing_cycle?: {
      interval?: string;
      frequency?: number;
    } | null;
  };
};

function envValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  return "";
}

function signCheckoutBinding(args: {
  secret: string;
  userId: string;
  planId: string;
  priceId: string;
}) {
  return crypto
    .createHmac("sha256", args.secret)
    .update(
      `dadyoom-paddle-checkout-v1:${args.userId}:${args.planId}:${args.priceId}`,
    )
    .digest("hex");
}

function environment() {
  return envValue("PADDLE_ENVIRONMENT").toLowerCase() ===
    "production"
    ? "production"
    : "sandbox";
}

function apiBase() {
  return environment() === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

async function verifyConfiguredPrice(args: {
  apiKey: string;
  priceId: string;
  amount: number;
  currency: string;
}) {
  const response = await fetch(
    `${apiBase()}/prices/${encodeURIComponent(args.priceId)}`,
    {
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
        "Paddle-Version": "1",
      },
      cache: "no-store",
    },
  );

  const payload =
    (await response.json()) as PaddlePriceResponse;

  if (!response.ok || !payload.data) {
    return false;
  }

  const expectedMinorUnits = Math.round(
    args.amount * 100,
  );
  const receivedMinorUnits = Number(
    payload.data.unit_price?.amount ?? NaN,
  );
  const receivedCurrency = String(
    payload.data.unit_price?.currency_code ?? "",
  ).toUpperCase();
  const cycle = payload.data.billing_cycle;

  return (
    payload.data.id === args.priceId &&
    payload.data.status === "active" &&
    receivedMinorUnits === expectedMinorUnits &&
    receivedCurrency === args.currency &&
    cycle?.interval === "month" &&
    Number(cycle.frequency) === 1
  );
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
        message:
          "سجّل الدخول أولًا لتفعيل ضاديوم Plus.",
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
  const apiKey = envValue("PADDLE_API_KEY");
  const webhookSecret = envValue("PADDLE_WEBHOOK_SECRET");

  if (!clientToken || !priceId || !apiKey || !webhookSecret) {
    return NextResponse.json(
      {
        error: "PADDLE_NOT_CONFIGURED",
        message:
          "بوابة Paddle جاهزة في ضاديوم، وتنتظر بيانات الحساب والسعر الآمنة من لوحة Paddle.",
      },
      {
        status: 503,
        headers: {
          "Retry-After": "3600",
        },
      },
    );
  }

  const { data: plan, error: planError } =
    await supabase
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
  const currency = String(
    plan.currency ?? "USD",
  ).toUpperCase();

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    currency !== "USD"
  ) {
    return NextResponse.json(
      {
        error: "PLUS_PLAN_INVALID",
        message: "إعداد سعر ضاديوم Plus يحتاج مراجعة.",
      },
      { status: 503 },
    );
  }

  const priceVerified = await verifyConfiguredPrice({
    apiKey,
    priceId,
    amount,
    currency,
  });

  if (!priceVerified) {
    return NextResponse.json(
      {
        error: "PADDLE_PRICE_NOT_VERIFIED",
        message:
          "سعر Paddle لا يطابق خطة ضاديوم Plus الشهرية 10 USD أو أن السعر غير نشط.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      clientToken,
      environment: environment(),
      priceId,
      userId: user.id,
      email: user.email ?? "",
      amount,
      currency,
      checkoutBinding: signCheckoutBinding({
        secret: webhookSecret,
        userId: user.id,
        planId: "plus",
        priceId,
      }),
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
