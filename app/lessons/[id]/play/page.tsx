import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { readCompleteGradingPages } from "@/lib/lesson-activities/read-complete-pages";
import StudyPlayClient, { type PlayQuestion } from "./StudyPlayClient";

type RawQuestion = {
  id: string;
  question: string;
  question_type: string;
  question_order: number;
  options: unknown;
};

function normalizeQuestions(rows: RawQuestion[]): PlayQuestion[] | null {
  const result: PlayQuestion[] = [];

  for (const row of rows) {
    if (row.question_type !== "multiple_choice" || !Array.isArray(row.options)) {
      return null;
    }

    const options = row.options.filter(
      (value): value is { id: string; text: string } =>
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof value.id === "string" &&
        typeof value.text === "string" &&
        Boolean(value.id.trim() && value.text.trim()),
    ).map((value) => ({
      id: value.id.trim(),
      text: value.text.trim(),
    }));

    if (
      !row.id ||
      !row.question?.trim() ||
      options.length < 2 ||
      new Set(options.map((option) => option.id)).size !== options.length
    ) {
      return null;
    }

    result.push({
      id: row.id,
      question: row.question.trim(),
      questionOrder: row.question_order,
      options,
    });
  }

  return result.length ? result : null;
}

export default async function StudyPlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id,title")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (lessonError) throw lessonError;
  if (!lesson) notFound();

  // Invoker-RLS view exposes only student-safe question text and options.
  // Never send correct_answer, explanations, or grading logic to the browser.
  // Read all visible rows, not an arbitrary PostgREST first page.
  // Keep the verified 100-question study-play bound; never show a partial
  // set that the server-side grade action could disagree with.
  const visibleRows = await readCompleteGradingPages({
    pageSize: 75,
    maxRows: 100,
    readPage: async (offset, limit) => {
      const { data, count, error } = await supabase
        .from("dadyoom_student_questions")
        .select("id,question,question_type,question_order,options", {
          count: "exact",
        })
        .eq("lesson_id", id)
        .order("id", { ascending: true })
        .range(offset, offset + limit - 1);
      return { data, count, error };
    },
  });

  // Restore pedagogical ordering only after verifying the complete bank.
  const rows = [...visibleRows].sort(
    (a, b) => (a.question_order ?? 0) - (b.question_order ?? 0) ||
      a.id.localeCompare(b.id),
  );
  const questions = normalizeQuestions(rows as RawQuestion[]);

  return (
    <main dir="rtl" className="min-h-screen bg-[#fbf6ea] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {questions ? (
          <StudyPlayClient lessonId={lesson.id} lessonTitle={lesson.title} questions={questions} />
        ) : (
          <section className="rounded-3xl border border-amber-200 bg-white p-7 text-center">
            <h1 className="text-2xl font-black text-[#173f38]">التدريب غير متاح لهذا الدرس بعد</h1>
            <p className="mt-3 text-slate-700">
              يحتاج هذا الدرس إلى أسئلة اختيار من متعدد كاملة وصالحة قبل بدء اللعب.
              لن نكرر سؤالًا أو نخترع إجابة لمجرد إظهار النشاط.
            </p>
            <Link className="mt-6 inline-block rounded-xl bg-[#173f38] px-5 py-3 font-bold text-white" href={"/lessons/" + lesson.id}>
              العودة إلى الدرس
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
