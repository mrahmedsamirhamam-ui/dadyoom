import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCorrectAnswerSpec,
} from "@/lib/lesson-activities/grading";


type RequestBody = {
  activityId?: string;

  /*
   * الإجابة ترسل دائمًا كمصفوفة strings.
   *
   * multiple_choice:
   * ["الأسرة"]
   *
   * multi select:
   * ["بيض", "بطاطا", ...]
   *
   * matching:
   * ["left|||right", ...]
   *
   * fill_blank:
   * ["أنا", "أنت"]
   *
   * completion activity:
   * ["__completed__"]
   */
  answer?: string[];
};

type JsonRecord = Record<string, unknown>;

function stringArray(
  value: unknown
): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string"
      )
    : [];
}

function normalize(
  values: string[]
): string[] {
  return values
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean);
}

function sameOrdered(
  a: string[],
  b: string[]
): boolean {
  return (
    a.length === b.length &&
    a.every(
      (value, index) =>
        value === b[index]
    )
  );
}

function sameUnordered(
  a: string[],
  b: string[]
): boolean {
  const aa =
    [...a].sort();

  const bb =
    [...b].sort();

  return sameOrdered(
    aa,
    bb
  );
}

function getAnswerRecord(
  value: unknown
): JsonRecord {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as JsonRecord;
  }

  return {};
}

