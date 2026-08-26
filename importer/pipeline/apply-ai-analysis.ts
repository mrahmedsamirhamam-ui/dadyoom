import { supabaseAdmin } from "./supabase-admin";
import type { AnalyzedLesson } from "./analyze-lessons";

type UploadedLesson = {
  id: string;
  title: string;
  lesson_number: number;
  status: string;
};

export type UpdatedLesson = {
  id: string;
  title: string;
  summary: string | null;
  learning_objectives: string[];
  status: string;
};

export async function applyAIAnalysis(
  uploadedLessons: UploadedLesson[],
  analyzedLessons: AnalyzedLesson[]
): Promise<UpdatedLesson[]> {
  const updatedLessons: UpdatedLesson[] = [];

  for (const analyzed of analyzedLessons) {
    const uploadedLesson = uploadedLessons.find(
      (item) =>
        item.lesson_number ===
        analyzed.source.lessonNumber
    );

    if (!uploadedLesson) {
      throw new Error(
        `لم يتم العثور على الدرس المرفوع رقم ${analyzed.source.lessonNumber}`
      );
    }

    const summary = analyzed.ai.summary.trim();

    const objectives = analyzed.ai.objectives
      .map((objective) => objective.trim())
      .filter(Boolean);

    const { data, error } = await supabaseAdmin
      .from("lessons")
      .update({
        summary,
        learning_objectives: objectives,
        status: "review",
        updated_at: new Date().toISOString(),
      })
      .eq("id", uploadedLesson.id)
      .select(`
        id,
        title,
        summary,
        learning_objectives,
        status
      `)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        `لم يتم تحديث الدرس: ${uploadedLesson.id}`
      );
    }

    updatedLessons.push(
      data as UpdatedLesson
    );

    console.log(
      `AI analysis saved: ${data.title} [${data.status}]`
    );
  }

  return updatedLessons;
}
