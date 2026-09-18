import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  const { data } = await supabase
    .from("edu_subscriptions")
    .select(
      "plan_id,status,provider,provider_subscription_id,current_period_start,current_period_end",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const trial =
    data?.provider === "manual" &&
    String(
      data?.provider_subscription_id ?? "",
    ).startsWith("welcome-trial:");

  return NextResponse.json({
    plan: data?.plan_id ?? "free",
    status: data?.status ?? "free",
    trial,
    trialEndsAt: trial
      ? data?.current_period_end ?? null
      : null,
  });
}
