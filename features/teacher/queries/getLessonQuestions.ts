import { createClient } from "@/lib/supabase/server";

export type LessonQuestionOption = {
  id: string;
  text: string;
};

export type LessonQuestionForEditor = {
  id: string;
  lesson_id: string;
  question_order: number;
  question: string;
  question_type: string;
  options: LessonQuestionOption[];
  correct_answer: string;
  explanation: string | null;
  points: number;
};

function normalizeOptions(
  value: unknown
): LessonQuestionOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const options: LessonQuestionOption[] = [];

  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item)
    ) {
      continue;
    }

    const record =
      item as Record<string, unknown>;

    const id =
      typeof record.id === "string"
        ? record.id
        : "";

    const text =
      typeof record.text === "string"
        ? record.text
        : "";

    if (!id) {
      continue;
    }

    options.push({
      id,
      text,
    });
  }

  return options;
}

export async function getLessonQuestions(
  lessonId: string
): Promise<LessonQuestionForEditor[]> {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("questions")
    .select(
      "id, lesson_id, question_order, question, question_type, options, correct_answer, explanation, points"
    )
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

  return (data ?? []).map(
    (row) => ({
      id: row.id,
      lesson_id: row.lesson_id,
      question_order:
        row.question_order,
      question:
        row.question,
      question_type:
        row.question_type,
      options:
        normalizeOptions(
          row.options
        ),
      correct_answer:
        row.correct_answer,
      explanation:
        row.explanation,
      points:
        row.points,
    })
  );
}
