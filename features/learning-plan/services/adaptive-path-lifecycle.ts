import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  buildAdaptiveLearningPlan,
  type AdaptiveLearningStep,
} from "./buildAdaptiveLearningPlan";

export type AdaptiveStepType =
  | "lesson"
  | "practice"
  | "assessment";

export type AdaptiveStepStatus =
  | "not_started"
  | "in_progress"
  | "completed";

type AdaptiveStepRow = {
  id: string;
  student_id: string;
  lesson_id: string | null;
  focus_skill: string;
  step_order: number;
  step_type: AdaptiveStepType;
  title: string;
  status: AdaptiveStepStatus;
  started_at: string | null;
  completed_at: string | null;
};

type EnsureAdaptivePathParams = {
  supabase: SupabaseClient;
  studentId: string;
  lessonId: string;
  focusSkill: string;
};

type CompleteAdaptiveStepParams = {
  supabase: SupabaseClient;
  studentId: string;
  lessonId: string;
  stepType: AdaptiveStepType;
  focusSkill?: string;
};

function normalizeValue(
  value: string,
  label: string
) {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      `${label} is required.`
    );
  }

  return normalized;
}

async function getPathRows(
  supabase: SupabaseClient,
  studentId: string,
  lessonId: string
): Promise<AdaptiveStepRow[]> {
  const {
    data,
    error,
  } = await supabase
    .from("adaptive_learning_steps")
    .select(`
      id,
      student_id,
      lesson_id,
      focus_skill,
      step_order,
      step_type,
      title,
      status,
      started_at,
      completed_at
    `)
    .eq(
      "student_id",
      studentId
    )
    .eq(
      "lesson_id",
      lessonId
    )
    .order(
      "step_order",
      {
        ascending: true,
      }
    );

  if (error) {
    throw error;
  }

  return (
    data ?? []
  ) as AdaptiveStepRow[];
}

async function insertPlanStep(
  supabase: SupabaseClient,
  params: {
    studentId: string;
    lessonId: string;
    focusSkill: string;
    step: AdaptiveLearningStep;
    status: AdaptiveStepStatus;
    startedAt: string | null;
  }
) {
  const {
    error,
  } = await supabase
    .from("adaptive_learning_steps")
    .insert({
      student_id:
        params.studentId,

      lesson_id:
        params.lessonId,

      focus_skill:
        params.focusSkill,

      step_order:
        params.step.order,

      step_type:
        params.step.type,

      title:
        params.step.title,

      status:
        params.status,

      started_at:
        params.startedAt,

      completed_at:
        null,
    });

  if (error) {
    throw error;
  }
}

/*
 * يضمن وجود المسار التكيفي في قاعدة البيانات.
 *
 * لا نعتمد هنا على upsert أو constraint غير مؤكد.
 * لذلك نقرأ المسار أولًا ثم ننشئ الخطوات الناقصة فقط.
 */
export async function ensureAdaptivePath({
  supabase,
  studentId,
  lessonId,
  focusSkill,
}: EnsureAdaptivePathParams) {
  const normalizedStudentId =
    normalizeValue(
      studentId,
      "Student ID"
    );

  const normalizedLessonId =
    normalizeValue(
      lessonId,
      "Lesson ID"
    );

  const normalizedFocusSkill =
    normalizeValue(
      focusSkill,
      "Focus skill"
    );

  const plan =
    buildAdaptiveLearningPlan(
      normalizedFocusSkill,
      normalizedLessonId
    );

  const existingRows =
    await getPathRows(
      supabase,
      normalizedStudentId,
      normalizedLessonId
    );

  const existingOrders =
    new Set(
      existingRows.map(
        (row) =>
          row.step_order
      )
    );

  const now =
    new Date().toISOString();

  for (
    const step of
    plan.steps
  ) {
    if (
      existingOrders.has(
        step.order
      )
    ) {
      continue;
    }

    const isFirstStep =
      step.order === 1;

    await insertPlanStep(
      supabase,
      {
        studentId:
          normalizedStudentId,

        lessonId:
          normalizedLessonId,

        focusSkill:
          normalizedFocusSkill,

        step,

        status:
          isFirstStep
            ? "in_progress"
            : "not_started",

        startedAt:
          isFirstStep
            ? now
            : null,
      }
    );
  }

  return getPathRows(
    supabase,
    normalizedStudentId,
    normalizedLessonId
  );
}

