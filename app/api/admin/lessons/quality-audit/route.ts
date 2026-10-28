import {
  NextResponse,
} from "next/server";

import { authorizeCurriculumAdmin } from "@/lib/auth/require-curriculum-admin";
import { readCompleteGradingPages } from "@/lib/lesson-activities/read-complete-pages";

export const dynamic = "force-dynamic";

import {
  validateActivity,
} from "@/lib/lesson-ai/activity-validator";

type ActivityRow = {
  id: string;
  lesson_id: string;
  title: string | null;
  activity_type: string | null;
  activity_order: number | null;
  content: unknown;
  answer: unknown;
  is_published: boolean | null;
};

type LessonRow = {
  id: string;
  title: string;
  lesson_number: number | null;
  source_page_start: number | null;
  source_page_end: number | null;
};

export async function GET() {
  try {
    const access = await authorizeCurriculumAdmin();
    if (!access.authorized) return access.response;
    const { supabase } = access;

    // A naked PostgREST select is capped (commonly at 1,000 rows). This
    // admin report must never call a partial 1,000/24,000 activity read clean.
    // Reuse the complete, count-verified paging guard, ordered by stable ID.
    // If rows change midway or exceed the explicit safety bound, fail closed.
    const lessons = await readCompleteGradingPages<LessonRow>({
      pageSize: 800,
      maxRows: 50000,
      readPage: async (offset, limit) => {
        const { data, count, error } = await supabase
          .from("lessons")
          .select("id,title,lesson_number,source_page_start,source_page_end", { count: "exact" })
          .order("id", { ascending: true })
          .range(offset, offset + limit - 1);
        return { data: data as LessonRow[] | null, count, error };
      },
    });

    const activities = await readCompleteGradingPages<ActivityRow>({
      pageSize: 800,
      maxRows: 50000,
      readPage: async (offset, limit) => {
        const { data, count, error } = await supabase
          .from("lesson_activities")
          .select(
            "id,lesson_id,title,activity_type,activity_order,content,answer,is_published",
            { count: "exact" },
          )
          .order("id", { ascending: true })
          .range(offset, offset + limit - 1);
        return { data: data as ActivityRow[] | null, count, error };
      },
    });

    const lessonMap =
      new Map(
        lessons.map(
          (lesson) => [
            lesson.id,
            lesson,
          ]
        )
      );

    let cleanCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    const results =
      activities.map(
        (activity) => {
          const validation =
            validateActivity({
              title:
                activity.title,
              activity_type:
                activity.activity_type,
              content:
                activity.content,
              answer:
                activity.answer,
            });

          const lesson =
            lessonMap.get(
              activity.lesson_id
            );

          const errors =
            validation.issues.filter(
              (issue) =>
                issue.level ===
                "error"
            );

          const warnings =
            validation.issues.filter(
              (issue) =>
                issue.level ===
                "warning"
            );

          let status:
            | "clean"
            | "warning"
            | "error";

          if (
            errors.length > 0
          ) {
            status = "error";
            errorCount++;
          } else if (
            warnings.length > 0
          ) {
            status = "warning";
            warningCount++;
          } else {
            status = "clean";
            cleanCount++;
          }

          const content =
            activity.content &&
            typeof activity.content ===
              "object" &&
            !Array.isArray(
              activity.content
            )
              ? activity.content as Record<
                  string,
                  unknown
                >
              : {};

          const sourcePage =
            typeof content.source_page ===
              "number"
              ? content.source_page
              : null;

          return {
            activityId:
              activity.id,

            activityOrder:
              activity.activity_order,

            activityTitle:
              activity.title,

            activityType:
              activity.activity_type,

            isPublished:
              activity.is_published,

            lessonId:
              activity.lesson_id,

            lessonNumber:
              lesson?.lesson_number ??
              null,

            lessonTitle:
              lesson?.title ??
              "درس غير معروف",

            sourcePage,

            status,

            score:
              validation.score,

            validForPublish:
              validation.validForPublish,

            issues:
              validation.issues,
          };
        }
      );

    const problemActivities =
      results.filter(
        (item) =>
          item.status !==
          "clean"
      );

    problemActivities.sort(
      (a, b) => {
        if (
          a.status !==
          b.status
        ) {
          return a.status ===
            "error"
            ? -1
            : 1;
        }

        return (
          (a.lessonNumber ??
            9999) -
            (b.lessonNumber ??
              9999) ||
          (a.activityOrder ??
            9999) -
            (b.activityOrder ??
              9999)
        );
      }
    );

    return NextResponse.json({
      ok: true,

      summary: {
        totalLessons:
          lessons.length,

        totalActivities:
          activities.length,

        clean:
          cleanCount,

        warnings:
          warningCount,

        errors:
          errorCount,

        needsAttention:
          warningCount +
          errorCount,
      },

      problemActivities,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error(
      "CURRICULUM_QUALITY_AUDIT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "تعذر فحص جودة المنهج.",
      },
      {
        status: 500,
      }
    );
  }
}
