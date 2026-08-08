import dotenv from "dotenv";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
});

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

async function main(): Promise<void> {
  const query =
    process.env.SEARCH_QUERY ??
    "كيف كان صاحب الحديقة يقسم محصوله؟";

  const lessonId =
    process.env.SEARCH_LESSON_ID ??
    null;

  const response =
    await ai.models.embedContent({
      model: embeddingModel,
      contents: query,
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
      "Invalid query embedding."
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    "match_lesson_context",
    {
      query_embedding: embedding,
      match_threshold: 0.45,
      match_count: 5,
      filter_lesson_id: lessonId,
      context_radius: 3,
    }
  );

  if (error) {
    throw error;
  }

  console.dir(
    {
      query,
      results: data,
    },
    {
      depth: null,
    }
  );
}

main().catch((error) => {
  console.error(
    "Semantic search failed:",
    error
  );

  process.exitCode = 1;
});
