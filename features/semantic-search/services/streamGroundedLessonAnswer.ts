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

type StreamGroundedLessonAnswerParams = {
  query: string;
  contexts: LessonContextResult[];
  history?: LessonChatHistoryItem[];
};

export async function* streamGroundedLessonAnswer({
  query,
  contexts,
  history = [],
}: StreamGroundedLessonAnswerParams): AsyncGenerator<
  string,
  void,
  unknown
> {
  if (contexts.length === 0) {
    yield "لا توجد في نص الدرس معلومات كافية للإجابة عن هذا السؤال.";
    return;
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

  const responseStream =
    await ai.models.generateContentStream({
      model,
      contents: prompt,
      config: {
        temperature: 0.1,
      },
    });

  let producedText = false;

  for await (
    const chunk of responseStream
  ) {
    const text =
      chunk.text ?? "";

    if (!text) {
      continue;
    }

    producedText = true;
    yield text;
  }

  if (!producedText) {
    yield "لا توجد في نص الدرس معلومات كافية للإجابة عن هذا السؤال.";
  }
}
