import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authorize: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/require-curriculum-admin", () => ({
  authorizeCurriculumAdmin: mocks.authorize,
}));

import { GET as qualityAudit } from "@/app/api/admin/lessons/quality-audit/route";
import { GET as runtimeAudit } from "@/app/api/admin/lessons/runtime-audit/route";

const lessonId = "11111111-1111-4111-8111-111111111111";
const lesson = {
  id: lessonId,
  title: "درس تجريبي",
  lesson_number: 1,
  source_page_start: null,
  source_page_end: null,
};

function makeActivity(index: number) {
  return {
    id: String(index).padStart(8, "0") + "-1111-4111-8111-111111111111",
    lesson_id: lessonId,
    activity_order: index,
    title: "نشاط تعليمي",
    activity_type: "reading",
    content: {},
    answer: {},
    is_published: false,
    points: 0,
  };
}

function mockAdminDatabase(options: {
  activities: ReturnType<typeof makeActivity>[];
  cap: number;
  mutateCount?: boolean;
}) {
  const offsets = { lessons: [] as number[], lesson_activities: [] as number[] };
  mocks.authorize.mockImplementation(async () => ({
    authorized: true,
    supabase: {
      from: (table: string) => {
        if (table !== "lessons" && table !== "lesson_activities") {
          throw new Error("unexpected admin query: " + table);
        }
        const rows = table === "lessons" ? [lesson] : options.activities;
        const query = {
          select: (_columns: string, settings: { count?: string }) => {
            expect(settings?.count).toBe("exact");
            return query;
          },
          order: () => query,
          range: (from: number, to: number) => {
            offsets[table].push(from);
            return Promise.resolve({
              data: rows.slice(from, Math.min(to + 1, from + options.cap)),
              count: options.mutateCount && from > 0 ? rows.length + 1 : rows.length,
              error: null,
            });
          },
        };
        return query;
      },
    },
  }));
  return offsets;
}

beforeEach(() => vi.clearAllMocks());

describe("admin activity reports must not silently stop at PostgREST max rows", () => {
  it("audits over 1,000 activities across actual capped result pages", async () => {
    const activities = Array.from({ length: 1205 }, (_, index) => makeActivity(index));
    const offsets = mockAdminDatabase({ activities, cap: 73 });

    const qualityResponse = await qualityAudit();
    const runtimeResponse = await runtimeAudit();

    expect(qualityResponse.status).toBe(200);
    expect(runtimeResponse.status).toBe(200);
    const quality = await qualityResponse.json();
    const runtime = await runtimeResponse.json();
    expect(quality.summary.totalLessons).toBe(1);
    expect(quality.summary.totalActivities).toBe(1205);
    expect(runtime.summary.totalActivities).toBe(1205);
    expect(runtime.summary.published).toBe(0);
    expect(runtime.summary.unpublished).toBe(1205);
    // Both endpoints must advance by the actual capped row count (73).
    expect(offsets.lesson_activities).toContain(73);
    expect(offsets.lesson_activities).toContain(1168);
    expect(offsets.lesson_activities.filter((n) => n === 0)).toHaveLength(2);
  });

  it("fails closed rather than reporting a clean but inconsistent count", async () => {
    const activities = Array.from({ length: 4 }, (_, index) => makeActivity(index));
    mockAdminDatabase({ activities, cap: 2, mutateCount: true });
    const qualityResponse = await qualityAudit();
    const runtimeResponse = await runtimeAudit();
    expect(qualityResponse.status).toBe(500);
    expect(runtimeResponse.status).toBe(500);
    const quality = await qualityResponse.json();
    const runtime = await runtimeResponse.json();
    expect(quality.ok).toBe(false);
    expect(runtime.ok).toBe(false);
  });
});
