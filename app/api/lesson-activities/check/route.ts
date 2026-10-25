import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readBoundedJsonObject } from "@/lib/http/read-bounded-json";
import { insertSequencedActivityAttempt } from "@/lib/lesson-activities/attempt-sequencing";
import { commitActivityProgressWithRetry } from "@/lib/lesson-activities/progress-state";
import { scoreGradedActivityAttempts } from "@/features/lesson-mastery/services/score-graded-activities";
import { readCompleteGradingPages } from "@/lib/lesson-activities/read-complete-pages";
import {
  getCorrectAnswerSpec,
  parseStudentActivityAnswer,
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

    // Share the fail-closed, bounded UTF-8 JSON parser with stored-question
    // grading. Invalid UTF-8 must be 400, never a leaking 500 response.
    const parsed = await readBoundedJsonObject(request);
    if (!parsed.ok) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.status === 413
            ? "حجم الإجابة أكبر من الحد المسموح."
            : "صيغة الطلب غير صحيحة.",
        },
        { status: parsed.status }
      );
    }
    const body = parsed.value as RequestBody;

    const activityId =
      typeof body.activityId === "string"
        ? body.activityId.trim()
        : "";

    const studentAnswer = parseStudentActivityAnswer(body.answer);
    if (studentAnswer === null) {
      return NextResponse.json(
        { success: false, message: "الإجابة غير صالحة." },
        { status: 400 }
      );
    }

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


    // Student RLS must authorize activity and the published parent lesson.
    // Never obtain private answer-bearing rows through the caller's session.
    const { data: visibleActivity, error: visibilityError } = await supabase
      .from("lesson_activities")
      .select("id,lesson_id")
      .eq("id", activityId)
      .eq("is_published", true)
      .maybeSingle();

    if (visibilityError) throw visibilityError;
    if (!visibleActivity) {
      return NextResponse.json(
        { success: false, message: "النشاط غير موجود." },
        { status: 404 }
      );
    }

    const { data: visibleLesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id,status")
      .eq("id", visibleActivity.lesson_id)
      .maybeSingle();

    if (lessonError) throw lessonError;
    if (!visibleLesson || visibleLesson.status !== "published") {
      return NextResponse.json(
        { success: false, message: "الدرس غير متاح للتقويم." },
        { status: 404 }
      );
    }

    const admin = createAdminClient();
    const { data: activity, error: activityError } = await admin
      .from("lesson_activities")
      .select("id,lesson_id,activity_type,answer,points,is_published")
      .eq("id", visibleActivity.id)
      .eq("lesson_id", visibleActivity.lesson_id)
      .eq("is_published", true)
      .maybeSingle();

    if (activityError) throw activityError;
    if (!activity) {
      return NextResponse.json(
        { success: false, message: "النشاط غير موجود." },
        { status: 404 }
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

    // A UNIQUE(user_id,activity_id,attempt_number) constraint (staged
    // separately) is required for an actual concurrency guarantee. The
    // read-max/insert conflict is retried only for that exact constraint.
    // Database RPC staging gate. OFF until a separate, reviewed staging
    // migration and authenticated E2E acceptance. Default legacy path remains.
    const atomicReceiptReady =
      process.env.DADYOOM_ATOMIC_ACTIVITY_COMMIT === "enabled";
    let nextAttemptNumber = 0;
    if (!atomicReceiptReady) {
      nextAttemptNumber = await insertSequencedActivityAttempt({
        readLast: async () => {
          const { data, error } = await supabase
            .from("lesson_activity_attempts")
            .select("attempt_number")
            .eq("user_id", user.id)
            .eq("activity_id", activityId)
            .order("attempt_number", { ascending: false })
            .limit(1);
          if (error) throw error;
          return Number(data?.[0]?.attempt_number ?? 0);
        },
        insert: async (attemptNumber) => {
          const { error } = await admin
            .from("lesson_activity_attempts")
            .insert({
              user_id: user.id,
              activity_id: activityId,
              selected_answer: studentAnswer,
              is_correct: isCorrect,
              earned_points: earnedPoints,
              max_points: isGradable ? maxPoints : 0,
              attempt_number: attemptNumber,
            });
          return { error };
        },
      });

    }

    // ========================================================
    // كل أنشطة الدرس
    // ========================================================

    // Paging is essential: PostgREST may silently cap results to <1000.
    // Count and id-order guards refuse partial or drifting scoring inputs.
    const allActivities = await readCompleteGradingPages({
      readPage: async (offset, limit) => {
        const { data, count, error } = await admin
          .from("lesson_activities")
          .select("id,answer,points", { count: "exact" })
          .eq("lesson_id", activity.lesson_id)
          .eq("is_published", true)
          .order("id", { ascending: true })
          .range(offset, offset + limit - 1);
        return { data, count, error };
      },
    });
    const allActivityIds = allActivities.map((item) => item.id);
    if (!allActivityIds.includes(activityId)) {
      throw new Error("النشاط لم يعد ضمن الدرس المنشور.");
    }

    // Include unique primary key for stable pages but never return it to
    // the student. The student's own RLS client reads only this lesson.
    const savedAttempts = await readCompleteGradingPages({
      readPage: async (offset, limit) => {
        const { data, count, error } = await supabase
          .from("lesson_activity_attempts")
          .select("id,activity_id,is_correct,earned_points,max_points,answered_at", {
            count: "exact",
          })
          .eq("user_id", user.id)
          .in("activity_id", allActivityIds)
          .order("id", { ascending: true })
          .range(offset, offset + limit - 1);
        return { data, count, error };
      },
    });

    // ========================================================
    // Before the atomic RPC runs, include this server-validated attempt in
    // the score snapshot. The RPC then inserts it and increments progress
    // within one PostgreSQL transaction; a failed RPC persists neither.
    const attempts = atomicReceiptReady
      ? [...savedAttempts, {
          id: "pending-activity-attempt",
          activity_id: activityId,
          is_correct: isCorrect,
          earned_points: earnedPoints,
          max_points: isGradable ? maxPoints : 0,
          answered_at: new Date().toISOString(),
        }]
      : savedAttempts;

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


    // Use the same published-weight scoring rule as canonical mastery.
    // Historical attempts can carry older/higher point weights; those must
    // not push a learner above 100% after an activity is edited.
    const currentScore = scoreGradedActivityAttempts(
      gradableActivities.map((item) => ({
        id: item.id,
        points: item.points,
      })),
      attempts,
    ).score;

    // ========================================================
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
          "id,best_score,attempts,status,progress_percent"
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


    // A concurrent assessment may have changed the same row after our read.
    // Require a database CAS match, retry on conflicts, and count each saved
    // activity without ever resetting completed/mastered status or XP.
    if (atomicReceiptReady) {
      // No browser role receives EXECUTE. The RPC is service-role-only and
      // its INSERT + progress UPSERT either both commit or both roll back.
      const { data: receipt, error: commitError } = await admin.rpc(
        "dadyoom_commit_activity_attempt",
        {
          p_student_id: user.id,
          p_lesson_id: activity.lesson_id,
          p_activity_id: activityId,
          p_selected_answer: studentAnswer,
          p_is_correct: isCorrect,
          p_is_gradable: isGradable,
          p_earned_points: earnedPoints,
          p_max_points: isGradable ? maxPoints : 0,
          p_lesson_score: currentScore,
          p_progress_percent: progressPercent,
        },
      ).single();
      if (commitError || !receipt) {
        throw new Error("تعذر حفظ النشاط والتقدم في معاملة واحدة.");
      }
      const atomicReceipt = receipt as { saved_attempt_number?: unknown };
      nextAttemptNumber = Number(atomicReceipt.saved_attempt_number);
      if (!Number.isSafeInteger(nextAttemptNumber) || nextAttemptNumber < 1) {
        throw new Error("رقم المحاولة الذرية غير صالح.");
      }
    } else {
      await commitActivityProgressWithRetry({
        initial: existingProgress,
        score: currentScore,
        activityPercent: progressPercent,
        read: async () => {
          const { data, error } = await supabase
            .from("student_lesson_progress")
            .select("id,status,attempts,best_score,progress_percent")
            .eq("student_id", user.id)
            .eq("lesson_id", activity.lesson_id)
            .maybeSingle();
          if (error) throw error;
          return data;
        },
        update: async (previous, values) => {
          const { data, error } = await admin
            .from("student_lesson_progress")
            .update(values)
            .eq("id", previous.id)
            .eq("student_id", user.id)
            .eq("lesson_id", activity.lesson_id)
            .eq("status", previous.status)
            .eq("attempts", previous.attempts)
            .lte("best_score", values.best_score)
            .lte("progress_percent", values.progress_percent)
            .select("id")
            .maybeSingle();
          if (error) throw error;
          return data !== null;
        },
        insert: async (values) => {
          const { data, error } = await admin
            .from("student_lesson_progress")
            .upsert({
              student_id: user.id,
              lesson_id: activity.lesson_id,
              ...values,
              xp: 0,
              time_spent_seconds: 0,
              started_at: new Date().toISOString(),
            }, {
              onConflict: "student_id,lesson_id",
              ignoreDuplicates: true,
            })
            .select("id")
            .maybeSingle();
          if (error) throw error;
          return data !== null;
        },
      });

    }

    // The preceding compare-and-set may lose to a concurrent completion.
    // Return the actual owner-visible row, not stale calculated fields.
    const { data: storedProgress, error: storedProgressError } = await supabase
      .from("student_lesson_progress")
      .select("best_score,progress_percent")
      .eq("student_id", user.id)
      .eq("lesson_id", activity.lesson_id)
      .maybeSingle();
    if (storedProgressError) throw storedProgressError;
    if (!storedProgress) {
      throw new Error("تعذر تأكيد تقدم الدرس المحفوظ.");
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
        Number(storedProgress.best_score ?? 0),

      completedActivities,

      totalActivities,

      progressPercent: Number(storedProgress.progress_percent ?? 0),
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
