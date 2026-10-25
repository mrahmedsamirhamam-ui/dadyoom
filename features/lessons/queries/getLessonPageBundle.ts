import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readCompleteGradingPages } from "@/lib/lesson-activities/read-complete-pages";
import { canReadBahrainDraftPreview } from "@/features/lessons/services/bahrain-draft-preview-access";
import { publicLessonActivities, type StudentLessonActivity } from "@/features/lesson-activities/services/public-lesson-activities";
import {
  publicLessonQuestions,
  type StudentQuestion,
} from "@/features/questions/services/public-lesson-questions";

type NeighborLesson = {
  id: string;
  title: string;
  lesson_number: number;
};

export type BundledLessonQuestion = StudentQuestion;

export type BundledLessonActivity = StudentLessonActivity;

export type BundledLesson = {
  id: string;
  unit_id: string;
  title: string;
  lesson_number: number;
  status: string;
  lesson_type: string | null;
  content: string | null;
  summary: string | null;
  instructions: unknown;
  learning_objectives: unknown;
  vocabulary: unknown;
  estimated_minutes: number | null;
  source_page_start: number | null;
  source_page_end: number | null;
  source_pdf_url: string | null;
  previousLesson: NeighborLesson | null;
  nextLesson: NeighborLesson | null;
};

type BundleLearningProgress = {
  id: string;
  status: string;
  progress_percent: number;
  best_score: number;
  last_score: number;
  xp: number;
  attempts: number;
  time_spent_seconds: number;
};

type BundleQuestionAttempt = {
  question_id: string;
  is_correct: boolean;
};

export type BundleActivityAttempt = {
  activity_id: string;
  is_correct: boolean;
  attempt_number: number;
};

type BundleTutorMessage = {
  id: string;
  role: "student" | "tutor";
  content: string;
  created_at: string;
};

type LessonPageBundle = {
  lesson: BundledLesson;
  questions: BundledLessonQuestion[];
  activities: BundledLessonActivity[];
  student: {
    id: string;
  } | null;
  completed: boolean;
  learningProgress:
    BundleLearningProgress | null;
  questionAttempts:
    BundleQuestionAttempt[];
  activityAttempts:
    BundleActivityAttempt[];
  tutorMessages:
    BundleTutorMessage[];
};

