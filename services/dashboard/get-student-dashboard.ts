import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient =
  Awaited<ReturnType<typeof createClient>>;

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

export type DashboardLesson = {
  id: string;
  title: string;
  objective: string | null;
  estimatedMinutes: number;
  points: number;
  completed: boolean;
  progressPercent: number;
  status:
    | "not_started"
    | "in_progress"
    | "completed"
    | "mastered";
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
  user: User | null
): Promise<StudentDashboardData> {
  if (!user) {
    redirect("/login");
  }

  const [
    profileResult,
    lessonsResult,
    progressResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("lessons")
      .select(`
        id,
        title,
        estimated_minutes,
        lesson_number
      `)
      .eq("status", "published")
      .order("lesson_number", {
        ascending: true,
      }),

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
      .order("updated_at", {
        ascending: false,
      }),
  ]);

  if (lessonsResult.error) {
    console.warn(
      "DASHBOARD_LESSONS_WARNING",
      lessonsResult.error.message
    );
  }

  if (progressResult.error) {
    console.warn(
      "DASHBOARD_PROGRESS_WARNING",
      progressResult.error.message
    );
  }

  const lessonRows =
    (lessonsResult.data ?? []) as LessonRow[];

  const progressRows =
    (progressResult.data ?? []) as ProgressRow[];

  const progressByLesson =
    new Map<string, ProgressRow>();

  for (const row of progressRows) {
    progressByLesson.set(
      row.lesson_id,
      row
    );
  }

  const lessons: DashboardLesson[] =
    lessonRows.map((lesson) => {
      const progress =
        progressByLesson.get(lesson.id);

      const rawStatus =
        progress?.status ??
        "not_started";

      const status: DashboardLesson["status"] =
        rawStatus === "mastered"
          ? "mastered"
          : rawStatus === "completed"
          ? "completed"
          : rawStatus === "in_progress"
          ? "in_progress"
          : "not_started";

      const completed =
        status === "completed" ||
        status === "mastered";

      return {
        id: lesson.id,
        title:
          lesson.title ??
          "درس بدون عنوان",
        objective: null,
        estimatedMinutes:
          Number(
            lesson.estimated_minutes ??
            10
          ),
        points:
          Number(
            progress?.xp ??
            0
          ),
        completed,
        progressPercent:
          Number(
            progress?.progress_percent ??
            0
          ),
        status,
      };
    });

  const completedRows =
    progressRows.filter(
      (row) =>
        row.status === "completed" ||
        row.status === "mastered"
    );

  const points =
    progressRows.reduce(
      (sum, row) =>
        sum +
        Number(row.xp ?? 0),
      0
    );

  const scores =
    completedRows
      .map((row) =>
        Number(
          row.best_score ??
          row.last_score ??
          0
        )
      )
      .filter(
        (score) =>
          Number.isFinite(score) &&
          score > 0
      );

  const averageScore =
    scores.length > 0
      ? Math.round(
          scores.reduce(
            (sum, score) =>
              sum + score,
            0
          ) / scores.length
        )
      : 0;

  const completedLessons =
    lessons.filter(
      (lesson) =>
        lesson.completed
    ).length;

  const totalLessons =
    lessons.length;

  const progressPercent =
    totalLessons > 0
      ? Math.round(
          (
            completedLessons /
            totalLessons
          ) * 100
        )
      : 0;

  const inProgressLesson =
    lessons.find(
      (lesson) =>
        lesson.status ===
        "in_progress"
    );

  const firstUnfinishedLesson =
    lessons.find(
      (lesson) =>
        !lesson.completed
    );

  const continueLesson =
    inProgressLesson ??
    firstUnfinishedLesson ??
    null;

  const studentName =
    (
      profileResult.data as
        | {
            full_name?: string | null;
          }
        | null
    )?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "طالب ضاديوم";

  return {
    studentName,
    completedLessons,
    totalLessons,
    progressPercent,
    points,
    averageScore,
    badgesCount: 0,
    latestBadge: null,
    continueLesson,
    lessons,
  };
}