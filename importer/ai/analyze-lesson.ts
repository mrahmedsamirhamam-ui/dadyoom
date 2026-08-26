import { askAI } from "./client";
import type { AILesson } from "./types";
import { SYSTEM_PROMPT } from "./prompts";

function extractJson(text: string): string {
  const fencedMatch = text.match(
    /```(?:json)?\s*([\s\S]*?)```/i
  );

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (
    firstBrace === -1 ||
    lastBrace === -1 ||
    lastBrace <= firstBrace
  ) {
    throw new Error(
      "Gemini لم يُرجع كائن JSON."
    );
  }

  return text
    .slice(firstBrace, lastBrace + 1)
    .trim();
}

function validateLesson(value: unknown): AILesson {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    throw new Error(
      "بيانات تحليل الدرس ليست كائنًا."
    );
  }

  const lesson = value as Partial<AILesson>;

  if (
    typeof lesson.title !== "string" ||
    typeof lesson.summary !== "string" ||
    !Array.isArray(lesson.objectives) ||
    !Array.isArray(lesson.vocabulary) ||
    !Array.isArray(lesson.questions)
  ) {
    throw new Error(
      "بيانات تحليل الدرس ناقصة."
    );
  }

  return lesson as AILesson;
}

async function repairJson(
  invalidJson: string
): Promise<AILesson> {
  console.log(
    "Repairing invalid Gemini JSON..."
  );

  const repairedResponse = await askAI(`
أصلح النص التالي ليصبح JSON صالحًا فقط.

ممنوع:
- إضافة شرح.
- استخدام Markdown.
- حذف البيانات الصحيحة.
- ترك أي قيمة نصية دون علامتي اقتباس.
- استخدام فاصلة زائدة.

يجب أن يحتوي الناتج على:

{
  "title": "string",
  "summary": "string",
  "objectives": ["string"],
  "vocabulary": [
    {
      "word": "string",
      "meaning": "string",
      "example": "string"
    }
  ],
  "questions": [
    {
      "question": "string",
      "type": "multiple_choice",
      "options": [
        {
          "id": "a",
          "text": "string"
        }
      ],
      "answer": "a",
      "explanation": "string"
    }
  ]
}

النص غير الصالح:

${invalidJson}
`);

  const repairedJson =
    extractJson(repairedResponse);

  return validateLesson(
    JSON.parse(repairedJson)
  );
}

export async function analyzeLesson(
  lessonText: string
): Promise<AILesson> {
  const prompt = `
${SYSTEM_PROMPT}

حلّل النص التالي وأعد JSON صالحًا فقط بهذا الشكل:

{
  "title": "عنوان الدرس",
  "summary": "ملخص مناسب للصف الرابع",
  "objectives": [
    "هدف أول",
    "هدف ثان"
  ],
  "vocabulary": [
    {
      "word": "الكلمة",
      "meaning": "المعنى",
      "example": "مثال صحيح"
    }
  ],
  "questions": [
    {
      "question": "نص السؤال",
      "type": "multiple_choice",
      "options": [
        {
          "id": "a",
          "text": "الاختيار الأول"
        },
        {
          "id": "b",
          "text": "الاختيار الثاني"
        },
        {
          "id": "c",
          "text": "الاختيار الثالث"
        },
        {
          "id": "d",
          "text": "الاختيار الرابع"
        }
      ],
      "answer": "b",
      "explanation": "تفسير الإجابة"
    }
  ]
}

الشروط:
- استخدم علامتي اقتباس حول جميع النصوص.
- لا تضع أي قيمة عربية دون علامتي اقتباس.
- لا تستخدم Markdown.
- لا تضع فاصلة بعد آخر عنصر.
- اجعل المحتوى مناسبًا للصف الرابع.
- استخرج من 5 إلى 10 مفردات.
- أنشئ 3 أسئلة على الأقل.
- أعد JSON فقط.

نص الدرس:

${lessonText}
`;

  const response = await askAI(prompt);
  const json = extractJson(response);

  try {
    return validateLesson(
      JSON.parse(json)
    );
  } catch {
    console.error(
      "Invalid JSON received from Gemini."
    );

    return repairJson(json);
  }
}
