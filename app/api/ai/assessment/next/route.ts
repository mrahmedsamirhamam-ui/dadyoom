import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { generateAndSaveAssessment } from "@/services/ai/assessment.service";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json(
      { success: false },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const result = await generateAndSaveAssessment(
    supabase,
    user.email,
    profile?.full_name ?? "بطل ضاديوم"
  );

  return NextResponse.json({
    success: true,
    assessment: {
      id: result.assessment.id,
      title: result.assessment.title,
      passage: result.assessment.passage,
      question: result.assessment.question,
      choices: result.assessment.choices,
      correctAnswer: result.assessment.correctAnswer,
      explanation: result.assessment.explanation,
      skill: result.assessment.skill,
      difficulty: result.assessment.difficulty,
      completed: result.assessment.completed,
      createdAt: result.assessment.createdAt,
    },
  });
}