export async function getLessonPageBundle(
  lessonId: string
): Promise<LessonPageBundle | null> {
  const supabase =
    await createClient();

  // ==========================================================
  // Normal production path.
  // Published lessons continue to use the canonical RPC.
  // ==========================================================

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_lesson_page_bundle",
    {
      p_lesson_id: lessonId,
    }
  );

  if (error) {
    console.error(
      "Failed to load lesson page bundle:",
      error
    );

    throw error;
  }

  if (data) {
    const bundle =
      data as unknown as Omit<
        LessonPageBundle,
        "activityAttempts"
      >;

    // The database RPC currently returns raw stored question rows.
    // Strip keys and solutions BEFORE any student-facing page receives them.
    const safeQuestions = publicLessonQuestions(bundle.questions);
    const safeActivities = publicLessonActivities(bundle.activities);

    if (
      !bundle.student ||
      safeActivities.length === 0
    ) {
      return {
        ...bundle,
        questions: safeQuestions,
        activities: safeActivities,
        activityAttempts: [],
      };
    }

    const activityIds =
      safeActivities.map(
        (activity) => activity.id
      );

    // Do not truncate the student's activity history at PostgREST max_rows.
    // RLS/owner scope and stable IDs are required on every page.
    const activityAttemptsData = await readCompleteGradingPages({
      readPage: async (offset, limit) => {
        const { data, count, error } = await supabase
          .from("lesson_activity_attempts")
          .select("id,activity_id,is_correct,attempt_number", {
            count: "exact",
          })
          .eq("user_id", bundle.student.id)
          .in("activity_id", activityIds)
          .order("id", { ascending: true })
          .range(offset, offset + limit - 1);
        return { data, count, error };
      },
    });

    return {
      ...bundle,
      questions: safeQuestions,
      activities: safeActivities,

      // Public bundle includes only progress, not row IDs or answer keys.
      activityAttempts: activityAttemptsData.map(
        ({ activity_id, is_correct, attempt_number }) => ({
          activity_id, is_correct, attempt_number,
        })
      ),
    };
  }

  // ==========================================================
  // Bahrain private Draft preview.
  //
  // Conditions:
  // - preview environment flag enabled
  // - authenticated user
  // - explicit verified app_metadata preview entitlement + Bahrain profile
  // - requested lesson belongs to Bahrain
  // - requested lesson status = draft
  //
  // Service role remains server-only.
  // ==========================================================

  if (
    process.env.DADYOOM_BAHRAIN_PREVIEW !==
    "true"
  ) {
    return null;
  }

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .select("country")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  // Auth user_metadata and profiles.country can be edited by students.
  // Neither may independently authorize a private unpublished lesson.
  if (!canReadBahrainDraftPreview(user.app_metadata, profile?.country)) {
    return null;
  }

  const admin =
    createAdminClient();

  const {
    data: lesson,
    error: lessonError,
  } =
    await admin
      .from("lessons")
      .select("id,unit_id,title,lesson_number,status,lesson_type,content,summary,instructions,learning_objectives,vocabulary,estimated_minutes,source_page_start,source_page_end,source_pdf_url")
      .eq(
        "id",
        lessonId
      )
      .eq(
        "status",
        "draft"
      )
      .maybeSingle();

  if (lessonError) {
    throw lessonError;
  }

  if (!lesson) {
    return null;
  }

  // ==========================================================
  // Verify this Draft lesson really belongs to Bahrain.
  // ==========================================================

  const {
    data: unit,
    error: unitError,
  } =
    await admin
      .from("units")
      .select("grade_id")
      .eq(
        "id",
        lesson.unit_id
      )
      .maybeSingle();

  if (unitError) {
    throw unitError;
  }

  if (!unit) {
    return null;
  }

  const {
    data: grade,
    error: gradeError,
  } =
    await admin
      .from("grades")
      .select(
        "curriculum_id,is_active"
      )
      .eq(
        "id",
        unit.grade_id
      )
      .maybeSingle();

  if (gradeError) {
    throw gradeError;
  }

  if (!grade?.is_active) {
    return null;
  }

  const {
    data: curriculum,
    error: curriculumError,
  } =
    await admin
      .from("curricula")
      .select(
        "country_id,is_active"
      )
      .eq(
        "id",
        grade.curriculum_id
      )
      .maybeSingle();

  if (curriculumError) {
    throw curriculumError;
  }

  if (!curriculum?.is_active) {
    return null;
  }

  const {
    data: country,
    error: countryError,
  } =
    await admin
      .from("countries")
      .select(
        "code,is_active"
      )
      .eq(
        "id",
        curriculum.country_id
      )
      .maybeSingle();

  if (countryError) {
    throw countryError;
  }

  if (
    !country?.is_active ||
    String(country.code)
      .trim()
      .toUpperCase() !== "BH"
  ) {
    return null;
  }

  // ==========================================================
  // Load Draft lesson bundle.
  // ==========================================================

  const [
    previousResult,
    nextResult,
    questionsResult,
    activitiesResult,
    progressResult,
    tutorResult,
  ] =
    await Promise.all([
      admin
        .from("lessons")
        .select(
          "id,title,lesson_number"
        )
        .eq(
          "unit_id",
          lesson.unit_id
        )
        .in(
          "status",
          ["published", "draft"]
        )
        .lt(
          "lesson_number",
          lesson.lesson_number
        )
        .order(
          "lesson_number",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle(),

      admin
        .from("lessons")
        .select(
          "id,title,lesson_number"
        )
        .eq(
          "unit_id",
          lesson.unit_id
        )
        .in(
          "status",
          ["published", "draft"]
        )
        .gt(
          "lesson_number",
          lesson.lesson_number
        )
        .order(
          "lesson_number",
          {
            ascending: true,
          }
        )
        .limit(1)
        .maybeSingle(),

      admin
        .from("questions")
        .select("id,lesson_id,question_order,question,question_type,options,correct_answer,explanation,points,created_at,updated_at")
        .eq(
          "lesson_id",
          lesson.id
        )
        .order(
          "question_order",
          {
            ascending: true,
          }
        ),

      admin
        .from("lesson_activities")
        .select("id,lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,created_at,updated_at")
        .eq(
          "lesson_id",
          lesson.id
        )
        .eq(
          "is_published",
          true
        )
        .order(
          "activity_order",
          {
            ascending: true,
          }
        ),

      admin
        .from("student_lesson_progress")
        .select("id,status,progress_percent,best_score,last_score,xp,attempts,time_spent_seconds")
        .eq(
          "student_id",
          user.id
        )
        .eq(
          "lesson_id",
          lesson.id
        )
        .order(
          "updated_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle(),

      admin
        .from("ai_tutor_messages")
        .select(
          "id,role,content,created_at"
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "lesson_id",
          lesson.id
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        )
        .limit(50),
    ]);

  if (previousResult.error) {
    throw previousResult.error;
  }

  if (nextResult.error) {
    throw nextResult.error;
  }

  if (questionsResult.error) {
    throw questionsResult.error;
  }

  if (activitiesResult.error) {
    throw activitiesResult.error;
  }

  if (progressResult.error) {
    throw progressResult.error;
  }

  if (tutorResult.error) {
    throw tutorResult.error;
  }

  const questions =
    questionsResult.data ?? [];

  const activities =
    publicLessonActivities(activitiesResult.data);

  // ==========================================================
  // Question attempts.
  // ==========================================================

  let questionAttempts:
    BundleQuestionAttempt[] = [];

  const questionIds =
    questions.map(
      (question) => question.id
    );

  if (questionIds.length > 0) {

    const attempts = await readCompleteGradingPages({
      readPage: async (offset, limit) => {
        const { data, count, error } = await admin
          .from("question_attempts")
          .select("id,question_id,is_correct", { count: "exact" })
          .eq("user_id", user.id)
          .in("question_id", questionIds)
          .order("id", { ascending: true })
          .range(offset, offset + limit - 1);
        return { data, count, error };
      },
    });

    questionAttempts =
      (attempts ?? []).map(
        (attempt) => ({
          question_id:
            attempt.question_id,

          is_correct:
            Boolean(
              attempt.is_correct
            ),
        })
      );
  }

  // ==========================================================
  // Activity attempts.
  // ==========================================================

  let activityAttempts:
    BundleActivityAttempt[] = [];

  const activityIds =
    activities.map(
      (activity) => activity.id
    );

  if (activityIds.length > 0) {

    const attemptRows = await readCompleteGradingPages({
      readPage: async (offset, limit) => {
        const { data, count, error } = await admin
          .from("lesson_activity_attempts")
          .select("id,activity_id,is_correct,attempt_number", { count: "exact" })
          .eq("user_id", user.id)
          .in("activity_id", activityIds)
          .order("id", { ascending: true })
          .range(offset, offset + limit - 1);
        return { data, count, error };
      },
    });

    activityAttempts = attemptRows.map(
      ({ activity_id, is_correct, attempt_number }) => ({
        activity_id, is_correct, attempt_number,
      })
    );
  }

  // ==========================================================
  // Completion state.
  // ==========================================================

  const learningProgress =
    progressResult.data ??
    null;

  const completed =
    Boolean(
      learningProgress &&
      (
        learningProgress.status ===
          "completed" ||
        learningProgress.status ===
          "mastered" ||
        Number(
          learningProgress.progress_percent ??
          0
        ) >= 100
      )
    );

  // ==========================================================
  // Final preview bundle.
  // ==========================================================

  return {
    lesson: {
      ...lesson,

      previousLesson:
        previousResult.data ??
        null,

      nextLesson:
        nextResult.data ??
        null,
    } as unknown as BundledLesson,

    questions:
      publicLessonQuestions(questions),

    activities,

    student: {
      id: user.id,
    },

    completed,

    learningProgress:
      learningProgress as unknown as
        BundleLearningProgress |
        null,

    questionAttempts,

    activityAttempts,

    tutorMessages:
      (
        tutorResult.data ??
        []
      ) as unknown as
        BundleTutorMessage[],
  };
}