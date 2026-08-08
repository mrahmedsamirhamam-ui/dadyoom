import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request
) {
  const {
    searchParams,
  } =
    new URL(request.url);

  const lessonId =
    searchParams.get(
      "lessonId"
    );

  if (!lessonId) {
    return NextResponse.json(
      {
        error:
          "lessonId is required",
      },
      {
        status: 400,
      }
    );
  }

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("lesson_mastery")
    .select("*")
    .eq(
      "student_id",
      user.id
    )
    .eq(
      "lesson_id",
      lessonId
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    mastery:
      data ?? {
        mastery_score: 0,
        correct_answers: 0,
        wrong_answers: 0,
        asked_questions: 0,
        last_question: null,
        last_answer: null,
        updated_at: null,
      },
  });
}