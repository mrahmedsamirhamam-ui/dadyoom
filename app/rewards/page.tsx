import { redirect } from "next/navigation";

import RewardsCenterClient from "@/features/gamification/components/RewardsCenterClient";
import {
  buildLearnerCertificates,
  buildLearnerRewards,
  buildSubscriptionRewards,
  roleCertificate,
} from "@/features/gamification/reward-engine";
import { getLearnerRewardSnapshot } from "@/features/gamification/learner-reward-snapshot";
import { getLevelByXp } from "@/lib/constants/levels";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/rewards");

  const profileResult = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error || !profileResult.data) {
    throw new Error("تعذر تحميل بيانات الحساب.");
  }

  const profile = profileResult.data;
  const role = profile.role?.trim().toLowerCase() ?? "";
  const displayName =
    profile.full_name?.trim() || user.email?.split("@")[0] || "صديق ضاديوم";

  if ((role === "student" || role === "child") && user.email) {
    const bundle = await getLearnerRewardSnapshot(
      createAdminClient(),
      user.id,
      user.email,
    );

    const level = getLevelByXp(bundle.stats.totalXP);

    return (
      <RewardsCenterClient
        displayName={bundle.displayName}
        role={role === "child" ? "طفل" : "طالب"}
        summary={{
          totalXP: bundle.stats.totalXP,
          completedLessons: bundle.stats.completedLessons,
          masteredLessons: bundle.stats.masteredLessons,
          currentStreak: bundle.stats.currentStreak,
          longestStreak: bundle.stats.longestStreak,
          levelName: level.name,
          levelNumber: level.level,
        }}
        rewards={buildLearnerRewards(bundle.stats)}
        subscriptionRewards={buildSubscriptionRewards(bundle.stats)}
        certificates={buildLearnerCertificates(bundle.stats)}
        manualAwards={bundle.manualAwards}
        claimedRewardKeys={bundle.claimedRewardKeys}
      />
    );
  }

  const certificate = roleCertificate(role);

  return (
    <RewardsCenterClient
      displayName={displayName}
      role={
        role === "teacher"
          ? "معلم"
          : role === "parent"
            ? "ولي أمر"
            : role === "school"
              ? "مدرسة"
              : role === "admin"
                ? "إدارة"
                : "حساب ضاديوم"
      }
      summary={null}
      rewards={[]}
      subscriptionRewards={[]}
      certificates={certificate ? [certificate] : []}
      manualAwards={[]}
      claimedRewardKeys={[]}
    />
  );
}
