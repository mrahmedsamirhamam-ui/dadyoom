import { supabaseAdmin } from "./supabase-admin";
import type { AnalyzedLesson } from "./analyze-lessons";

type UploadedLesson = {
  id: string;
  title: string;
  lesson_number: number;
  status: string;
};

export async function importQuestions(
  uploadedLessons: UploadedLesson[],
  analyzedLessons: AnalyzedLesson[]
) {
  let importedQuestions = 0;

  for (const analyzed of analyzedLessons) {
    const uploadedLesson = uploadedLessons.find(
      (item) =>
        item.lesson_number ===
        analyzed.source.lessonNumber
    );

    if (!uploadedLesson) {
      continue;
    }

    const rows = analyzed.ai.questions.map(
      (item, index) => ({
        lesson_id: uploadedLesson.id,
        question_order: index + 1,
        question: item.question.trim(),
        question_type: item.type,
        options: item.options,
        correct_answer: item.answer,
        explanation:
          item.explanation?.trim() || null,
        points: 1,
        updated_at: new Date().toISOString(),
      })
    );

    if (rows.length === 0) {
      continue;
    }

    const { error } = await supabaseAdmin
      .from("questions")
      .upsert(rows, {
        onConflict:
          "lesson_id,question_order",
      });

    if (error) {
      throw error;
    }

    importedQuestions += rows.length;
  }

  return importedQuestions;
}