/*
 * يكمل خطوة واحدة ثم يفتح الخطوة التالية.
 *
 * العملية idempotent:
 * إذا كانت الخطوة مكتملة بالفعل فلن نعيد إكمالها
 * ولن نغيّر completed_at الخاص بها.
 */
export async function completeAdaptiveStep({
  supabase,
  studentId,
  lessonId,
  stepType,
  focusSkill,
}: CompleteAdaptiveStepParams) {
  const normalizedStudentId =
    normalizeValue(
      studentId,
      "Student ID"
    );

  const normalizedLessonId =
    normalizeValue(
      lessonId,
      "Lesson ID"
    );

  let rows =
    await getPathRows(
      supabase,
      normalizedStudentId,
      normalizedLessonId
    );

  /*
   * إذا لم يكن المسار قد أُنشئ بعد،
   * يمكن إنشاؤه عندما تتوفر المهارة.
   */
  if (
    rows.length === 0 &&
    focusSkill
  ) {
    rows =
      await ensureAdaptivePath({
        supabase,
        studentId:
          normalizedStudentId,
        lessonId:
          normalizedLessonId,
        focusSkill,
      });
  }

  const currentStep =
    rows.find(
      (row) =>
        row.step_type ===
        stepType
    );

  if (!currentStep) {
    return {
      updated: false,
      reason:
        "step_not_found" as const,
      currentStep: null,
      nextStep: null,
      pathCompleted: false,
    };
  }

  /*
   * لا يسمح بتخطي ترتيب المسار.
   */
  const incompletePreviousStep =
    rows.find(
      (row) =>
        row.step_order <
          currentStep.step_order &&
        row.status !==
          "completed"
    );

  if (incompletePreviousStep) {
    return {
      updated: false,
      reason:
        "blocked_by_previous_step" as const,

      currentStep,

      nextStep:
        null,

      pathCompleted:
        false,

      blockedBy:
        incompletePreviousStep,
    };
  }

  if (
    currentStep.status ===
    "completed"
  ) {
    const nextStep =
      rows.find(
        (row) =>
          row.step_order ===
          currentStep.step_order + 1
      ) ?? null;

    return {
      updated: false,
      reason:
        "already_completed" as const,
      currentStep,
      nextStep,
      pathCompleted:
        !nextStep,
    };
  }

  const now =
    new Date().toISOString();

  const {
    data: completedStep,
    error: completeError,
  } = await supabase
    .from("adaptive_learning_steps")
    .update({
      status:
        "completed",

      started_at:
        currentStep.started_at ??
        now,

      completed_at:
        now,
    })
    .eq(
      "id",
      currentStep.id
    )
    .eq(
      "student_id",
      normalizedStudentId
    )
    .select(`
      id,
      student_id,
      lesson_id,
      focus_skill,
      step_order,
      step_type,
      title,
      status,
      started_at,
      completed_at
    `)
    .single();

  if (completeError) {
    throw completeError;
  }

  const nextStep =
    rows.find(
      (row) =>
        row.step_order ===
        currentStep.step_order + 1
    ) ?? null;

  let openedNextStep:
    AdaptiveStepRow | null =
      null;

  if (
    nextStep &&
    nextStep.status ===
      "not_started"
  ) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "adaptive_learning_steps"
      )
      .update({
        status:
          "in_progress",

        started_at:
          nextStep.started_at ??
          now,
      })
      .eq(
        "id",
        nextStep.id
      )
      .eq(
        "student_id",
        normalizedStudentId
      )
      .select(`
        id,
        student_id,
        lesson_id,
        focus_skill,
        step_order,
        step_type,
        title,
        status,
        started_at,
        completed_at
      `)
      .single();

    if (error) {
      throw error;
    }

    openedNextStep =
      data as AdaptiveStepRow;
  } else {
    openedNextStep =
      nextStep;
  }

  return {
    updated: true,
    reason:
      "completed" as const,

    currentStep:
      completedStep as
        AdaptiveStepRow,

    nextStep:
      openedNextStep,

    pathCompleted:
      !nextStep,
  };
}
