import { logger } from "@/lib/logger";
import {
  GoogleGenAI,
} from "@google/genai";

import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  createQuestionHash,
} from "@/features/assessment/services/createQuestionHash";

import {
  isSemanticallyDuplicateQuestion,
} from "@/features/assessment/services/isSemanticallyDuplicateQuestion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GeneratedAssessment = {
  question: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
  skill: string;
  difficulty: "easy" | "medium" | "hard";
};

type LessonRow = {
  id: string;
  title: string;
  content: string | null;
  status: string | null;
};

function cleanJsonResponse(
  value: string
): string {
  return value
    .trim()
    .replace(/^```json\s*/iu, "")
    .replace(/^```\s*/u, "")
    .replace(/\s*```$/u, "")
    .trim();
}

function validateAssessment(
  value: unknown,
  requestedSkill: string
): GeneratedAssessment {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    throw new Error(
      "Ø£Ø¹Ø§Ø¯ Ù†Ù…ÙˆØ°Ø¬ Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ Ù†ØªÙŠØ¬Ø© ØºÙŠØ± ØµØ§Ù„Ø­Ø©."
    );
  }

  const assessment =
    value as Partial<GeneratedAssessment>;

  const returnedSkill =
    typeof assessment.skill === "string"
      ? assessment.skill.trim()
      : "";

  if (returnedSkill !== requestedSkill) {
    throw new Error(
      `Gemini returned skill "${returnedSkill}" instead of "${requestedSkill}".`
    );
  }

  if (
    typeof assessment.question !==
      "string" ||
    !assessment.question.trim()
  ) {
    throw new Error(
      "Ù„Ù… ÙŠØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¤Ø§Ù„ ØµØ§Ù„Ø­."
    );
  }

  if (
    !Array.isArray(
      assessment.choices
    ) ||
    assessment.choices.length !== 4 ||
    assessment.choices.some(
      (choice) =>
        typeof choice !== "string" ||
        !choice.trim()
    )
  ) {
    throw new Error(
      "ÙŠØ¬Ø¨ Ø£Ù† ÙŠØ­ØªÙˆÙŠ Ø§Ù„Ø³Ø¤Ø§Ù„ Ø¹Ù„Ù‰ Ø£Ø±Ø¨Ø¹Ø© Ø§Ø®ØªÙŠØ§Ø±Ø§Øª."
    );
  }

  if (
    !Number.isInteger(
      assessment.correctAnswer
    ) ||
    assessment.correctAnswer ===
      undefined ||
    assessment.correctAnswer < 0 ||
    assessment.correctAnswer > 3
  ) {
    throw new Error(
      "Ø±Ù‚Ù… Ø§Ù„Ø¥Ø¬Ø§Ø¨Ø© Ø§Ù„ØµØ­ÙŠØ­Ø© ØºÙŠØ± ØµØ§Ù„Ø­."
    );
  }

  const difficulty =
    assessment.difficulty ===
      "medium" ||
    assessment.difficulty ===
      "hard"
      ? assessment.difficulty
      : "easy";

  return {
    question:
      assessment.question.trim(),

    choices:
      assessment.choices.map(
        (choice) =>
          choice.trim()
      ),

    correctAnswer:
      assessment.correctAnswer,

    explanation:
      typeof assessment.explanation ===
        "string"
        ? assessment.explanation.trim()
        : "",

    skill:
      typeof assessment.skill ===
        "string" &&
      assessment.skill.trim()
        ? assessment.skill.trim()
        : "Ø§Ù„Ø§Ø³ØªÙŠØ¹Ø§Ø¨",

    difficulty,
  };
}

function getApiErrorStatus(
  error: unknown
): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  return null;
}

function wait(
  milliseconds: number
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function generateWithRetry({
  ai,
  prompt,
  models,
}: {
  ai: GoogleGenAI;
  prompt: string;
  models: string[];
}): Promise<{
  rawText: string;
  usedModel: string;
}> {
  let lastError: unknown = null;

  for (const model of models) {
    for (
      let attempt = 1;
      attempt <= 3;
      attempt += 1
    ) {
      try {
        const response =
          await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              temperature: 0.35,
              responseMimeType:
                "application/json",
            },
          });

        const rawText =
          response.text?.trim();

        if (!rawText) {
          throw new Error(
            "Ù„Ù… ÙŠÙØ±Ø¬Ø¹ Gemini Ø³Ø¤Ø§Ù„Ù‹Ø§."
          );
        }

        return {
          rawText,
          usedModel: model,
        };
      } catch (error) {
        lastError = error;

        const status =
          getApiErrorStatus(error);

        const retryable =
          status === 429 ||
          status === 503;

        console.warn(
          "ASSESSMENT_MODEL_ATTEMPT_FAILED",
          {
            model,
            attempt,
            status,
          }
        );

        if (!retryable) {
          throw error;
        }

        if (attempt < 3) {
          await wait(
            attempt * 1500
          );
        }
      }
    }
  }

  throw new Error(
    lastError instanceof Error
      ? `ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø³Ø¤Ø§Ù„ Ø¨Ø¹Ø¯ Ø¹Ø¯Ø© Ù…Ø­Ø§ÙˆÙ„Ø§Øª: ${lastError.message}`
      : "Ø®Ø¯Ù…Ø© Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø£Ø³Ø¦Ù„Ø© Ù…Ø´ØºÙˆÙ„Ø© Ù…Ø¤Ù‚ØªÙ‹Ø§. Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ Ø¨Ø¹Ø¯ Ù‚Ù„ÙŠÙ„."
  );
}

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const lessonId =
      searchParams
        .get("lessonId")
        ?.trim();

    const requestedDifficulty =
      searchParams
        .get("difficulty")
        ?.trim();

    const difficulty:
      "easy" | "medium" | "hard" =
      requestedDifficulty === "hard"
        ? "hard"
        : requestedDifficulty === "medium"
          ? "medium"
          : "easy";

    if (!lessonId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø¯Ø±Ø³ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      await createClient();

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user?.email
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ø¥Ù†Ø´Ø§Ø¡ Ø§Ø®ØªØ¨Ø§Ø± Ø°ÙƒÙŠ.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: lessonData,
      error: lessonError,
    } = await supabase
      .from("lessons")
      .select(
        "id,title,content,status"
      )
      .eq("id", lessonId)
      .maybeSingle();

    if (
      lessonError ||
      !lessonData
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ø¯Ø±Ø³.",
        },
        {
          status: 404,
        }
      );
    }

    const lesson =
      lessonData as LessonRow;

    const lessonContent =
      lesson.content?.trim();

    if (!lessonContent) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ù„Ø§ ÙŠØ­ØªÙˆÙŠ Ø§Ù„Ø¯Ø±Ø³ Ø¹Ù„Ù‰ Ù†Øµ ÙŠÙ…ÙƒÙ† Ø¥Ù†Ø´Ø§Ø¡ Ø§Ø®ØªØ¨Ø§Ø± Ù…Ù†Ù‡.",
        },
        {
          status: 400,
        }
      );
    }

    const apiKey =
      process.env
        .GEMINI_API_KEY_BACKUP ||
      process.env.GEMINI_API_KEY;

    const models = Array.from(
      new Set(
        [
          process.env.GEMINI_MODEL_BACKUP,
          process.env.GEMINI_MODEL,
          "gemini-3.5-flash-lite",
        ].filter(
          (value): value is string =>
            Boolean(value?.trim())
        )
      )
    );

    if (!apiKey) {
      throw new Error(
        "Ù…ÙØªØ§Ø­ Gemini ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯."
      );
    }

    const ai =
      new GoogleGenAI({
        apiKey,
      });

    const sourceText =
      lessonContent.slice(
        0,
        12000
      );

    const {
      data: previousAssessments,
      error: previousError,
    } = await supabase
      .from("ai_assessments")
      .select("question")
      .eq("student_email", user.email)
      .eq("lesson_id", lesson.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(10);

    if (previousError) {
      console.warn(
        "PREVIOUS_ASSESSMENTS_LOAD_FAILED",
        previousError
      );
    }

    const previousQuestions =
      (previousAssessments ?? [])
        .map((item) =>
          typeof item.question === "string"
            ? item.question.trim()
            : ""
        )
        .filter(Boolean);

    const previousQuestionsText =
      previousQuestions.length > 0
        ? previousQuestions
            .map(
              (question, index) =>
                `${index + 1}. ${question}`
            )
            .join("\n")
        : "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ø³Ø¦Ù„Ø© Ø³Ø§Ø¨Ù‚Ø©.";

    const difficultyInstruction =
      difficulty === "hard"
        ? `
Ø£Ù†Ø´Ø¦ Ø³Ø¤Ø§Ù„Ù‹Ø§ Ù…ØªÙ‚Ø¯Ù…Ù‹Ø§ ÙŠØ­ØªØ§Ø¬ Ø¥Ù„Ù‰ Ø§Ù„Ø§Ø³ØªÙ†ØªØ§Ø¬ Ø£Ùˆ ÙÙ‡Ù… Ø§Ù„Ø¹Ù„Ø§Ù‚Ø© Ø¨ÙŠÙ† Ø£Ø­Ø¯Ø§Ø« Ø§Ù„Ù†Øµ.
Ù„Ø§ ØªØ¬Ø¹Ù„ Ø§Ù„Ø¥Ø¬Ø§Ø¨Ø© Ù…Ø¬Ø±Ø¯ Ù†Ù‚Ù„ Ù…Ø¨Ø§Ø´Ø± Ù…Ù† Ø¬Ù…Ù„Ø© ÙˆØ§Ø­Ø¯Ø©.
`
        : difficulty === "medium"
          ? `
Ø£Ù†Ø´Ø¦ Ø³Ø¤Ø§Ù„Ù‹Ø§ Ù…ØªÙˆØ³Ø·Ù‹Ø§ ÙŠØ¬Ù…Ø¹ Ø¨ÙŠÙ† Ø§Ù„ÙÙ‡Ù… Ø§Ù„Ù…Ø¨Ø§Ø´Ø± ÙˆØ§Ù„Ø§Ø³ØªÙ†ØªØ§Ø¬ Ø§Ù„Ø¨Ø³ÙŠØ·.
`
          : `
Ø£Ù†Ø´Ø¦ Ø³Ø¤Ø§Ù„Ù‹Ø§ Ø³Ù‡Ù„Ù‹Ø§ ÙˆÙˆØ§Ø¶Ø­Ù‹Ø§ ÙŠØ¹ØªÙ…Ø¯ Ø¹Ù„Ù‰ Ù…Ø¹Ù„ÙˆÙ…Ø© ØµØ±ÙŠØ­Ø© ÙÙŠ Ø§Ù„Ù†Øµ.
`;

    const questionNumber =
      previousQuestions.length + 1;

    const {
      data: latestPlan,
      error: latestPlanError,
    } = await supabase
      .from("learning_plans")
      .select("focus_skill")
      .eq(
        "student_email",
        user.email
      )
      .not(
        "focus_skill",
        "is",
        null
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (latestPlanError) {
      console.warn(
        "ASSESSMENT_LEARNING_PLAN_QUERY_WARNING",
        latestPlanError
      );
    }

    const fallbackSkill =
      "\u0627\u0644\u0627\u0633\u062a\u064a\u0639\u0627\u0628 \u0627\u0644\u0645\u0628\u0627\u0634\u0631";

    const requestedSkill =
      typeof latestPlan?.focus_skill ===
        "string" &&
      latestPlan.focus_skill.trim()
        ? latestPlan.focus_skill.trim()
        : fallbackSkill;

    logger.info(
      "ASSESSMENT_REQUESTED_SKILL",
      {
        requestedSkill,
        source:
          latestPlan?.focus_skill
            ? "learning_plan"
            : "fallback",
      }
    );

    const prompt = `
Ø£Ù†Øª Ù…Ø¹Ù„Ù… Ù„ØºØ© Ø¹Ø±Ø¨ÙŠØ© Ù„Ù„ØµÙ Ø§Ù„Ø±Ø§Ø¨Ø¹.

Ø£Ù†Ø´Ø¦ Ø³Ø¤Ø§Ù„ Ø§Ø®ØªÙŠØ§Ø± Ù…Ù† Ù…ØªØ¹Ø¯Ø¯ Ø¬Ø¯ÙŠØ¯Ù‹Ø§ Ø§Ø¹ØªÙ…Ø§Ø¯Ù‹Ø§ ÙÙ‚Ø· Ø¹Ù„Ù‰ Ù†Øµ Ø§Ù„Ø¯Ø±Ø³ Ø§Ù„Ø¢ØªÙŠ.

Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¯Ø±Ø³:
${lesson.title}

Ø±Ù‚Ù… Ø§Ù„Ø³Ø¤Ø§Ù„ ÙÙŠ Ø§Ù„Ø¬Ù„Ø³Ø©:
${questionNumber}

Ø§Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨:
${difficulty}

Ø§Ù„Ù…Ù‡Ø§Ø±Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„Ø³Ø¤Ø§Ù„:
${requestedSkill}

Ù‚ÙŠØ¯ Ø¥Ù„Ø²Ø§Ù…ÙŠ:
- Ø£Ù†Ø´Ø¦ Ø§Ù„Ø³Ø¤Ø§Ù„ Ù„Ù‚ÙŠØ§Ø³ Ù…Ù‡Ø§Ø±Ø© "${requestedSkill}" ÙÙ‚Ø·.
- Ù„Ø§ ØªØºÙŠÙ‘Ø± Ø§Ø³Ù… Ø§Ù„Ù…Ù‡Ø§Ø±Ø©.
- Ù„Ø§ ØªÙ†Ø´Ø¦ Ø³Ø¤Ø§Ù„Ù‹Ø§ ÙŠÙ‚ÙŠØ³ Ù…Ù‡Ø§Ø±Ø© Ø£Ø®Ø±Ù‰.
- Ø£Ø¹Ø¯ Ù‚ÙŠÙ…Ø© skill ÙÙŠ JSON Ù…Ø³Ø§ÙˆÙŠØ© ØªÙ…Ø§Ù…Ù‹Ø§ Ù„Ù€ "${requestedSkill}".

${difficultyInstruction}

Ø§Ù„Ø£Ø³Ø¦Ù„Ø© Ø§Ù„ØªÙŠ ØªÙ… ØªÙˆÙ„ÙŠØ¯Ù‡Ø§ Ø³Ø§Ø¨Ù‚Ù‹Ø§:
${previousQuestionsText}

Ù‚ÙˆØ§Ø¹Ø¯ Ø¥Ù„Ø²Ø§Ù…ÙŠØ©:
1. Ù„Ø§ ØªÙƒØ±Ø± Ø£ÙŠ Ø³Ø¤Ø§Ù„ Ø³Ø§Ø¨Ù‚ Ø­Ø±ÙÙŠÙ‹Ø§ Ø£Ùˆ Ù…Ø¹Ù†ÙˆÙŠÙ‹Ø§.
2. Ù„Ø§ ØªØ³Ø£Ù„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ Ø¹Ù† Ø§Ù„ÙÙƒØ±Ø© Ù†ÙØ³Ù‡Ø§ Ø¨ØµÙŠØ§ØºØ© Ù…Ø®ØªÙ„ÙØ©.
3. Ø§Ø®ØªØ± Ù…Ø¹Ù„ÙˆÙ…Ø© Ø£Ùˆ Ù…Ù‡Ø§Ø±Ø© Ù…Ø®ØªÙ„ÙØ© Ø¹Ù† Ø§Ù„Ø£Ø³Ø¦Ù„Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©.
4. Ù„Ø§ ØªÙ†Ø´Ø¦ Ù‚ØµØ© Ø£Ùˆ Ø´Ø®ØµÙŠØ© Ø£Ùˆ Ø­Ø¯Ø«Ù‹Ø§ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯ ÙÙŠ Ø§Ù„Ù†Øµ.
5. Ø§Ø¬Ø¹Ù„ Ø¥Ø¬Ø§Ø¨Ø© ÙˆØ§Ø­Ø¯Ø© ÙÙ‚Ø· ØµØ­ÙŠØ­Ø©.
6. Ø§Ø¬Ø¹Ù„ Ø§Ù„Ø§Ø®ØªÙŠØ§Ø±Ø§Øª Ø§Ù„Ø®Ø§Ø·Ø¦Ø© Ù…Ø¹Ù‚ÙˆÙ„Ø© Ù„ÙƒÙ†Ù‡Ø§ ØºÙŠØ± ØµØ­ÙŠØ­Ø©.
7. ÙŠØ¬Ø¨ Ø£Ù† ØªØªÙˆØ§ÙÙ‚ ØµØ¹ÙˆØ¨Ø© Ø§Ù„Ø³Ø¤Ø§Ù„ Ù…Ø¹ Ø§Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨.
8. Ù„Ø§ ØªØ¹ØªÙ…Ø¯ Ø¹Ù„Ù‰ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ù…Ù† Ø®Ø§Ø±Ø¬ Ø§Ù„Ù†Øµ.

Ù†Øµ Ø§Ù„Ø¯Ø±Ø³:
${sourceText}

Ø£Ø¹Ø¯ JSON ØµØ§Ù„Ø­Ù‹Ø§ ÙÙ‚Ø· Ø¨Ø§Ù„Ø´ÙƒÙ„ Ø§Ù„Ø¢ØªÙŠ:

{
  "question": "Ø³Ø¤Ø§Ù„ Ø¬Ø¯ÙŠØ¯ Ù„Ù… ÙŠØ³Ø¨Ù‚ Ø·Ø±Ø­Ù‡",
  "choices": [
    "Ø§Ù„Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø£ÙˆÙ„",
    "Ø§Ù„Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø«Ø§Ù†ÙŠ",
    "Ø§Ù„Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø«Ø§Ù„Ø«",
    "Ø§Ù„Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø±Ø§Ø¨Ø¹"
  ],
  "correctAnswer": 0,
  "explanation": "ØªÙØ³ÙŠØ± Ø§Ù„Ø¥Ø¬Ø§Ø¨Ø© Ø§Ø¹ØªÙ…Ø§Ø¯Ù‹Ø§ Ø¹Ù„Ù‰ Ø§Ù„Ù†Øµ",
  "skill": "${requestedSkill}",
  "difficulty": "${difficulty}"
}

Ù…Ù„Ø§Ø­Ø¸Ø§Øª:
- correctAnswer Ø±Ù‚Ù… ÙŠØ¨Ø¯Ø£ Ù…Ù† 0 ÙˆÙŠÙ†ØªÙ‡ÙŠ Ø¹Ù†Ø¯ 3.
- Ù„Ø§ ØªØ¶Ù Ø£ÙŠ Ù†Øµ Ù‚Ø¨Ù„ JSON Ø£Ùˆ Ø¨Ø¹Ø¯Ù‡.
`;

    let generated:
      GeneratedAssessment | null =
        null;

    let questionHash = "";
    let usedModel = "";

    const maximumQuestionAttempts = 3;

    for (
      let generationAttempt = 1;
      generationAttempt <=
        maximumQuestionAttempts;
      generationAttempt += 1
    ) {
      const generationResult =
        await generateWithRetry({
          ai,
          prompt: `${prompt}

Ù…Ø­Ø§ÙˆÙ„Ø© ØªÙˆÙ„ÙŠØ¯ Ø§Ù„Ø³Ø¤Ø§Ù„:
${generationAttempt}

Ø£Ù†Ø´Ø¦ Ø³Ø¤Ø§Ù„Ù‹Ø§ Ù…Ø®ØªÙ„ÙÙ‹Ø§ Ø¨ÙˆØ¶ÙˆØ­ Ø¹Ù† Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø£Ø³Ø¦Ù„Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©.`,
          models,
        });

      const candidate =
        validateAssessment(JSON.parse(cleanJsonResponse(generationResult.rawText)), requestedSkill);

      const candidateHash =
        createQuestionHash(
          candidate.question
        );

      const {
        data: duplicateQuestion,
        error: duplicateError,
      } = await supabase
        .from("ai_assessments")
        .select("id")
        .eq(
          "student_email",
          user.email
        )
        .eq(
          "lesson_id",
          lesson.id
        )
        .eq(
          "question_hash",
          candidateHash
        )
        .limit(1)
        .maybeSingle();

      if (duplicateError) {
        throw duplicateError;
      }

      if (duplicateQuestion) {
        console.warn(
          "DUPLICATE_ASSESSMENT_QUESTION",
          {
            generationAttempt,
            question:
              candidate.question,
          }
        );

        continue;
      }

      const semanticCheck =
        await isSemanticallyDuplicateQuestion({
          candidateQuestion:
            candidate.question,
          previousQuestions,
          threshold: 0.92,
        });

      if (semanticCheck.duplicate) {
        console.warn(
          "SEMANTIC_DUPLICATE_ASSESSMENT_QUESTION",
          {
            generationAttempt,
            similarity:
              Number(
                semanticCheck.similarity.toFixed(
                  4
                )
              ),
            candidateQuestion:
              candidate.question,
            matchedQuestion:
              semanticCheck.matchedQuestion,
          }
        );

        continue;
      }

      generated = candidate;
      questionHash =
        candidateHash;
      usedModel =
        generationResult.usedModel;

      break;
    }

    if (
      !generated ||
      !questionHash ||
      !usedModel
    ) {
      throw new Error(
        "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø³Ø¤Ø§Ù„ Ø¬Ø¯ÙŠØ¯ ØºÙŠØ± Ù…ÙƒØ±Ø± Ø¨Ø¹Ø¯ Ø¹Ø¯Ø© Ù…Ø­Ø§ÙˆÙ„Ø§Øª."
      );
    }

    const {
      data: savedAssessment,
      error: insertError,
    } = await supabase
      .from("ai_assessments")
      .insert({
        student_email:
          user.email,
        lesson_id:
          lesson.id,
        title: lesson.title,
        passage: sourceText,
        question:
          generated.question,
        question_hash:
          questionHash,
        choices:
          generated.choices,
        correct_answer:
          generated.correctAnswer,
        explanation:
          generated.explanation,
        skill:
          generated.skill,
        difficulty:
          generated.difficulty,
        completed: false,
      })
      .select("*")
      .single();

    if (
      insertError ||
      !savedAssessment
    ) {
      throw new Error(
        `ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø±: ${
          insertError?.message ??
          "Ø®Ø·Ø£ ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ"
        }`
      );
    }

    return NextResponse.json({
      success: true,
      assessment: {
        id:
          savedAssessment.id,
        lessonId:
          lesson.id,
        title:
          savedAssessment.title,
        passage:
          savedAssessment.passage,
        question:
          savedAssessment.question,
        choices:
          savedAssessment.choices,
        correctAnswer:
          savedAssessment
            .correct_answer,
        explanation:
          savedAssessment
            .explanation,
        skill:
          savedAssessment.skill,
        difficulty:
          savedAssessment
            .difficulty,
        completed:
          savedAssessment.completed,
        createdAt:
          savedAssessment
            .created_at,
      },
      provider: "gemini",
      model: usedModel,
    });
    } catch (error) {
    console.error(
      "AI_ASSESSMENT_ROUTE_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Ø­Ø¯Ø« Ø®Ø·Ø£ ØºÙŠØ± Ù…ØªÙˆÙ‚Ø¹ Ø£Ø«Ù†Ø§Ø¡ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø±.",
      },
      {
        status: 500,
      }
    );
  }
}
