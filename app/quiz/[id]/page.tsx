import Link from "next/link";

import LessonPractice, {
  type PracticeOption,
  type PracticeQuestion,
} from "@/features/practice/components/LessonPractice";
import {
  createClient,
} from "@/lib/supabase/server";

type RawQuestion = {
  id: string;
  question: string;
  question_order: number;
  options: unknown;
};

function normalizeOptions(
  value: unknown
): PracticeOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (
        item
      ): item is {
        id: string;
        text: string;
      } =>
        Boolean(item) &&
        typeof item ===
          "object" &&
        typeof (
          item as {
            id?: unknown;
          }
        ).id ===
          "string" &&
        typeof (
          item as {
            text?: unknown;
          }
        ).text ===
          "string"
    )
    .map((item) => ({
      id:
        item.id.trim(),

      text:
        item.text.trim(),
    }))
    .filter(
      (option) =>
        Boolean(
          option.id &&
          option.text
        )
    );
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const {
    id,
  } = await params;

  const lessonId =
    id.trim();

  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("questions")
    .select(`
      id,
      question,
      question_order,
      options
    `)
    .eq(
      "lesson_id",
      lessonId
    )
    .order(
      "question_order",
      {
        ascending: true,
      }
    );

  if (error) {
    throw error;
  }

  const questions =
    (
      (data ?? []) as
        RawQuestion[]
    )
      .map(
        (
          question
        ): PracticeQuestion => ({
          id:
            question.id,

          question:
            question.question,

          questionOrder:
            question.question_order,

          options:
            normalizeOptions(
              question.options
            ),
        })
      )
      .filter(
        (question) =>
          question.options.length >
          0
      );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6"
    >
      <div className="mx-auto max-w-3xl">
        {questions.length > 0 ? (
          <LessonPractice
            lessonId={
              lessonId
            }
            questions={
              questions
            }
          />
        ) : (
          <section className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <div className="text-5xl">
              📚
            </div>

            <h1 className="mt-4 text-2xl font-black text-slate-900">
              لا يوجد تدريب متاح حاليًا
            </h1>

            <p className="mt-3 text-slate-600">
              لا توجد أسئلة صالحة لهذا الدرس بعد.
            </p>

            <Link
              href={`/lessons/${lessonId}`}
              className="mt-6 inline-flex rounded-xl bg-teal-700 px-5 py-3 font-black text-white"
            >
              العودة إلى الدرس
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}