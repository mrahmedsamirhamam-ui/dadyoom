import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient =
  Awaited<ReturnType<typeof createClient>>;

export type RecommendedLesson = {
  id: string;
  title: string;
  lesson_number: number;
};

type CachedRecommendation = {
  id: string;
  title: string;
  lesson_number: number;
};

const RECOMMENDATION_CACHE_TTL_MS =
  10 * 60 * 1000;

function normalizeTargetSkill(
  targetSkill?: string
): string {
  const normalized =
    targetSkill?.trim();

  return normalized || "__general__";
}

function isRecommendedLesson(
  value: unknown
): value is RecommendedLesson {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const item =
    value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.lesson_number === "number"
  );
}

export async function getRecommendedLessons(
  studentId: string,
  targetSkill?: string,
  supabaseClient?: ServerSupabaseClient
): Promise<RecommendedLesson[]> {
  const supabase =
    supabaseClient ??
    (await createClient());

  const normalizedTargetSkill =
    normalizeTargetSkill(targetSkill);

  const now =
    new Date();

  /*
   * نجلب تقدم الطالب والكاش بالتوازي.
   * في حالة Cache Hit لا نحتاج للبحث
   * في lesson_skills ثم lessons من جديد.
   */
  const [
    progressResult,
    cacheResult,
  ] = await Promise.all([
    supabase
      .from("student_lesson_progress")
      .select("lesson_id")
      .eq(
        "student_id",
        studentId
      ),

    supabase
      .from(
        "student_recommendation_cache"
      )
      .select(
        "recommendations, expires_at"
      )
      .eq(
        "student_id",
        studentId
      )
      .eq(
        "target_skill",
        normalizedTargetSkill
      )
      .maybeSingle(),
  ]);

  if (progressResult.error) {
    throw progressResult.error;
  }

  if (cacheResult.error) {
    console.warn(
      "SMART_RECOMMENDATIONS_CACHE_WARNING",
      cacheResult.error
    );
  }

  const startedLessonIds =
    new Set(
      (progressResult.data ?? [])
        .map(
          (item) =>
            item.lesson_id
        )
        .filter(
          (
            lessonId
          ): lessonId is string =>
            typeof lessonId === "string"
        )
    );

  const cached =
    cacheResult.data;

  /*
   * Cache Hit:
   * نتحقق من الصلاحية ثم نستبعد
   * أي درس بدأه الطالب منذ إنشاء الكاش.
   */
  if (
    cached &&
    typeof cached.expires_at ===
      "string" &&
    new Date(
      cached.expires_at
    ).getTime() > now.getTime() &&
    Array.isArray(
      cached.recommendations
    )
  ) {
    const cachedLessons =
      cached.recommendations
        .filter(isRecommendedLesson)
        .filter(
          (lesson) =>
            !startedLessonIds.has(
              lesson.id
            )
        )
        .slice(0, 5);

    console.info(
      "SMART_RECOMMENDATIONS_CACHE_HIT",
      {
        targetSkill:
          normalizedTargetSkill,
        count:
          cachedLessons.length,
      }
    );

    return cachedLessons;
  }

  console.info(
    "SMART_RECOMMENDATIONS_CACHE_MISS",
    {
      targetSkill:
        normalizedTargetSkill,
    }
  );

  /*
   * في حالة وجود مهارة مستهدفة:
   * نبحث عن الدروس المرتبطة بها.
   */
  let skillLessonIds:
    string[] | null = null;

  if (
    normalizedTargetSkill !==
    "__general__"
  ) {
    const {
      data: skillRows,
      error: skillError,
    } = await supabase
      .from("lesson_skills")
      .select("lesson_id")
      .eq(
        "skill",
        normalizedTargetSkill
      );

    if (skillError) {
      throw skillError;
    }

    skillLessonIds =
      (skillRows ?? [])
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

    console.info(
      "SMART_RECOMMENDATIONS_SKILL_MATCH",
      {
        targetSkill:
          normalizedTargetSkill,
        lessonIds:
          skillLessonIds,
      }
    );
  }

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

  /*
   * إذا وجدنا دروسًا مرتبطة بالمهارة،
   * نقصر البحث عليها.
   *
   * إذا لم نجد أي mapping للمهارة،
   * نستخدم fallback إلى الدروس المنشورة.
   */
  if (
    skillLessonIds &&
    skillLessonIds.length > 0
  ) {
    query =
      query.in(
        "id",
        skillLessonIds
      );
  }

  if (
    startedLessonIds.size > 0
  ) {
    query =
      query.not(
        "id",
        "in",
        `(${[
          ...startedLessonIds,
        ].join(",")})`
      );
  }

  const {
    data: lessons,
    error: lessonsError,
  } = await query;

  if (lessonsError) {
    throw lessonsError;
  }

  const recommendations =
    (lessons ?? [])
      .filter(
        (lesson) =>
          typeof lesson.id ===
            "string" &&
          typeof lesson.title ===
            "string" &&
          typeof lesson.lesson_number ===
            "number"
      )
      .map(
        (lesson) => ({
          id: lesson.id,
          title: lesson.title,
          lesson_number:
            lesson.lesson_number,
        })
      ) as CachedRecommendation[];

  /*
   * نحفظ النتيجة لمدة 10 دقائق.
   */
  const expiresAt =
    new Date(
      Date.now() +
        RECOMMENDATION_CACHE_TTL_MS
    ).toISOString();

  const {
    error: cacheWriteError,
  } = await supabase
    .from(
      "student_recommendation_cache"
    )
    .upsert(
      {
        student_id:
          studentId,

        target_skill:
          normalizedTargetSkill,

        recommendations,

        expires_at:
          expiresAt,

        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "student_id,target_skill",
      }
    );

  if (cacheWriteError) {
    /*
     * فشل الكاش لا يجب أن يمنع
     * ظهور التوصيات للطالب.
     */
    console.warn(
      "SMART_RECOMMENDATIONS_CACHE_WRITE_WARNING",
      cacheWriteError
    );
  }

  return recommendations;
}
