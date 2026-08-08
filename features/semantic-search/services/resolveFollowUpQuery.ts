import {
  GoogleGenAI,
} from "@google/genai";

import type {
  LessonChatHistoryItem,
} from "../chat/LessonChatContext";

type ResolveFollowUpQueryParams = {
  query: string;
  history: LessonChatHistoryItem[];
};

const FAILED_ANSWER_PATTERNS = [
  "لا توجد في نص الدرس معلومات كافية",
  "لا توجد معلومات كافية",
  "تعذر الحصول على الإجابة",
  "حدث خطأ",
];

function isFailedAnswer(
  message: LessonChatHistoryItem
): boolean {
  return (
    message.role === "assistant" &&
    FAILED_ANSWER_PATTERNS.some(
      (pattern) =>
        message.content.includes(pattern)
    )
  );
}

export async function resolveFollowUpQuery({
  query,
  history,
}: ResolveFollowUpQueryParams): Promise<string> {
  const normalizedQuery =
    query.trim();

  if (
    history.length === 0 ||
    normalizedQuery.length > 35
  ) {
    return normalizedQuery;
  }

  const cleanHistory = history
    .filter(
      (message) =>
        !isFailedAnswer(message)
    )
    .slice(-8);

  if (cleanHistory.length === 0) {
    return normalizedQuery;
  }

  const apiKey =
    process.env.GEMINI_API_KEY_BACKUP ||
    process.env.GEMINI_API_KEY;

  const model =
    process.env.GEMINI_MODEL_BACKUP ||
    process.env.GEMINI_MODEL ||
    "gemini-3.5-flash-lite";

  if (!apiKey) {
    return normalizedQuery;
  }

  const recentHistory = cleanHistory
    .map((message) => {
      const speaker =
        message.role === "user"
          ? "الطالب"
          : "ضاد";

      return `${speaker}: ${message.content}`;
    })
    .join("\n");

  const prompt = `
مهمتك إعادة صياغة سؤال المتابعة الأخير ليصبح سؤالًا عربيًا مستقلًا ومكتملًا.

استخدم آخر سؤال واضح للطالب وآخر إجابة صحيحة من ضاد لفهم كلمات مثل:
لماذا، وكيف، هو، هي، ذلك، هذه، بهذا الشكل.

قواعد إلزامية:
1. لا تجب عن السؤال.
2. لا تنقل رسائل الخطأ أو عبارات عدم كفاية المعلومات إلى السؤال.
3. حافظ على نوع السؤال:
   - "لماذا؟" يجب أن يصبح سؤالًا عن السبب.
   - "كيف؟" يجب أن يصبح سؤالًا عن الكيفية.
4. لا تحول سؤال "لماذا" إلى سؤال "كيف".
5. أعد السؤال المستقل فقط دون مقدمة أو شرح.

مثال:
المحادثة:
الطالب: كيف كان الرجل يقسم محصول الحديقة؟
ضاد: كان يقسمه إلى ثلاثة أثلاث.
السؤال الأخير: ولماذا؟

الناتج الصحيح:
لماذا كان الرجل يقسم محصول الحديقة إلى ثلاثة أثلاث؟

المحادثة الحالية:
${recentHistory}

السؤال الأخير:
${normalizedQuery}
`;

  try {
    const ai = new GoogleGenAI({
      apiKey,
    });

    const response =
      await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0,
        },
      });

    const resolved =
      response.text
        ?.trim()
        .replace(/^["«]|["»]$/gu, "");

    return resolved ||
      normalizedQuery;
  } catch (error) {
    console.error(
      "FOLLOW_UP_QUERY_RESOLUTION_FAILED",
      error
    );

    return normalizedQuery;
  }
}
