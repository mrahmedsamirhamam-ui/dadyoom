import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/types/supabase";

type TypedSupabaseClient =
  SupabaseClient<Database>;

export type LessonContextResult = {
  matched_id: string;
  lesson_id: string;
  paragraph_number: number;
  sentence_number: number;
  matched_sentence: string;
  context_text: string;
  similarity: number;
};

type SearchLessonContextParams = {
  supabase: TypedSupabaseClient;
  queryEmbedding: number[];
  lessonId?: string | null;
  threshold?: number;
  matchCount?: number;
  contextRadius?: number;
};

export async function searchLessonContext({
  supabase,
  queryEmbedding,
  lessonId = null,
  threshold = 0.45,
  matchCount = 5,
  contextRadius = 3,
}: SearchLessonContextParams): Promise<
  LessonContextResult[]
> {
  if (queryEmbedding.length !== 1536) {
    throw new Error(
      `Invalid embedding dimensions: ${queryEmbedding.length}`
    );
  }

  const vectorLiteral =
    `[${queryEmbedding.join(",")}]`;

  const {
    data,
    error,
  } = await supabase.rpc(
    "match_lesson_context",
    {
      query_embedding:
        vectorLiteral,
      match_threshold:
        threshold,
      match_count:
        matchCount,
      filter_lesson_id:
        lessonId ?? undefined,
      context_radius:
        contextRadius,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  const results =
    (data ?? []) as LessonContextResult[];

  const uniqueContexts =
    new Map<
      string,
      LessonContextResult
    >();

  for (const result of results) {
    const normalizedContext =
      result.context_text
        .replace(/\s+/gu, " ")
        .trim();

    const key = [
      result.lesson_id,
      result.paragraph_number,
      normalizedContext,
    ].join(":");

    const existing =
      uniqueContexts.get(key);

    if (
      !existing ||
      result.similarity >
        existing.similarity
    ) {
      uniqueContexts.set(
        key,
        {
          ...result,
          context_text:
            normalizedContext,
        }
      );
    }
  }

  return Array.from(
    uniqueContexts.values()
  ).sort(
    (a, b) =>
      b.similarity -
      a.similarity
  );
}
