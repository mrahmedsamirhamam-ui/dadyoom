"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export type DadyoomPlan = "free" | "plus";

export type FeatureAccess = {
  allowed: boolean;
  plan: DadyoomPlan;
  used: number;
  limit: number | null;
  remaining: number | null;
};

export async function currentPlan(): Promise<DadyoomPlan> {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return "free";

  const { data, error } = await db.rpc("edu_current_plan", {
    p_user: user.id,
  });

  if (error) return "free";

  return data === "plus" ? "plus" : "free";
}

export async function consumeFeature(
  feature: string,
): Promise<FeatureAccess> {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      plan: "free",
      used: 0,
      limit: 0,
      remaining: 0,
    };
  }

  const { data, error } = await db.rpc("edu_consume_feature", {
    p_feature: feature,
    p_amount: 1,
  });

  if (error) {
    throw new Error(`FEATURE_LIMIT_FAILED:${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    allowed: Boolean(row?.allowed),
    plan: row?.plan_id === "plus" ? "plus" : "free",
    used: Number(row?.used_count ?? 0),
    limit:
      row?.limit_value === null || row?.limit_value === undefined
        ? null
        : Number(row.limit_value),
    remaining:
      row?.remaining === null || row?.remaining === undefined
        ? null
        : Number(row.remaining),
  };
}

export async function billingStatus() {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;
  const { data: { user } } = await supabase.auth.getUser();

  // Advertising MUST fail closed: a plan-RPC failure must never fall back
  // to displaying ads to a Plus user. Child/student and anonymous audiences
  // also receive no ads until an age-appropriate, compliant path is proven.
  const [verifiedSubscription, profile] = user
    ? await Promise.all([
        db.rpc("edu_current_plan", { p_user: user.id }),
        db.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      ])
    : [null, null];

  const subscriptionVerified = Boolean(user && verifiedSubscription && !verifiedSubscription.error);
  const plan: DadyoomPlan =
    subscriptionVerified && verifiedSubscription?.data === "plus" ? "plus" : "free";

  const { data: planRow, error: planError } = await db
    .from("edu_subscription_plans")
    .select("id,name_ar,monthly_price,currency,ads_enabled,limits")
    .eq("id", plan)
    .maybeSingle();

  const role = profile?.data?.role ?? null;
  const adultAccountRoleVerified =
    !profile?.error && ["teacher", "parent", "school", "admin"].includes(String(role));
  const privacyAndAdSettingsReady = process.env.DADYOOM_ADS_COMPLIANCE_READY === "true";

  return {
    authenticated: Boolean(user),
    plan,
    plus: plan === "plus",
    showAds:
      subscriptionVerified &&
      adultAccountRoleVerified &&
      privacyAndAdSettingsReady &&
      !planError &&
      plan !== "plus" &&
      planRow?.ads_enabled === true,
    limits: (planRow?.limits ?? {}) as Record<string, number>,
    price: Number(planRow?.monthly_price ?? 0),
    currency: String(planRow?.currency ?? "BHD"),
  };
}
