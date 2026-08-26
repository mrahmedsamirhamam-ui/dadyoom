import { createClient } from "@/lib/supabase/server";

export type QuestionAttempt = {
  question_id: string;
  is_correct: boolean;
};

export type AdaptiveLessonMeta = {
  id: string;
  unit_id: string;
  lesson_number: number;
};

export type AdaptiveNextLesson = {
  id: string;
  title: string | null;
  lesson_number: number;
};

type ServerSupabaseClient =
  Awaited<ReturnType<typeof createClient>>;

export type AdaptiveLessonDataOptions = {
  lesson?: AdaptiveLessonMeta;
  questionIds?: string[];
  nextLesson?: AdaptiveNextLesson | null;
  supabase?: ServerSupabaseClient;
};

export async function getAdaptiveLessonData(
  userId: string,
  lessonId: string,
  options: AdaptiveLessonDataOptions = {}
) {
  const supabase =
    options.supabase ?? (await createClient());

  let lesson: AdaptiveLessonMeta | null =
    options.lesson ?? null;

  if (!lesson) {
    const {
      data,
      error,
    } = await supabase
      .from("lessons")
      .select(`
        id,
        unit_id,
        lesson_number
      `)
      .eq("id", lessonId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    lesson = data as AdaptiveLessonMeta;
  }

  let questionIds =
    options.questionIds;

  if (questionIds === undefined) {
    const {
      data,
      error,
    } = await supabase
      .from("questions")
      .select("id")
      .eq("lesson_id", lessonId);

    if (error) {
      throw error;
    }

    questionIds =
      (data ?? []).map(
        (question) => question.id
      );
  }

  let attempts: QuestionAttempt[] = [];

  if (questionIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from("question_attempts")
      .select(`
        question_id,
        is_correct
      `)
      .eq("user_id", userId)
      .in("question_id", questionIds);

    if (error) {
      throw error;
    }

    attempts = (data ?? []) as QuestionAttempt[];
  }

  let nextLesson:
    AdaptiveNextLesson | null | undefined =
      options.nextLesson;

  if (nextLesson === undefined) {
    const {
      data,
      error,
    } = await supabase
      .from("lessons")
      .select(`
        id,
        title,
        lesson_number
      `)
      .eq("unit_id", lesson.unit_id)
      .eq("status", "published")
      .gt(
        "lesson_number",
        lesson.lesson_number
      )
      .order("lesson_number", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(
        "Failed to load adaptive next lesson:",
        error
      );
    }

    nextLesson =
      data as AdaptiveNextLesson | null;
  }

  return {
    lesson,
    attempts,
    nextLesson: nextLesson ?? null,
  };
}
