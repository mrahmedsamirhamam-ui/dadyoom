import dotenv from "dotenv";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
});

type LessonRow = {
  id: string;
  title: string;
  content: string | null;
  lesson_number: number;
};

type SentenceRow = {
  lesson_id: string;
  paragraph_number: number;
  sentence_number: number;
  sentence: string;
  embedding: number[];
};

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const geminiApiKey =
  process.env.GEMINI_API_KEY_BACKUP ||
  process.env.GEMINI_API_KEY;

const embeddingModel =
  process.env.GEMINI_EMBEDDING_MODEL ||
  "gemini-embedding-2";

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing."
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing."
  );
}

if (!geminiApiKey) {
  throw new Error(
    "Gemini API key is missing."
  );
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
});

function splitSentences(
  paragraph: string
): string[] {
  const normalized = paragraph
    .replace(/\s+/gu, " ")
    .trim();

  if (!normalized) {
    return [];
  }

  const parts =
    normalized.match(
      /[^.!؟؛،]+(?:[.!؟؛،]+|$)/gu
    ) ?? [normalized];

  return parts
    .map((sentence) =>
      sentence.trim()
    )
    .filter(
      (sentence) =>
        sentence.length >= 8
    );
}

function splitParagraphs(
  content: string
): string[] {
  const sourceBlocks = content
    .split(/\r?\n+/u)
    .map((block) => block.trim())
    .filter(Boolean);

  const paragraphs: string[] = [];
  const maximumParagraphLength = 550;

  for (const block of sourceBlocks) {
    const sentences =
      splitSentences(block);

    let currentParagraph = "";

    for (const sentence of sentences) {
      const combined =
        currentParagraph.length > 0
          ? `${currentParagraph} ${sentence}`
          : sentence;

      if (
        currentParagraph.length > 0 &&
        combined.length >
          maximumParagraphLength
      ) {
        paragraphs.push(
          currentParagraph.trim()
        );

        currentParagraph = sentence;
      } else {
        currentParagraph = combined;
      }
    }

    if (currentParagraph.trim()) {
      paragraphs.push(
        currentParagraph.trim()
      );
    }
  }

  return paragraphs;
}

async function createEmbedding(
  lessonTitle: string,
  sentence: string
): Promise<number[]> {
  const response =
    await ai.models.embedContent({
      model: embeddingModel,
      contents:
        `title: ${lessonTitle} | text: ${sentence}`,
      config: {
        outputDimensionality: 1536,
      },
    });

  const embedding =
    response.embeddings?.[0]?.values;

  if (
    !embedding ||
    embedding.length !== 1536
  ) {
    throw new Error(
      `Invalid embedding length: ${
        embedding?.length ?? 0
      }`
    );
  }

  return embedding;
}

async function processLesson(
  lesson: LessonRow
): Promise<void> {
  if (!lesson.content?.trim()) {
    console.log(
      `Skipping empty lesson ${lesson.lesson_number}`
    );

    return;
  }

  console.log(
    `Embedding lesson ${lesson.lesson_number}: ${lesson.title}`
  );

  const paragraphs =
    splitParagraphs(lesson.content);

  const paragraphRows =
    paragraphs.map(
      (content, index) => ({
        lesson_id: lesson.id,
        paragraph_number:
          index + 1,
        content,
      })
    );

  const {
    error: deleteParagraphsError,
  } = await supabase
    .from("lesson_paragraphs")
    .delete()
    .eq("lesson_id", lesson.id);

  if (deleteParagraphsError) {
    throw deleteParagraphsError;
  }

  const {
    error: insertParagraphsError,
  } = await supabase
    .from("lesson_paragraphs")
    .insert(paragraphRows);

  if (insertParagraphsError) {
    throw insertParagraphsError;
  }

  const {
    error: deleteEmbeddingsError,
  } = await supabase
    .from(
      "lesson_sentence_embeddings"
    )
    .delete()
    .eq("lesson_id", lesson.id);

  if (deleteEmbeddingsError) {
    throw deleteEmbeddingsError;
  }

  const sentenceRows:
    SentenceRow[] = [];

  for (
    let paragraphIndex = 0;
    paragraphIndex <
    paragraphs.length;
    paragraphIndex += 1
  ) {
    const sentences =
      splitSentences(
        paragraphs[paragraphIndex]
      );

    for (
      let sentenceIndex = 0;
      sentenceIndex <
      sentences.length;
      sentenceIndex += 1
    ) {
      const sentence =
        sentences[sentenceIndex];

      console.log(
        `  Paragraph ${
          paragraphIndex + 1
        }, sentence ${
          sentenceIndex + 1
        }`
      );

      const embedding =
        await createEmbedding(
          lesson.title,
          sentence
        );

      sentenceRows.push({
        lesson_id: lesson.id,
        paragraph_number:
          paragraphIndex + 1,
        sentence_number:
          sentenceIndex + 1,
        sentence,
        embedding,
      });

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 1200)
      );
    }
  }

  if (sentenceRows.length > 0) {
    const {
      error: insertError,
    } = await supabase
      .from(
        "lesson_sentence_embeddings"
      )
      .insert(sentenceRows);

    if (insertError) {
      throw insertError;
    }
  }

  console.log(
    `Saved ${paragraphRows.length} paragraphs and ${sentenceRows.length} sentence embeddings.`
  );
}

async function main(): Promise<void> {
  const requestedLessonNumber =
    process.env
      .EMBED_LESSON_NUMBER
      ? Number(
          process.env
            .EMBED_LESSON_NUMBER
        )
      : null;

  let query = supabase
    .from("lessons")
    .select(`
      id,
      title,
      content,
      lesson_number
    `)
    .eq("status", "published")
    .order(
      "lesson_number",
      {
        ascending: true,
      }
    );

  if (
    requestedLessonNumber !== null
  ) {
    query = query.eq(
      "lesson_number",
      requestedLessonNumber
    );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw error;
  }

  const lessons =
    (data ?? []) as LessonRow[];

  for (const lesson of lessons) {
    try {
      await processLesson(lesson);
    } catch (error) {
      console.error(
        `Embedding failed for lesson ${lesson.lesson_number}:`,
        error
      );
    }
  }

  console.log(
    "Embedding pipeline completed."
  );
}

main().catch((error) => {
  console.error(
    "Embedding pipeline failed:",
    error
  );

  process.exitCode = 1;
});
