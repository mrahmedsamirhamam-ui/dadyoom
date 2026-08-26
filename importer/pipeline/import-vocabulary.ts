import { supabaseAdmin } from "./supabase-admin";
import type { AnalyzedLesson } from "./analyze-lessons";

type UploadedLesson = {
  id: string;
  title: string;
  lesson_number: number;
  status: string;
};

export async function importVocabulary(
  uploadedLessons: UploadedLesson[],
  analyzedLessons: AnalyzedLesson[]
) {
  let importedVocabulary = 0;

  for (const analyzed of analyzedLessons) {
    const uploadedLesson = uploadedLessons.find(
      (item) =>
        item.lesson_number ===
        analyzed.source.lessonNumber
    );

    if (!uploadedLesson) {
      continue;
    }

    const rows = analyzed.ai.vocabulary.map(
      (item, index) => ({
        lesson_id: uploadedLesson.id,
        word: item.word.trim(),
        meaning: item.meaning.trim(),
        example: item.example?.trim() || null,
        display_order: index + 1,
        updated_at: new Date().toISOString(),
      })
    );

    if (rows.length === 0) {
      continue;
    }

    const { error } = await supabaseAdmin
      .from("lesson_vocabulary")
      .upsert(rows, {
        onConflict: "lesson_id,word",
      });

    if (error) {
      throw error;
    }

    importedVocabulary += rows.length;
  }

  return importedVocabulary;
}
