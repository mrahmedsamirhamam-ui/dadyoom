import type { SupabaseClient } from "@supabase/supabase-js";

export interface UnlockAchievementParams {
  supabase: SupabaseClient;
  studentEmail: string;
  achievementKey: string;
  title: string;
  description?: string;
  icon?: string;
}

export type UnlockAchievementResult = {
  newlyUnlocked: boolean;
};

export async function unlockAchievement({
  supabase,
  studentEmail,
  achievementKey,
  title,
  description,
  icon,
}: UnlockAchievementParams): Promise<UnlockAchievementResult> {
  const email = studentEmail.trim();
  const key = achievementKey.trim();

  if (!email) {
    throw new Error("Student email is required.");
  }

  if (!key) {
    throw new Error("Achievement key is required.");
  }

  const { data: existingAchievement, error: readError } =
    await supabase
      .from("student_achievements")
      .select("id")
      .eq("student_email", email)
      .eq("achievement_key", key)
      .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (existingAchievement) {
    return {
      newlyUnlocked: false,
    };
  }

  const { error: insertError } = await supabase
    .from("student_achievements")
    .insert({
      student_email: email,
      achievement_key: key,
      title,
      description: description ?? null,
      icon: icon ?? null,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        newlyUnlocked: false,
      };
    }

    throw insertError;
  }

  return {
    newlyUnlocked: true,
  };
}