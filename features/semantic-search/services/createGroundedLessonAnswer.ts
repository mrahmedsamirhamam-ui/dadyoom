import {
  GoogleGenAI,
} from "@google/genai";

import type {
  LessonChatHistoryItem,
} from "../chat/LessonChatContext";

import {
  buildConversationPrompt,
} from "../chat/buildConversationPrompt";

import type {
  LessonContextResult,
} from "./searchLessonContext";

type CreateGroundedLessonAnswerParams = {
  query: string;
  contexts: LessonContextResult[];
  history?: LessonChatHistoryItem[];
};

export async function createGroundedLessonAnswer({
  query,
  contexts,
  history = [],
}: CreateGroundedLessonAnswerParams): Promise<string | null> {
  if (contexts.length === 0) {
    return null;
  }

  const apiKey =
    process.env.GEMINI_API_KEY_BACKUP ||
    process.env.GEMINI_API_KEY;

  const model =
    process.env.GEMINI_MODEL_BACKUP ||
    process.env.GEMINI_MODEL ||
    "gemini-3.5-flash-lite";

  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing."
    );
  }

  const uniqueContexts = Array.from(
    new Set(
      contexts
        .slice(0, 5)
        .map((item) =>
          item.context_text
            .replace(/\s+/gu, " ")
            .trim()
        )
        .filter(Boolean)
    )
  );

  const prompt =
    buildConversationPrompt({
      query,
      contexts: uniqueContexts,
      history,
    });

  const ai = new GoogleGenAI({
    apiKey,
  });

  const response =
    await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.1,
      },
    });

  return response.text?.trim() ?? null;
}
