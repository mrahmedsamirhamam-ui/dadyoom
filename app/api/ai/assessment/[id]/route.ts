import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  const { id } = await context.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json(
      {
        success: false,
        error: "غير مصرح بالدخول",
      },
      {
        status: 401,
      }
    );
  }

  const { data, error } = await supabase
    .from("ai_assessments")
    .select("id,lesson_id,title,passage,question,choices,skill,difficulty,completed,created_at")
    .eq("id", id)
    .eq("student_email", user.email)
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        success: false,
        error: "لم يتم العثور على التقييم",
      },
      {
        status: 404,
      }
    );
  }

  // A question remains owned by the learner, but its parent lesson must
  // still be published even if a teacher subsequently unpublished it.
  const { data: visibleLesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", data.lesson_id)
    .eq("status", "published")
    .maybeSingle();

  if (lessonError || !visibleLesson) {
    return NextResponse.json(
      { success: false, error: "الدرس غير متاح." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    assessment: {
      id: data.id,
      title: data.title,
      passage: data.passage,
      question: data.question,
      choices: data.choices,
      correctAnswer: null,
      explanation: null,
      skill: data.skill,
      difficulty: data.difficulty,
      completed: data.completed,
      createdAt: data.created_at,
    },
  });
}
