import { createClient } from "@/lib/supabase/server";

import {
  invalidateLearningProfileSync,
} from "@/features/learning-profile/services/sync-profile-cached";

import {
  invalidateLearningProfileCache,
} from "@/features/learning-profile/services/profile-cached";

import {
  invalidateAssessmentAnalytics,
} from "@/features/assessment/services/getLatestAssessmentAnalyticsCached";

import {
  invalidateStudentDashboardCache,
} from "@/services/dashboard/get-student-dashboard-cached";

import {
  invalidateStudentMasteryCache,
} from "@/features/student-progress/services/mastery-cached";

import {
  invalidateStudentProgressBundleCache,
} from "@/features/student-progress/services/progress-bundle-cached";

import {
  invalidateRecommendationFallback,
} from "@/features/student-progress/services/recommendations-with-fallback";

type ServerSupabaseClient =
  Awaited<ReturnType<typeof createClient>>;

type InvalidateStudentCachesParams = {
  studentId: string;
  studentEmail?: string | null;
  supabase?: ServerSupabaseClient;
};

export async function invalidateStudentCaches({
  studentId,
  studentEmail,
  supabase: existingSupabase,
}: InvalidateStudentCachesParams) {
  /*
   * Memory caches
   */
  invalidateLearningProfileSync(
    studentId
  );

  invalidateLearningProfileCache(
    studentId
  );

  invalidateAssessmentAnalytics(
    studentId
  );

  invalidateStudentDashboardCache(
    studentId
  );

  invalidateStudentProgressBundleCache(
    studentId
  );

  invalidateRecommendationFallback(
    studentId
  );

  if (studentEmail) {
    invalidateStudentMasteryCache(
      studentEmail
    );
  }

  /*
   * Persistent recommendation cache.
   *
   * هذا يضمن أن التوصيات لا تبقى قديمة
   * بعد إكمال درس أو تقييم جديد.
   */
  const supabase =
    existingSupabase ??
    (await createClient());

  const {
    error: recommendationCacheError,
  } = await supabase
    .from(
      "student_recommendation_cache"
    )
    .delete()
    .eq(
      "student_id",
      studentId
    );

  if (recommendationCacheError) {
    console.warn(
      "STUDENT_RECOMMENDATION_CACHE_INVALIDATION_WARNING",
      recommendationCacheError
    );
  }

  console.info(
    "STUDENT_CACHES_INVALIDATED",
    {
      studentId,
      hasStudentEmail:
        Boolean(studentEmail),
    }
  );
}