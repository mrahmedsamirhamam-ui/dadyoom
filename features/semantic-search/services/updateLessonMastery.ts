import type {
  SupabaseClient,
} from "@supabase/supabase-js";

type UpdateLessonMasteryParams = {
  supabase: SupabaseClient;
  studentId: string;
  lessonId: string;
  userQuestion: string;
  assistantAnswer: string;
  answeredCorrectly: boolean;
};

export async function updateLessonMastery({
  supabase,
  studentId,
  lessonId,
  userQuestion,
  assistantAnswer,
  answeredCorrectly,
}: UpdateLessonMasteryParams): Promise<void> {
  const {
    data: existing,
    error: readError,
  } = await supabase
    .from("lesson_mastery")
    .select(`
      correct_answers,
      wrong_answers,
      asked_questions
    `)
    .eq("student_id", studentId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  const correctAnswers =
    (existing?.correct_answers ?? 0) +
    (answeredCorrectly ? 1 : 0);

  const wrongAnswers =
    (existing?.wrong_answers ?? 0) +
    (answeredCorrectly ? 0 : 1);

  const askedQuestions =
    (existing?.asked_questions ?? 0) + 1;

  const masteryScore =
    Math.round(
      (
        correctAnswers /
        Math.max(
          correctAnswers +
            wrongAnswers,
          1
        )
      ) * 100
    );

  const {
    error: upsertError,
  } = await supabase
    .from("lesson_mastery")
    .upsert(
      {
        student_id: studentId,
        lesson_id: lessonId,
        mastery_score:
          masteryScore,
        correct_answers:
          correctAnswers,
        wrong_answers:
          wrongAnswers,
        asked_questions:
          askedQuestions,
        last_question:
          userQuestion,
        last_answer:
          assistantAnswer,
        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "student_id,lesson_id",
      }
    );

  if (upsertError) {
    throw upsertError;
  }
}