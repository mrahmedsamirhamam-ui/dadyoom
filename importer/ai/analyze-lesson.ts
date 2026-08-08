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
      "Gemini Ù„Ù… ÙŠÙØ±Ø¬Ø¹ ÙƒØ§Ø¦Ù† JSON."
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
      "Ø¨ÙŠØ§Ù†Ø§Øª ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø¯Ø±Ø³ Ù„ÙŠØ³Øª ÙƒØ§Ø¦Ù†Ù‹Ø§."
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
      "Ø¨ÙŠØ§Ù†Ø§Øª ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø¯Ø±Ø³ Ù†Ø§Ù‚ØµØ©."
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
Ø£ØµÙ„Ø­ Ø§Ù„Ù†Øµ Ø§Ù„ØªØ§Ù„ÙŠ Ù„ÙŠØµØ¨Ø­ JSON ØµØ§Ù„Ø­Ù‹Ø§ ÙÙ‚Ø·.

Ù…Ù…Ù†ÙˆØ¹:
- Ø¥Ø¶Ø§ÙØ© Ø´Ø±Ø­.
- Ø§Ø³ØªØ®Ø¯Ø§Ù… Markdown.
- Ø­Ø°Ù Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØµØ­ÙŠØ­Ø©.
- ØªØ±Ùƒ Ø£ÙŠ Ù‚ÙŠÙ…Ø© Ù†ØµÙŠØ© Ø¯ÙˆÙ† Ø¹Ù„Ø§Ù…ØªÙŠ Ø§Ù‚ØªØ¨Ø§Ø³.
- Ø§Ø³ØªØ®Ø¯Ø§Ù… ÙØ§ØµÙ„Ø© Ø²Ø§Ø¦Ø¯Ø©.

ÙŠØ¬Ø¨ Ø£Ù† ÙŠØ­ØªÙˆÙŠ Ø§Ù„Ù†Ø§ØªØ¬ Ø¹Ù„Ù‰:

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

Ø§Ù„Ù†Øµ ØºÙŠØ± Ø§Ù„ØµØ§Ù„Ø­:

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

Ø­Ù„Ù‘Ù„ Ø§Ù„Ù†Øµ Ø§Ù„ØªØ§Ù„ÙŠ ÙˆØ£Ø¹Ø¯ JSON ØµØ§Ù„Ø­Ù‹Ø§ ÙÙ‚Ø· Ø¨Ù‡Ø°Ø§ Ø§Ù„Ø´ÙƒÙ„:

{
  "title": "Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¯Ø±Ø³",
  "summary": "Ù…Ù„Ø®Øµ Ù…Ù†Ø§Ø³Ø¨ Ù„Ù„ØµÙ Ø§Ù„Ø±Ø§Ø¨Ø¹",
  "objectives": [
    "Ù‡Ø¯Ù Ø£ÙˆÙ„",
    "Ù‡Ø¯Ù Ø«Ø§Ù†"
  ],
  "vocabulary": [
    {
      "word": "Ø§Ù„ÙƒÙ„Ù…Ø©",
      "meaning": "Ø§Ù„Ù…Ø¹Ù†Ù‰",
      "example": "Ù…Ø«Ø§Ù„ ØµØ­ÙŠØ­"
    }
  ],
  "questions": [
    {
      "question": "Ù†Øµ Ø§Ù„Ø³Ø¤Ø§Ù„",
      "type": "multiple_choice",
      "options": [
        {
          "id": "a",
          "text": "Ø§Ù„Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø£ÙˆÙ„"
        },
        {
          "id": "b",
          "text": "Ø§Ù„Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø«Ø§Ù†ÙŠ"
        },
        {
          "id": "c",
          "text": "Ø§Ù„Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø«Ø§Ù„Ø«"
        },
        {
          "id": "d",
          "text": "Ø§Ù„Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø±Ø§Ø¨Ø¹"
        }
      ],
      "answer": "b",
      "explanation": "ØªÙØ³ÙŠØ± Ø§Ù„Ø¥Ø¬Ø§Ø¨Ø©"
    }
  ]
}

Ø§Ù„Ø´Ø±ÙˆØ·:
- Ø§Ø³ØªØ®Ø¯Ù… Ø¹Ù„Ø§Ù…ØªÙŠ Ø§Ù‚ØªØ¨Ø§Ø³ Ø­ÙˆÙ„ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù†ØµÙˆØµ.
- Ù„Ø§ ØªØ¶Ø¹ Ø£ÙŠ Ù‚ÙŠÙ…Ø© Ø¹Ø±Ø¨ÙŠØ© Ø¯ÙˆÙ† Ø¹Ù„Ø§Ù…ØªÙŠ Ø§Ù‚ØªØ¨Ø§Ø³.
- Ù„Ø§ ØªØ³ØªØ®Ø¯Ù… Markdown.
- Ù„Ø§ ØªØ¶Ø¹ ÙØ§ØµÙ„Ø© Ø¨Ø¹Ø¯ Ø¢Ø®Ø± Ø¹Ù†ØµØ±.
- Ø§Ø¬Ø¹Ù„ Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ù…Ù†Ø§Ø³Ø¨Ù‹Ø§ Ù„Ù„ØµÙ Ø§Ù„Ø±Ø§Ø¨Ø¹.
- Ø§Ø³ØªØ®Ø±Ø¬ Ù…Ù† 5 Ø¥Ù„Ù‰ 10 Ù…ÙØ±Ø¯Ø§Øª.
- Ø£Ù†Ø´Ø¦ 3 Ø£Ø³Ø¦Ù„Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„.
- Ø£Ø¹Ø¯ JSON ÙÙ‚Ø·.

Ù†Øµ Ø§Ù„Ø¯Ø±Ø³:

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
