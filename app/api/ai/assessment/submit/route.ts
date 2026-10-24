import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateStudentCaches } from "@/features/student-progress/services/invalidate-student-caches";
import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  updateProgress,
} from "@/services/progress/progress-engine";

import {
  saveAssessmentSessionAnswer,
} from "@/features/assessment/services/saveAssessmentSessionAnswer";

import {
  updateStudentMemory,
} from "@/features/student-memory/services/updateStudentMemory";

type SubmitBody = {
  assessmentId?: string;
  sessionId?: string;
  answer?: number;
};

export async function POST(
  request: Request
) {
  const supabase =
    await createClient();

  let claimedAssessmentId:
    string | null = null;
  let claimedStudentEmail: string | null = null;

  try {
    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user?.email
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as
        SubmitBody;

    const assessmentId =
      body.assessmentId?.trim();

    const sessionId =
      body.sessionId?.trim();

    const answer =
      body.answer;

    if (
      !assessmentId ||
      !sessionId ||
      typeof answer !== "number" ||
      !Number.isInteger(answer) ||
      answer < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "بيانات الإجابة غير صالحة.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: assessment,
      error: assessmentError,
    } = await supabase
      .from("ai_assessments")
      .select(`
        id,
        lesson_id,
        student_email,
        question,
        choices,
        skill,
        completed
      `)
      .eq("id", assessmentId)
      .eq(
        "student_email",
        user.email
      )
      .maybeSingle();

    if (
      assessmentError ||
      !assessment
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم يتم العثور على الاختبار.",
        },
        {
          status: 404,
        }
      );
    }

    if (assessment.completed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "تم إرسال إجابة هذا السؤال سابقًا.",
        },
        {
          status: 409,
        }
      );
    }


    // Validate the student's test-session ownership before any privileged
    // read or claim. Reject draft/unpublished lesson submissions.
    const {
      data: assessmentSession,
      error: sessionError,
    } = await supabase
      .from("assessment_sessions")
      .select(`
        id,
        lesson_id,
        student_id,
        current_question,
        total_questions,
        correct_answers,
        wrong_answers,
        finished
      `)
      .eq("id", sessionId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (
      sessionError ||
      !assessmentSession
    ) {
      throw new Error(
        "لم يتم العثور على جلسة الاختبار."
      );
    }

    if (
      assessmentSession.finished
    ) {
      throw new Error(
        "جلسة الاختبار منتهية بالفعل."
      );
    }

    if (
      !assessment.lesson_id ||
      assessmentSession.lesson_id !==
        assessment.lesson_id
    ) {
      throw new Error(
        "السؤال لا ينتمي إلى جلسة الاختبار الحالية."
      );
    }


    const { data: publishedLesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", assessment.lesson_id)
      .eq("status", "published")
      .maybeSingle();
    if (lessonError) throw lessonError;
    if (!publishedLesson) {
      return NextResponse.json(
        { success: false, message: "الدرس غير متاح للتقويم." },
        { status: 404 }
      );
    }

    // /submit must not grade two questions into the same session slot.
    // The /next endpoint already checks this invariant; enforce it BEFORE
    // claiming a question, reading a private answer key, or awarding XP.
    // Historical answers are read through the authenticated student's RLS.
    const questionSlot = Number(assessmentSession.current_question);
    const totalSlots = Number(assessmentSession.total_questions);
    const gradedAnswers = Number(assessmentSession.correct_answers) +
      Number(assessmentSession.wrong_answers);
    if (!Number.isSafeInteger(questionSlot) ||
        !Number.isSafeInteger(totalSlots) ||
        !Number.isSafeInteger(gradedAnswers) ||
        totalSlots < 1 || totalSlots > 50 ||
        questionSlot < 1 || questionSlot > totalSlots ||
        gradedAnswers !== questionSlot - 1) {
      return NextResponse.json(
        { success: false, message: "تقدم جلسة التقييم غير متسق." },
        { status: 409 }
      );
    }

    const { count: recordedAnswers, error: historyError } = await supabase
      .from("assessment_session_answers")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("student_id", user.id)
      .eq("lesson_id", publishedLesson.id);

    if (historyError) throw historyError;
    if (!Number.isSafeInteger(recordedAnswers) ||
        recordedAnswers !== gradedAnswers) {
      return NextResponse.json(
        { success: false, message: "أكمل الانتقال للسؤال التالي قبل تسليم إجابة أخرى." },
        { status: 409 }
      );
    }

    if (!Array.isArray(assessment.choices) || answer >= assessment.choices.length) {
      return NextResponse.json(
        { success: false, message: "اختيار الإجابة غير صالح." },
        { status: 400 }
      );
    }

    // Private correction stays on the trusted server after both identity
    // and published-lesson checks; never read keys via the student's client.
    const admin = createAdminClient();
    const { data: privateAssessment, error: privateError } = await admin
      .from("ai_assessments")
      .select("id,lesson_id,correct_answer,explanation")
      .eq("id", assessment.id)
      .eq("student_email", user.email)
      .eq("lesson_id", publishedLesson.id)
      .maybeSingle();

    if (privateError) throw privateError;
    if (!privateAssessment) {
      return NextResponse.json(
        { success: false, message: "مفتاح تصحيح الاختبار غير متاح." },
        { status: 404 }
      );
    }

    /*
     * حجز السؤال قبل منح XP.
     * يمنع الضغط المتكرر من احتساب النتيجة أكثر من مرة.
     */
    const {
      data: claimedAssessment,
      error: claimError,
    } = await admin
      .from("ai_assessments")
      .update({
        completed: true,
      })
      .eq("id", assessmentId)
      .eq(
        "student_email",
        user.email
      )
      .eq("completed", false)
      .select("id")
      .maybeSingle();

    if (
      claimError ||
      !claimedAssessment
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "تم إرسال إجابة هذا السؤال سابقًا.",
        },
        {
          status: 409,
        }
      );
    }

    claimedStudentEmail = user.email;
    claimedAssessmentId =
      claimedAssessment.id;

    const correct =
      answer ===
      privateAssessment.correct_answer;

    const selectedChoice =
      Array.isArray(
        assessment.choices
      ) &&
      answer <
        assessment.choices.length
        ? assessment.choices.at(
            answer
          ) ?? null
        : null;

    await saveAssessmentSessionAnswer({
      supabase: admin,
      sessionId,
      assessmentId,
      studentId:
        user.id,
      lessonId:
        assessment.lesson_id,
      skill:
        assessment.skill,
      selectedAnswer:
        answer,
      correctAnswer:
        privateAssessment.correct_answer,
      isCorrect:
        correct,
    });
    // Never reopen a persisted question after a later memory/skill failure.
    claimedAssessmentId = null;


    // The AI question result is stored in assessment_sessions and skill
    // progress. A single generated question must not overwrite canonical
    // academic lesson_mastery, which requires the full lesson rubric.

    // The answer was graded from the private server key, so canonical
    // skill/XP writes must use server-only credentials, not browser grants.
    await updateProgress(
      admin,
      {
        studentEmail:
          user.email,
        skill:
          assessment.skill,
        correct,
      }
    );



    // Memory is secondary analytics: a legacy unverifiable answer must
    // not turn an already saved, server-graded response into a false 500.
    // Never suppress or change the trusted correctness itself.
    let memorySynced = true;
    try {
      await updateStudentMemory({
        // Derive from private keys + authenticated ownership.
        // Student-provided correctness, skill and email are ignored.
        supabase: admin,
        studentId: user.id,
        studentEmail: user.email,
      });
    } catch (memoryError) {
      memorySynced = false;
      console.error("STUDENT_MEMORY_RECOMPUTE_FAILED", memoryError);
    }

    /*
     * بعد تسجيل نتيجة جديدة تصبح الخطة القديمة غير محدثة.
     * إغلاقها يجبر النظام على إنشاء خطة جديدة في الزيارة التالية.
     */
    const {
      error: planInvalidationError,
    } = await supabase
      .from("learning_plans")
      .update({
        completed: true,
      })
      .eq(
        "student_email",
        user.email
      )
      .or(
        "completed.eq.false,completed.is.null"
      );

    if (planInvalidationError) {
      console.error(
        "LEARNING_PLAN_INVALIDATION_FAILED",
        planInvalidationError
      );
    }
    // STUDENT_CACHE_INVALIDATION_POINT
    await invalidateStudentCaches({
      studentId: user.id,
      studentEmail: user.email,
      supabase,
    });
return NextResponse.json({
      success: true,
      correct,
      memorySynced,
      score:
        correct ? 100 : 0,
      // Do not leak the right answer or explanation on wrong attempts.
      correctAnswer: correct ? privateAssessment.correct_answer : null,
      explanation: correct ? privateAssessment.explanation : null,
    });
  } catch (error) {
    /*
     * إذا فشل تحديث الإتقان أو XP بعد حجز السؤال،
     * نعيده إلى غير مكتمل حتى يمكن المحاولة مجددًا.
     */
    if (claimedAssessmentId && claimedStudentEmail) {
      const {
        error: rollbackError,
      } = await createAdminClient()
        .from("ai_assessments")
        .update({
          completed: false,
        })
        .eq("id", claimedAssessmentId)
        .eq("student_email", claimedStudentEmail);

      if (rollbackError) {
        console.error(
          "ASSESSMENT_CLAIM_ROLLBACK_FAILED",
          rollbackError
        );
      }
    }

    console.error(
      "ASSESSMENT_SUBMIT_FAILED",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تصحيح الإجابة.",
      },
      {
        status: 500,
      }
    );
  }
}
