import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

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
    const supabase =
      await createClient();

    const {
      data: lessonsData,
      error: lessonsError,
    } =
      await supabase
        .from("lessons")
        .select(`
          id,
          title,
          lesson_number,
          source_page_start,
          source_page_end
        `)
        .order(
          "lesson_number",
          {
            ascending: true,
          }
        );

    if (lessonsError) {
      throw lessonsError;
    }

    const {
      data: activitiesData,
      error: activitiesError,
    } =
      await supabase
        .from("lesson_activities")
        .select(`
          id,
          lesson_id,
          title,
          activity_type,
          activity_order,
          content,
          answer,
          is_published
        `)
        .order(
          "activity_order",
          {
            ascending: true,
          }
        );

    if (activitiesError) {
      throw activitiesError;
    }

    const lessons =
      (lessonsData ??
        []) as LessonRow[];

    const activities =
      (activitiesData ??
        []) as ActivityRow[];

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
    });
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
