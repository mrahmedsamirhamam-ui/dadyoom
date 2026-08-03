import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import { getAIProvider } from "@/lib/ai";
import type {
  AiLearningPlan,
  StudentAiContext,
} from "@/lib/ai/provider";

type SkillRow = {
  skill: string | null;
  score: number | null;
};

type MistakeRow = {
  category: string | null;
  mistake_count: number | null;
};

type ProgressRow = {
  completed: boolean | null;
  earned_points: number | null;
};

type ProfileRow = {
  full_name: string | null;
};

export async function generateStudentLearningPlan(
  supabase: SupabaseClient,
  userId: string,
  studentEmail: string
): Promise<AiLearningPlan> {
  const [
    profileResult,
    skillsResult,
    mistakesResult,
    progressResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle(),

    supabase
      .from("student_skills")
      .select("skill, score")
      .eq("student_email", studentEmail)
      .order("score", { ascending: true }),

    supabase
      .from("student_mistakes")
      .select("category, mistake_count")
      .eq("student_email", studentEmail)
      .order("mistake_count", {
        ascending: false,
      })
      .limit(1),

    supabase
      .from("student_progress")
      .select("completed, earned_points")
      .eq("student_email", studentEmail),
  ]);

  if (profileResult.error) {
    console.warn(
      "LEARNING_PLAN_PROFILE_QUERY_WARNING",
      profileResult.error
    );
  }

  if (skillsResult.error) {
    console.warn(
      "LEARNING_PLAN_SKILLS_QUERY_WARNING",
      skillsResult.error
    );
  }

  if (mistakesResult.error) {
    console.warn(
      "LEARNING_PLAN_MISTAKES_QUERY_WARNING",
      mistakesResult.error
    );
  }

  if (progressResult.error) {
    console.warn(
      "LEARNING_PLAN_PROGRESS_QUERY_WARNING",
      progressResult.error
    );
  }

  const profile =
    profileResult.data as ProfileRow | null;

  const skills =
    (skillsResult.data ?? []) as SkillRow[];

  const mistakes =
    (mistakesResult.data ?? []) as MistakeRow[];

  const progress =
    (progressResult.data ?? []) as ProgressRow[];

  const weakestSkill = skills[0] ?? null;

  const strongestSkill =
    skills.length > 0
      ? skills[skills.length - 1]
      : null;

  const completedLessons = progress.filter(
    (item) => item.completed === true
  ).length;

  const totalXp = progress.reduce(
    (total, item) =>
      total + (item.earned_points ?? 0),
    0
  );

  const context: StudentAiContext = {
    studentName:
      profile?.full_name ||
      studentEmail.split("@")[0] ||
      "بطل ضاديوم",

    totalXp,
    completedLessons,

    strongestSkill:
      strongestSkill?.skill ?? null,

    strongestSkillScore:
      strongestSkill?.score ?? 0,

    weakestSkill:
      weakestSkill?.skill ?? null,

    weakestSkillScore:
      weakestSkill?.score ?? 0,

    mostFrequentMistake:
      mistakes[0]?.category ?? null,
  };

  const aiProvider = getAIProvider();

  const plan =
    await aiProvider.generateLearningPlan(
      context
    );

  const { error: insertError } =
    await supabase
      .from("learning_plans")
      .insert({
        student_email: studentEmail,
        title: plan.title,
        message: plan.message,
        priority: plan.priority,
        focus_skill: plan.focusSkill,
        recommended_lesson:
          plan.recommendedLesson,
        practice_type: plan.practiceType,
        daily_goal: plan.dailyGoal,
        motivation: plan.motivation,
        completed: false,
      });

  if (insertError) {
    console.error(
      "LEARNING_PLAN_INSERT_ERROR",
      insertError
    );

    throw new Error(
      "تعذر حفظ خطة التعلم اليومية."
    );
  }

  return plan;
}
