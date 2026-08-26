import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  AdaptiveLearningPlan,
} from "./buildAdaptiveLearningPlan";

type SyncAdaptiveLearningStepsParams = {
  supabase: SupabaseClient;
  studentId: string;
  lessonId?: string | null;
  plan: AdaptiveLearningPlan;
};

export type AdaptiveStepStatus =
  | "not_started"
  | "in_progress"
  | "completed";

export async function syncAdaptiveLearningSteps({
  supabase,
  studentId,
  lessonId,
  plan,
}: SyncAdaptiveLearningStepsParams) {
  const rows =
    plan.steps.map((step) => ({
      student_id:
        studentId,

      lesson_id:
        lessonId ?? null,

      focus_skill:
        plan.focusSkill,

      step_order:
        step.order,

      step_type:
        step.type,

      title:
        step.title,

      updated_at:
        new Date().toISOString(),
    }));

  const {
    data,
    error,
  } = await supabase
    .from("adaptive_learning_steps")
    .upsert(
      rows,
      {
        onConflict:
          "student_id,lesson_id,focus_skill,step_order",

        ignoreDuplicates:
          false,
      }
    )
    .select(`
      id,
      lesson_id,
      focus_skill,
      step_order,
      step_type,
      title,
      status,
      started_at,
      completed_at
    `)
    .order("step_order", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}
