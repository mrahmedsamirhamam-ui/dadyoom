import { NextResponse } from "next/server";

import { buildSubscriptionRewards } from "@/features/gamification/reward-engine";
import { getLearnerRewardSnapshot } from "@/features/gamification/learner-reward-snapshot";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return NextResponse.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { rewardKey?: unknown };
  const rewardKey = typeof body.rewardKey === "string" ? body.rewardKey.trim() : "";

  if (!rewardKey) {
    return NextResponse.json({ ok: false, error: "REWARD_KEY_REQUIRED" }, { status: 400 });
  }

  const admin = createAdminClient();
  const profile = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile.data?.role?.trim().toLowerCase() ?? "";

  if (!["student", "child"].includes(role)) {
    return NextResponse.json({ ok: false, error: "LEARNER_ACCOUNT_REQUIRED" }, { status: 403 });
  }

  const bundle = await getLearnerRewardSnapshot(admin, user.id, user.email);
  const reward = buildSubscriptionRewards(bundle.stats).find(
    (item) => item.key === rewardKey,
  );

  if (!reward?.unlocked || !reward.plusDays) {
    return NextResponse.json({ ok: false, error: "REWARD_NOT_ELIGIBLE" }, { status: 403 });
  }

  const claimKey = `CLAIMED_${reward.key}`;
  const existingClaim = await admin
    .from("student_achievements")
    .select("id")
    .eq("student_email", user.email)
    .eq("achievement_key", claimKey)
    .maybeSingle();

  if (existingClaim.error) throw existingClaim.error;

  if (existingClaim.data) {
    return NextResponse.json({
      ok: true,
      alreadyClaimed: true,
      message: "تم استلام هذه الجائزة سابقًا.",
    });
  }

  const claim = await admin
    .from("student_achievements")
    .insert({
      student_email: user.email,
      achievement_key: claimKey,
      title: reward.title,
      description: `تم استلام ${reward.plusDays} يومًا من ضاديوم Plus.`,
      icon: reward.icon,
    })
    .select("id")
    .single();

  if (claim.error) {
    if (claim.error.code === "23505") {
      return NextResponse.json({
        ok: true,
        alreadyClaimed: true,
        message: "تم استلام هذه الجائزة سابقًا.",
      });
    }
    throw claim.error;
  }

  try {
    const existing = await admin
      .from("edu_subscriptions")
      .select(
        "id,status,provider,provider_subscription_id,current_period_start,current_period_end,grant_source,admin_note,granted_by",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing.error) throw existing.error;

    const now = new Date();
    const oldEnd = existing.data?.current_period_end
      ? new Date(existing.data.current_period_end)
      : null;

    const base =
      existing.data?.status === "active" &&
      oldEnd &&
      oldEnd.getTime() > now.getTime()
        ? oldEnd
        : now;

    const newEnd = addDays(base, reward.plusDays);

    const saved = await admin
      .from("edu_subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan_id: "plus",
          status: "active",
          provider: existing.data?.provider ?? "manual",
          provider_subscription_id: existing.data?.provider_subscription_id ?? null,
          current_period_start: existing.data?.current_period_start ?? now.toISOString(),
          current_period_end: newEnd.toISOString(),
          cancel_at_period_end: false,
          grant_source: existing.data?.grant_source ?? "admin_gift",
          admin_note: [existing.data?.admin_note, `جائزة ضاديوم: ${reward.title}`]
            .filter(Boolean)
            .join(" | ")
            .slice(0, 500) || null,
          granted_by: existing.data?.granted_by ?? null,
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select("id")
      .single();

    if (saved.error) throw saved.error;

    const event = await admin.from("edu_subscription_events").insert({
      subscription_id: saved.data.id,
      user_id: user.id,
      action: existing.data ? "admin_extend" : "admin_grant",
      months: null,
      note: `جائزة تلقائية: ${reward.title}`,
      provider: "manual",
      performed_by: null,
      metadata: {
        source: "gamification_reward",
        rewardKey: reward.key,
        days: reward.plusDays,
      },
    });

    if (event.error) throw event.error;

    return NextResponse.json({
      ok: true,
      alreadyClaimed: false,
      plusDays: reward.plusDays,
      plusUntil: newEnd.toISOString(),
      message: `مبروك! تمت إضافة ${reward.plusDays} يومًا من ضاديوم Plus.`,
    });
  } catch (error) {
    await admin.from("student_achievements").delete().eq("id", claim.data.id);
    throw error;
  }
}
