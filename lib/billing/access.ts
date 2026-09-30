"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export type DadyoomPlan = "free" | "plus";

function dashboardForRole(role?: string | null) {
  switch (role?.trim().toLowerCase()) {
    case "teacher":
      return { href: "/teacher", label: "لوحة المعلم" };
    case "parent":
      return { href: "/parent", label: "لوحة ولي الأمر" };
    case "school":
      return { href: "/school", label: "لوحة المدرسة" };
    case "admin":
      return { href: "/admin", label: "لوحة الإدارة" };
    default:
      return { href: "/student", label: "لوحة الطالب" };
  }
}

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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.warn(
      "BILLING_STATUS_AUTH_WARNING",
      authError.message,
    );
  }

  let role: string | null =
    typeof user?.user_metadata?.role === "string"
      ? user.user_metadata.role
      : null;

  let plan: DadyoomPlan = "free";
  let planLookupFailed = false;

  if (user) {
    const [
      planResult,
      profileResult,
    ] = await Promise.all([
      db.rpc("edu_current_plan", {
        p_user: user.id,
      }),
      db
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    if (planResult.error) {
      planLookupFailed = true;
      console.warn(
        "BILLING_STATUS_PLAN_WARNING",
        planResult.error.message,
      );
    } else {
      plan =
        planResult.data === "plus"
          ? "plus"
          : "free";
    }

    if (profileResult.error) {
      console.warn(
        "BILLING_STATUS_PROFILE_WARNING",
        profileResult.error.message,
      );
    } else if (
      typeof profileResult.data?.role === "string"
    ) {
      role = profileResult.data.role;
    }
  }

  const dashboard =
    dashboardForRole(role);

  const [
    planRowResult,
    plusPlanRowResult,
  ] = await Promise.all([
    db
      .from("edu_subscription_plans")
      .select(
        "id,name_ar,monthly_price,currency,ads_enabled,limits",
      )
      .eq("id", plan)
      .maybeSingle(),
    db
      .from("edu_subscription_plans")
      .select("monthly_price,currency")
      .eq("id", "plus")
      .maybeSingle(),
  ]);

  if (planRowResult.error) {
    console.warn(
      "BILLING_STATUS_PLAN_ROW_WARNING",
      planRowResult.error.message,
    );
  }

  if (plusPlanRowResult.error) {
    console.warn(
      "BILLING_STATUS_PLUS_ROW_WARNING",
      plusPlanRowResult.error.message,
    );
  }

  const planRow =
    planRowResult.data;

  const plusPlanRow =
    plusPlanRowResult.data;

  /*
   * Billing status is a presentation/readiness endpoint. A transient
   * subscription lookup must never crash a logged-in page. If plan lookup
   * is degraded, fail closed for ads so a Plus customer is not shown an ad
   * merely because the billing backend had a brief error.
   */
  const showAds =
    user
      ? !planLookupFailed &&
        plan !== "plus" &&
        Boolean(
          planRow?.ads_enabled ??
            true,
        )
      : Boolean(
          planRow?.ads_enabled ??
            true,
        );

  return {
    authenticated: Boolean(user),
    role,
    dashboardHref:
      dashboard.href,
    dashboardLabel:
      dashboard.label,
    plan,
    plus:
      plan === "plus",
    showAds,
    degraded:
      Boolean(authError) ||
      planLookupFailed ||
      Boolean(
        planRowResult.error,
      ) ||
      Boolean(
        plusPlanRowResult.error,
      ),
    limits:
      (planRow?.limits ??
        {}) as Record<
          string,
          number
        >,
    price:
      Number(
        planRow?.monthly_price ??
          0,
      ),
    currency:
      String(
        planRow?.currency ??
          "BHD",
      ),
    plusPrice:
      Number(
        plusPlanRow?.monthly_price ??
          10,
      ),
    plusCurrency:
      String(
        plusPlanRow?.currency ??
          "USD",
      ),
  };
}
