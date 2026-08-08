import { createClient } from "@/lib/supabase/server";
import type { VocabularyItem } from "../types/vocabulary";

export type LessonVocabularyItem = VocabularyItem & {
  id: string;
  lesson_id: string;
  example: string | null;
  display_order: number;
};

export async function getLessonVocabulary(
  lessonId: string
): Promise<LessonVocabularyItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lesson_vocabulary")
    .select(`
      id,
      lesson_id,
      word,
      meaning,
      example,
      display_order
    `)
    .eq("lesson_id", lessonId)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}