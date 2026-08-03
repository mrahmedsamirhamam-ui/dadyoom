import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { AssessmentPage } from "@/components/assessment/assessment-page";

import type { Assessment } from "@/types/assessment";

export const dynamic = "force-dynamic";

export default async function AssessmentRoute() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("ai_assessments")
    .select("*")
    .eq("student_email", user.email)
    .eq("completed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return (
      <main className="mx-auto mt-20 max-w-3xl text-center">
        <h1 className="text-3xl font-bold">
          لا يوجد تقييم متاح
        </h1>

        <p className="mt-4 text-slate-600">
          قم أولاً بإنشاء تقييم من الذكاء الاصطناعي.
        </p>
      </main>
    );
  }

  const assessment: Assessment = {
    id: data.id,
    title: data.title,
    passage: data.passage,
    question: data.question,
    choices: data.choices,
    correctAnswer: data.correct_answer,
    explanation: data.explanation,
    skill: data.skill,
    difficulty: data.difficulty,
    completed: data.completed,
    createdAt: data.created_at,
  };

  return <AssessmentPage assessment={assessment} />;
}