import { createClient } from "@/lib/supabase/server";

export type WeakQuestion = {
  id: string;
  question: string;
  question_type: string;
  options: {
    id: string;
    text: string;
  }[];
  correct_answer: string;
  explanation: string | null;
};

type ServerSupabaseClient =
  Awaited<
    ReturnType<typeof createClient>
  >;

export async function getWeakQuestions(
  userId: string,
  lessonId: string,
  existingQuestions?: WeakQuestion[],
  existingSupabase?: ServerSupabaseClient
): Promise<WeakQuestion[]> {
  const supabase =
    existingSupabase ??
    (await createClient());

  let questions: WeakQuestion[];

  /*
   * إذا كانت صفحة الدرس قد حمّلت الأسئلة بالفعل،
   * فلا نعيد قراءتها من Supabase مرة ثانية.
   */
  if (existingQuestions !== undefined) {
    questions =
      existingQuestions;
  } else {
    const {
      data,
      error: questionsError,
    } = await supabase
      .from("questions")
      .select(`
        id,
        question,
        question_type,
        options,
        correct_answer,
        explanation
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

    if (questionsError) {
      throw questionsError;
    }

    questions =
      (data ?? []) as WeakQuestion[];
  }

  const questionIds =
    questions.map(
      (question) =>
        question.id
    );

  if (
    questionIds.length === 0
  ) {
    return [];
  }

  /*
   * هذا هو الاستعلام الوحيد المتبقي:
   * نحتاج فقط لمعرفة الأسئلة التي أخطأ فيها الطالب.
   */
  const {
    data: attempts,
    error: attemptsError,
  } = await supabase
    .from("question_attempts")
    .select(`
      question_id,
      is_correct
    `)
    .eq(
      "user_id",
      userId
    )
    .eq(
      "is_correct",
      false
    )
    .in(
      "question_id",
      questionIds
    );

  if (attemptsError) {
    throw attemptsError;
  }

  const weakIds =
    new Set(
      attempts?.map(
        (attempt) =>
          attempt.question_id
      ) ?? []
    );

  return questions.filter(
    (question) =>
      weakIds.has(
        question.id
      )
  );
}