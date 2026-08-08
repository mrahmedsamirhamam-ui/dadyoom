import {
  GoogleGenAI,
} from "@google/genai";

const EMBEDDING_DIMENSIONS = 1536;

export async function createQueryEmbedding(
  query: string
): Promise<number[]> {
  const apiKey =
    process.env.GEMINI_API_KEY_BACKUP ||
    process.env.GEMINI_API_KEY;

  const model =
    process.env.GEMINI_EMBEDDING_MODEL ||
    "gemini-embedding-2";

  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing."
    );
  }

  const normalizedQuery =
    query.trim();

  if (!normalizedQuery) {
    throw new Error(
      "Search query is empty."
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  const response =
    await ai.models.embedContent({
      model,
      contents: normalizedQuery,
      config: {
        outputDimensionality:
          EMBEDDING_DIMENSIONS,
      },
    });

  const embedding =
    response.embeddings?.[0]?.values;

  if (
    !embedding ||
    embedding.length !==
      EMBEDDING_DIMENSIONS
  ) {
    throw new Error(
      `Invalid embedding dimensions: ${
        embedding?.length ?? 0
      }`
    );
  }

  return embedding;
}
