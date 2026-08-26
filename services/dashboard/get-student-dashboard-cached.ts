import {
  getStudentDashboard,
} from "./get-student-dashboard";

type DashboardArgs =
  Parameters<typeof getStudentDashboard>;

type DashboardResult =
  Awaited<
    ReturnType<typeof getStudentDashboard>
  >;

type CacheEntry = {
  expiresAt: number;
  data: DashboardResult;
};

const DASHBOARD_CACHE_TTL_MS =
  30 * 1000;

const dashboardCache =
  new Map<string, CacheEntry>();

export async function getStudentDashboardCached(
  ...args: DashboardArgs
): Promise<DashboardResult> {
  const [, user] = args;

  const studentId =
    user?.id;

  if (!studentId) {
    return getStudentDashboard(
      ...args
    );
  }

  const cached =
    dashboardCache.get(
      studentId
    );

  if (
    cached &&
    cached.expiresAt > Date.now()
  ) {
    console.info(
      "STUDENT_DASHBOARD_CACHE_HIT",
      {
        studentId,
      }
    );

    return cached.data;
  }

  console.info(
    "STUDENT_DASHBOARD_CACHE_MISS",
    {
      studentId,
    }
  );

  const data =
    await getStudentDashboard(
      ...args
    );

  dashboardCache.set(
    studentId,
    {
      data,
      expiresAt:
        Date.now() +
        DASHBOARD_CACHE_TTL_MS,
    }
  );

  return data;
}

export function invalidateStudentDashboardCache(
  studentId: string
) {
  dashboardCache.delete(
    studentId
  );
}
