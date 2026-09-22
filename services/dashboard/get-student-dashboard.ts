import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { getUnifiedGamificationXP } from "@/features/student-progress/services/unified-gamification";
import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type LessonRow = {
  id: string;
  title: string | null;
  estimated_minutes: number | null;
  lesson_number: number | null;
};

type ProgressRow = {
  lesson_id: string;
  status: string;
  progress_percent: number | null;
  best_score: number | null;
  last_score: number | null;
  xp: number | null;
  updated_at: string | null;
};

type AchievementRow = {
  id: string;
  title: string;
  icon: string | null;
  unlocked_at: string | null;
};

export type DashboardLesson = {
  id: string;
  title: string;
  objective: string | null;
  estimatedMinutes: number;
  points: number;
  completed: boolean;
  progressPercent: number;
  status: "not_started" | "in_progress" | "completed" | "mastered";
};

export type DashboardBadge = {
  id: string;
  title: string;
  icon: string | null;
  awardedAt: string | null;
};

export type StudentDashboardData = {
  studentName: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  points: number;
  averageScore: number;
  badgesCount: number;
  latestBadge: DashboardBadge | null;
  continueLesson: DashboardLesson | null;
  lessons: DashboardLesson[];
};

export async function getStudentDashboard(
  supabase: ServerSupabaseClient,
  user: User | null,
): Promise<StudentDashboardData> {
  if (!user) redirect("/login");

  const profileResult = await supabase
    .from("profiles")
    .select("full_name,role,country,grade_number")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileResult.data as
    | {
        full_name?: string | null;
        role?: string | null;
        country?: string | null;
        grade_number?: number | null;
      }
    | null;

  const role = profile?.role?.trim().toLowerCase() ?? "student";
  const gradeNumber = Number(profile?.grade_number);
  const countryCode = profile?.country?.trim().toUpperCase() || "BH";

  let lessonsQuery = supabase
    .from("lessons")
    .select(`
      id,
      title,
      estimated_minutes,
      lesson_number,
      units!inner(
        grades!inner(
          grade_number,
          curricula!inner(
            countries!inner(code)
          )
        )
      )
    `)
    .eq("status", "published")
    .order("lesson_number", { ascending: true });

  if (
    role === "student" &&
    Number.isInteger(gradeNumber) &&
    gradeNumber >= 1 &&
    gradeNumber <= 12
  ) {
    lessonsQuery = lessonsQuery
      .eq("units.grades.grade_number", gradeNumber)
      .eq("units.grades.curricula.countries.code", countryCode);
  }

  const [
    lessonsResult,
    progressResult,
    achievementsResult,
    unifiedXP,
  ] = await Promise.all([
    lessonsQuery,

    supabase
      .from("student_lesson_progress")
      .select(`
        lesson_id,
        status,
        progress_percent,
        best_score,
        last_score,
        xp,
        updated_at
      `)
      .eq("student_id", user.id)
      .order("updated_at", { ascending: false }),

    user.email
      ? supabase
          .from("student_achievements")
          .select("id,title,icon,unlocked_at")
          .eq("student_email", user.email)
          .order("unlocked_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),

    getUnifiedGamificationXP(user.id, supabase),
  ]);

  if (lessonsResult.error) {
    console.warn("DASHBOARD_LESSONS_WARNING", lessonsResult.error.message);
  }
  if (progressResult.error) {
    console.warn("DASHBOARD_PROGRESS_WARNING", progressResult.error.message);
  }
  if (achievementsResult.error) {
    console.warn("DASHBOARD_ACHIEVEMENTS_WARNING", achievementsResult.error.message);
  }

  const lessonRows = (lessonsResult.data ?? []) as LessonRow[];
  const progressRows = (progressResult.data ?? []) as ProgressRow[];
  const achievementRows = (achievementsResult.data ?? []) as AchievementRow[];

  const progressByLesson = new Map<string, ProgressRow>();
  for (const row of progressRows) progressByLesson.set(row.lesson_id, row);

  const lessons: DashboardLesson[] = lessonRows.map((lesson) => {
    const progress = progressByLesson.get(lesson.id);
    const rawStatus = progress?.status ?? "not_started";
    const status: DashboardLesson["status"] =
      rawStatus === "mastered"
        ? "mastered"
        : rawStatus === "completed"
          ? "completed"
          : rawStatus === "in_progress"
            ? "in_progress"
            : "not_started";

    return {
      id: lesson.id,
      title: lesson.title ?? "درس بدون عنوان",
      objective: null,
      estimatedMinutes: Number(lesson.estimated_minutes ?? 10),
      points: Number(progress?.xp ?? 0),
      completed: status === "completed" || status === "mastered",
      progressPercent: Number(progress?.progress_percent ?? 0),
      status,
    };
  });

  const completedRows = progressRows.filter(
    (row) => row.status === "completed" || row.status === "mastered",
  );

  const scores = completedRows
    .map((row) => Number(row.best_score ?? row.last_score ?? 0))
    .filter((score) => Number.isFinite(score) && score > 0);

  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

  const completedLessons = lessons.filter((lesson) => lesson.completed).length;
  const totalLessons = lessons.length;
  const progressPercent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const continueLesson =
    lessons.find((lesson) => lesson.status === "in_progress") ??
    lessons.find((lesson) => !lesson.completed) ??
    null;

  const studentName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "طالب ضاديوم";

  const latestAchievement = achievementRows[0] ?? null;

  return {
    studentName,
    completedLessons,
    totalLessons,
    progressPercent,
    points: unifiedXP.totalXP,
    averageScore,
    badgesCount: achievementRows.length,
    latestBadge: latestAchievement
      ? {
          id: latestAchievement.id,
          title: latestAchievement.title,
          icon: latestAchievement.icon,
          awardedAt: latestAchievement.unlocked_at,
        }
      : null,
    continueLesson,
    lessons,
  };
}
