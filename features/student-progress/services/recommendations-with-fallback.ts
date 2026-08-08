import { createClient } from "@/lib/supabase/server";

import {
  getRecommendedLessons,
  type RecommendedLesson,
} from "./recommendations";

type ServerSupabaseClient =
  Awaited<ReturnType<typeof createClient>>;

type CacheEntry = {
  expiresAt: number;
  lessons: RecommendedLesson[];
};

const FALLBACK_TTL_MS =
  10 * 60 * 1000;

const fallbackCache =
  new Map<string, CacheEntry>();

export async function getRecommendedLessonsWithFallback(
  studentId: string,
  targetSkill?: string,
  supabaseClient?: ServerSupabaseClient
): Promise<RecommendedLesson[]> {
  const supabase =
    supabaseClient ??
    (await createClient());

  /*
   * أولًا نستخدم المحرك الذكي الحالي.
   */
  const smartLessons =
    await getRecommendedLessons(
      studentId,
      targetSkill,
      supabase
    );

  if (smartLessons.length > 0) {
    return smartLessons;
  }

  /*
   * إذا لم توجد توصية للمهارة
   * نستخدم fallback بدل إظهار صفر دروس.
   */
  const normalizedSkill =
    targetSkill?.trim() ||
    "__general__";

  const cacheKey =
    `${studentId}:${normalizedSkill}`;

  const cached =
    fallbackCache.get(cacheKey);

  if (
    cached &&
    cached.expiresAt > Date.now()
  ) {
    console.info(
      "SMART_RECOMMENDATIONS_FALLBACK_CACHE_HIT",
      {
        targetSkill:
          normalizedSkill,
        count:
          cached.lessons.length,
      }
    );

    return cached.lessons;
  }

  const {
    data: progress,
    error: progressError,
  } = await supabase
    .from(
      "student_lesson_progress"
    )
    .select("lesson_id")
    .eq(
      "student_id",
      studentId
    );

  if (progressError) {
    throw progressError;
  }

  const startedLessonIds =
    (progress ?? [])
      .map(
        (item) =>
          item.lesson_id
      )
      .filter(
        (
          lessonId
        ): lessonId is string =>
          typeof lessonId ===
          "string"
      );

  let query =
    supabase
      .from("lessons")
      .select(`
        id,
        title,
        lesson_number
      `)
      .eq(
        "status",
        "published"
      )
      .order(
        "lesson_number",
        {
          ascending: true,
        }
      )
      .limit(5);

  if (
    startedLessonIds.length > 0
  ) {
    query =
      query.not(
        "id",
        "in",
        `(${startedLessonIds.join(",")})`
      );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw error;
  }

  const fallbackLessons =
    (data ?? [])
      .filter(
        (
          lesson
        ): lesson is RecommendedLesson =>
          typeof lesson.id ===
            "string" &&
          typeof lesson.title ===
            "string" &&
          typeof lesson.lesson_number ===
            "number"
      );

  fallbackCache.set(
    cacheKey,
    {
      lessons:
        fallbackLessons,

      expiresAt:
        Date.now() +
        FALLBACK_TTL_MS,
    }
  );

  console.info(
    "SMART_RECOMMENDATIONS_FALLBACK",
    {
      targetSkill:
        normalizedSkill,

      count:
        fallbackLessons.length,
    }
  );

  return fallbackLessons;
}

export function invalidateRecommendationFallback(
  studentId: string
) {
  for (
    const key of
    fallbackCache.keys()
  ) {
    if (
      key.startsWith(
        `${studentId}:`
      )
    ) {
      fallbackCache.delete(key);
    }
  }
}