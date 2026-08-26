import { createClient } from "@/lib/supabase/server";

import {
  getStudentStatistics,
} from "./statistics";

import {
  getContinueLesson,
} from "./continue-learning";

type ServerSupabaseClient =
  Awaited<ReturnType<typeof createClient>>;

type StatisticsResult =
  Awaited<
    ReturnType<typeof getStudentStatistics>
  >;

type ContinueLessonResult =
  Awaited<
    ReturnType<typeof getContinueLesson>
  >;

type ProgressBundle = {
  stats: StatisticsResult;
  continueLesson: ContinueLessonResult;
  completedLessonsCount: number;
};

type CacheEntry = {
  expiresAt: number;
  data: ProgressBundle;
};

const PROGRESS_CACHE_TTL_MS =
  30 * 1000;

const progressCache =
  new Map<string, CacheEntry>();

export async function getStudentProgressBundleCached(
  studentId: string,
  supabase: ServerSupabaseClient
): Promise<ProgressBundle> {
  const cached =
    progressCache.get(studentId);

  if (
    cached &&
    cached.expiresAt > Date.now()
  ) {
    console.info(
      "STUDENT_PROGRESS_BUNDLE_CACHE_HIT",
      {
        studentId,
      }
    );

    return cached.data;
  }

  console.info(
    "STUDENT_PROGRESS_BUNDLE_CACHE_MISS",
    {
      studentId,
    }
  );

  const [
    stats,
    continueLesson,
    completedCountResult,
  ] = await Promise.all([
    getStudentStatistics(
      studentId,
      supabase
    ),

    getContinueLesson(
      studentId,
      supabase
    ),

    supabase
      .from("student_lesson_progress")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "student_id",
        studentId
      )
      .in(
        "status",
        [
          "completed",
          "mastered",
        ]
      ),
  ]);

  if (completedCountResult.error) {
    console.warn(
      "STUDENT_COMPLETED_COUNT_WARNING",
      completedCountResult.error
    );
  }

  const data: ProgressBundle = {
    stats,

    continueLesson,

    completedLessonsCount:
      completedCountResult.count ?? 0,
  };

  progressCache.set(
    studentId,
    {
      data,
      expiresAt:
        Date.now() +
        PROGRESS_CACHE_TTL_MS,
    }
  );

  return data;
}

export function invalidateStudentProgressBundleCache(
  studentId: string
) {
  progressCache.delete(
    studentId
  );
}
