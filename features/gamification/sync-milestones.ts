import type { SupabaseClient } from "@supabase/supabase-js";

import { buildLearnerRewards } from "@/features/gamification/reward-engine";
import { getLearnerRewardSnapshot } from "@/features/gamification/learner-reward-snapshot";
import { unlockAchievement } from "@/services/gamification/achievements";

export async function syncGamificationMilestones(args: {
  supabase: SupabaseClient;
  userId: string;
  userEmail?: string | null;
}) {
  const email = args.userEmail?.trim();

  if (!email) return { newlyUnlocked: 0 };

  const bundle = await getLearnerRewardSnapshot(
    args.supabase,
    args.userId,
    email,
  );

  const unlocked = buildLearnerRewards(bundle.stats).filter(
    (item) =>
      item.unlocked &&
      (item.category === "badge" || item.category === "title"),
  );

  let newlyUnlocked = 0;

  for (const item of unlocked) {
    const result = await unlockAchievement({
      supabase: args.supabase,
      studentEmail: email,
      achievementKey: item.key,
      title: item.title,
      description: item.description,
      icon: item.icon,
    });

    if (result.newlyUnlocked) newlyUnlocked += 1;
  }

  return { newlyUnlocked };
}
