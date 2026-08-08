import { createClient } from "@/lib/supabase/server";

type NeighborLesson = {
  id: string;
  title: string;
  lesson_number: number;
};

type LessonWithNeighbors = {
  id: string;
  unit_id: string;
  title: string;
  lesson_number: number;
  status: string;
  lesson_type: string | null;
  content: string | null;
  summary: string | null;
  instructions: unknown;
  learning_objectives: unknown;
  vocabulary: unknown;
  estimated_minutes: number | null;
  source_page_start: number | null;
  source_page_end: number | null;
  source_pdf_url: string | null;
  previousLesson: NeighborLesson | null;
  nextLesson: NeighborLesson | null;
};

export async function getLessonById(
  id: string
) {
  const supabase = await createClient();


  const { data, error } =
    await supabase.rpc(
      "get_published_lesson_with_neighbors",
      {
        p_lesson_id: id,
      }
    );


  if (error) {
    console.error(
      "Failed to load lesson with neighbors:",
      error
    );

    throw error;
  }

  if (!data) {
    return null;
  }

  return data as LessonWithNeighbors;
}
