import type {
  LessonRow,
  StudentProgressRow,
  LearningProfileRow,
} from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type StudentStats = {
  points: number;
  completed_lessons: number;
  completed_courses: number;
  in_progress_lessons: number;
  average_score: number;
};

type ProgressWithRelations = StudentProgressRow & {
  edu_lessons?: (LessonRow & {
    edu_units?: {
      subject_id?: string;
    };
  }) | null;
};

async function resolveStudentId(
  supabase: SupabaseClient,
  email?: string
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return user.id;
  }

  if (email) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle<LearningProfileRow>();

    if (data?.id) {
      return data.id;
    }
  }

  throw new Error("ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø·Ø§Ù„Ø¨ Ø§Ù„Ø­Ø§Ù„ÙŠ.");
}

export async function getStudentStats(
  supabase: SupabaseClient,
  email: string
): Promise<StudentStats> {
  try {
    const studentId = await resolveStudentId(
      supabase,
      email
    );

    const [
      progressResult,
      pointsResult,
    ] = await Promise.all([
      supabase
        .from("edu_learner_progress")
        .select(`
          status,
          score,
          edu_lessons!inner (
            unit_id,
            edu_units!inner (
              subject_id
            )
          )
        `)
        .eq("student_id", studentId),

      supabase
        .from("edu_point_transactions")
        .select("points")
        .eq("student_id", studentId),
    ]);

    if (progressResult.error) {
      throw new Error(progressResult.error.message);
    }

    if (pointsResult.error) {
      console.warn(
        "POINTS_QUERY_FAILED",
        pointsResult.error.message
      );
    }

    const progress = (progressResult.data ?? []) as unknown as ProgressWithRelations[];
    const pointsRows = (pointsResult.data ?? []) as unknown as Array<{ points?: number }>;

    const completed = progress.filter(
      (item: ProgressWithRelations) => item.status === "completed"
    );

    const inProgress = progress.filter(
      (item: ProgressWithRelations) => item.status === "in_progress"
    );

    const subjectIds = new Set(
      completed
        .map(
          (item: ProgressWithRelations) =>
            item.edu_lessons?.edu_units?.subject_id
        )
        .filter(Boolean)
    );

    const scored = completed
      .map((item: ProgressWithRelations) => item.score)
      .filter(
        (score: unknown): score is number | string =>
          typeof score === "number" ||
          typeof score === "string"
      )
      .map(Number);

    const averageScore =
      scored.length > 0
        ? Math.round(
            scored.reduce(
              (sum: number, score: number) => sum + score,
              0
            ) / scored.length
          )
        : 0;

    const points = pointsRows.reduce(
      (sum: number, row: { points?: number }) =>
        sum + Number(row.points ?? 0),
      0
    );

    return {
      points,
      completed_lessons: completed.length,
      completed_courses: subjectIds.size,
      in_progress_lessons: inProgress.length,
      average_score: averageScore,
    };
  } catch (error) {
    console.warn("GET_STUDENT_STATS_FAILED", error);

    return {
      points: 0,
      completed_lessons: 0,
      completed_courses: 0,
      in_progress_lessons: 0,
      average_score: 0,
    };
  }
}
