import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateProgress } from "@/services/progress/progress-engine";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const body = await request.json();

  const assessmentId = body.assessmentId;
  const answer = body.answer;

  const { data, error } = await supabase
    .from("ai_assessments")
    .select("*")
    .eq("id", assessmentId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        success: false,
      },
      { status: 404 }
    );
  }

  const correct = answer === data.correct_answer;

  // تحديث تقدم الطالب ومهاراته ونقاطه عبر المحرك الموحد
  await updateProgress(supabase, {
    studentEmail: user.email,
    skill: data.skill,
    correct,
  });

  // تحديث حالة التقييم إلى مكتمل
  await supabase
    .from("ai_assessments")
    .update({
      completed: true,
    })
    .eq("id", assessmentId);

  return NextResponse.json({
    success: true,
    correct,
    score: correct ? 100 : 0,
    correctAnswer: data.correct_answer,
    explanation: data.explanation,
  });
}