export async function POST(
  request: Request
) {
  try {

    const body =
      (await request.json()) as RequestBody;

    const activityId =
      typeof body.activityId ===
      "string"
        ? body.activityId.trim()
        : "";

    const studentAnswer =
      normalize(
        stringArray(
          body.answer
        )
      );

    if (
      !activityId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "معرّف النشاط غير موجود.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      await createClient();

    const {
      data: {
        user,
      },
    } =
      await supabase.auth.getUser();

    if (
      !user
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "سجّل الدخول أولًا.",
        },
        {
          status: 401,
        }
      );
    }


    // ========================================================
    // النشاط الحالي
    // ========================================================

    const {
      data: activity,
      error:
        activityError,
    } =
      await supabase
        .from(
          "lesson_activities"
        )
        .select(
          "id,lesson_id,activity_type,answer,points,is_published"
        )
        .eq(
          "id",
          activityId
        )
        .eq(
          "is_published",
          true
        )
        .maybeSingle();

    if (
      activityError
    ) {
      throw activityError;
    }

    if (
      !activity
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "النشاط غير موجود.",
        },
        {
          status: 404,
        }
      );
    }


    const answerData =
      getAnswerRecord(
        activity.answer
      );

    const correctSpec =
      getCorrectAnswerSpec(
        answerData
      );


    // ========================================================
    // هل النشاط قابل للتصحيح؟
    // ========================================================

    const isGradable =
      correctSpec !== null;

    const completionOnly =
      !isGradable;


    let isCorrect =
      false;

    if (
      completionOnly
    ) {

      isCorrect =
        studentAnswer.includes(
          "__completed__"
        );

    } else if (
      correctSpec
    ) {

      switch (
        correctSpec.mode
      ) {

        case "unordered":

          isCorrect =
            sameUnordered(
              studentAnswer,
              correctSpec.values
            );

          break;


        case "ordered":

          isCorrect =
            sameOrdered(
              studentAnswer,
              correctSpec.values
            );

          break;


        case "matching":

          isCorrect =
            sameUnordered(
              studentAnswer,
              correctSpec.values
            );

          break;


        case "single_letter":

          isCorrect =
            (
              studentAnswer.length ===
                1 &&
              studentAnswer[0] ===
                correctSpec.values[0]
            );

          break;
      }
    }


    const maxPoints =
      Number(
        activity.points ??
        0
      );

    /*
     * الأنشطة completion-only لا تدخل في الدرجة الأكاديمية.
     * earned_points فيها = 0.
     *
     * سيتم احتسابها في progress_percent فقط.
     */
    const earnedPoints =
      isGradable &&
      isCorrect
        ? maxPoints
        : 0;


    // ========================================================
    // رقم المحاولة
    // ========================================================

    const {
      data:
        previousAttempts,
      error:
        attemptsError,
    } =
      await supabase
        .from(
          "lesson_activity_attempts"
        )
        .select(
          "attempt_number"
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "activity_id",
          activityId
        )
        .order(
          "attempt_number",
          {
            ascending:
              false,
          }
        )
        .limit(1);

    if (
      attemptsError
    ) {
      throw attemptsError;
    }

    const lastAttempt =
      Array.isArray(
        previousAttempts
      ) &&
      previousAttempts.length > 0
        ? Number(
            previousAttempts[0]
              .attempt_number ??
            0
          )
        : 0;

    const nextAttemptNumber =
      lastAttempt + 1;


    // ========================================================
    // حفظ المحاولة
    // ========================================================

    const {
      error:
        insertError,
    } =
      await supabase
        .from(
          "lesson_activity_attempts"
        )
        .insert({
          user_id:
            user.id,

          activity_id:
            activityId,

          selected_answer:
            studentAnswer,

          is_correct:
            isCorrect,

          earned_points:
            earnedPoints,

          max_points:
            isGradable
              ? maxPoints
              : 0,

          attempt_number:
            nextAttemptNumber,
        });

    if (
      insertError
    ) {
      throw insertError;
    }


    // ========================================================
    // كل أنشطة الدرس
    // ========================================================

    const {
      data:
        lessonActivities,
      error:
        lessonActivitiesError,
    } =
      await supabase
        .from(
          "lesson_activities"
        )
        .select(
          "id,answer,points"
        )
        .eq(
          "lesson_id",
          activity.lesson_id
        )
        .eq(
          "is_published",
          true
        )
        .order(
          "activity_order",
          {
            ascending:
              true,
          }
        );

    if (
      lessonActivitiesError
    ) {
      throw lessonActivitiesError;
    }

    const allActivities =
      lessonActivities ??
      [];

    const allActivityIds =
      allActivities.map(
        (item) =>
          item.id
      );


    // ========================================================
    // جميع المحاولات
    // ========================================================

    const {
      data:
        allAttempts,
      error:
        allAttemptsError,
    } =
      await supabase
        .from(
          "lesson_activity_attempts"
        )
        .select(
          "activity_id,is_correct,earned_points,max_points,answered_at"
        )
        .eq(
          "user_id",
          user.id
        )
        .in(
          "activity_id",
          allActivityIds
        );

    if (
      allAttemptsError
    ) {
      throw allAttemptsError;
    }


    const attempts =
      allAttempts ??
      [];


    // ========================================================
    // إنجاز الأنشطة
    // ========================================================

    const completedActivityIds =
      new Set<string>();

    for (
      const attempt
      of attempts
    ) {
      if (
        attempt.is_correct
      ) {
        completedActivityIds.add(
          attempt.activity_id
        );
      }
    }

    const completedActivities =
      completedActivityIds.size;

    const totalActivities =
      allActivities.length;

    const progressPercent =
      totalActivities > 0
        ? Math.round(
            (
              completedActivities /
              totalActivities
            ) *
              100
          )
        : 0;


    // ========================================================
    // Score من الأنشطة القابلة للتصحيح فقط
    // ========================================================

    const gradableActivities =
      allActivities
        .map(
          (item) => ({
            ...item,

            correctSpec:
              getCorrectAnswerSpec(
                getAnswerRecord(
                  item.answer
                )
              ),
          })
        )
        .filter(
          (
            item
          ) =>
            item.correctSpec !==
            null
        );


    const bestEarnedByActivity =
      new Map<
        string,
        number
      >();

    for (
      const attempt
      of attempts
    ) {

      const previous =
        bestEarnedByActivity.get(
          attempt.activity_id
        ) ??
        0;

      const current =
        Number(
          attempt.earned_points ??
          0
        );

      if (
        current >
        previous
      ) {
        bestEarnedByActivity.set(
          attempt.activity_id,
          current
        );
      }
    }


    const totalPossible =
      gradableActivities.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.points ??
            0
          ),
        0
      );

    const totalEarned =
      gradableActivities.reduce(
        (
          total,
          item
        ) =>
          total +
          (
            bestEarnedByActivity.get(
              item.id
            ) ??
            0
          ),
        0
      );


    const currentScore =
      totalPossible > 0
        ? Math.round(
            (
              totalEarned /
              totalPossible
            ) *
              100
          )
        : 0;


    // ========================================================
    // Student Lesson Progress
    // ========================================================

    const {
      data:
        existingProgress,
      error:
        progressReadError,
    } =
      await supabase
        .from(
          "student_lesson_progress"
        )
        .select(
          "id,best_score,attempts,status"
        )
        .eq(
          "student_id",
          user.id
        )
        .eq(
          "lesson_id",
          activity.lesson_id
        )
        .maybeSingle();

    if (
      progressReadError
    ) {
      throw progressReadError;
    }


    const previousBest =
      Number(
        existingProgress
          ?.best_score ??
        0
      );

    const newBest =
      Math.max(
        previousBest,
        currentScore
      );


    /*
     * لا نغيّر status إلى completed/mastered هنا.
     *
     * CompleteLesson الحالي هو المسؤول عن:
     * - completion
     * - mastery
     * - XP
     */
    const progressValues = {
      status:
        "in_progress",

      progress_percent:
        progressPercent,

      last_score:
        currentScore,

      best_score:
        newBest,

      attempts:
        Number(
          existingProgress
            ?.attempts ??
          0
        ) + 1,

      updated_at:
        new Date()
          .toISOString(),
    };


    if (
      existingProgress
    ) {

      const {
        error:
          progressUpdateError,
      } =
        await supabase
          .from(
            "student_lesson_progress"
          )
          .update(
            progressValues
          )
          .eq(
            "id",
            existingProgress.id
          );

      if (
        progressUpdateError
      ) {
        throw progressUpdateError;
      }

    } else {

      const {
        error:
          progressInsertError,
      } =
        await supabase
          .from(
            "student_lesson_progress"
          )
          .insert({
            student_id:
              user.id,

            lesson_id:
              activity.lesson_id,

            ...progressValues,

            xp:
              0,

            time_spent_seconds:
              0,

            started_at:
              new Date()
                .toISOString(),
          });

      if (
        progressInsertError
      ) {
        throw progressInsertError;
      }
    }


    return NextResponse.json({
      success: true,

      correct:
        isCorrect,

      gradable:
        isGradable,

      completionOnly,

      earnedPoints,

      maxPoints:
        isGradable
          ? maxPoints
          : 0,

      attemptNumber:
        nextAttemptNumber,

      lessonScore:
        currentScore,

      bestLessonScore:
        newBest,

      completedActivities,

      totalActivities,

      progressPercent,
    });

  } catch (error) {

    console.error(
      "Activity checking error:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          "تعذر تصحيح أو حفظ النشاط.",
      },
      {
        status: 500,
      }
    );
  }
}
