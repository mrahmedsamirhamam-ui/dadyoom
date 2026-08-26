import {
  getLatestAssessmentAnalytics,
} from "./getLatestAssessmentAnalytics";

const ANALYTICS_TTL_MS =
  30 * 1000;

type AnalyticsParams =
  Parameters<
    typeof getLatestAssessmentAnalytics
  >[0];

type AnalyticsResult =
  Awaited<
    ReturnType<
      typeof getLatestAssessmentAnalytics
    >
  >;

type CacheEntry = {
  expiresAt: number;
  data: AnalyticsResult;
};

const analyticsCache =
  new Map<string, CacheEntry>();

export async function getLatestAssessmentAnalyticsCached(
  params: AnalyticsParams
): Promise<AnalyticsResult> {
  const studentId =
    (
      params as {
        studentId: string;
      }
    ).studentId;

  const cached =
    analyticsCache.get(studentId);

  if (
    cached &&
    cached.expiresAt > Date.now()
  ) {
    console.info(
      "ASSESSMENT_ANALYTICS_CACHE_HIT",
      {
        studentId,
      }
    );

    return cached.data;
  }

  console.info(
    "ASSESSMENT_ANALYTICS_CACHE_MISS",
    {
      studentId,
    }
  );

  const data =
    await getLatestAssessmentAnalytics(
      params
    );

  analyticsCache.set(
    studentId,
    {
      data,
      expiresAt:
        Date.now() +
        ANALYTICS_TTL_MS,
    }
  );

  return data;
}

export function invalidateAssessmentAnalytics(
  studentId: string
) {
  analyticsCache.delete(studentId);
}
