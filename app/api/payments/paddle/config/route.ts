import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "LOGIN_REQUIRED" },
      { status: 401 },
    );
  }

  const clientToken =
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim() ?? "";
  const priceId =
    process.env.NEXT_PUBLIC_PADDLE_PLUS_PRICE_ID?.trim() ?? "";
  const environment =
    process.env.NEXT_PUBLIC_PADDLE_ENV?.trim() === "production"
      ? "production"
      : "sandbox";

  if (!clientToken || !priceId) {
    return NextResponse.json(
      { error: "PADDLE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ??
    "http://localhost:3000";

  return NextResponse.json({
    clientToken,
    priceId,
    environment,
    userId: user.id,
    email: user.email ?? "",
    successUrl: `${siteUrl.replace(/\/$/u, "")}/payments/paddle/success`,
  });
}
