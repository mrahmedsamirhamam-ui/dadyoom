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
      "أعاد نموذج الذكاء الاصطناعي نتيجة غير صالحة."
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
      "لم يتم إنشاء سؤال صالح."
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
      "يجب أن يحتوي السؤال على أربعة اختيارات."
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
      "رقم الإجابة الصحيحة غير صالح."
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
        : "الاستيعاب",

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
            "لم يُرجع Gemini سؤالًا."
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
      ? `تعذر إنشاء السؤال بعد عدة محاولات: ${lastError.message}`
      : "خدمة إنشاء الأسئلة مشغولة مؤقتًا. حاول مرة أخرى بعد قليل."
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
            "تعذر تحديد الدرس المطلوب.",
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
            "يجب تسجيل الدخول لإنشاء اختبار ذكي.",
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
            "لم يتم العثور على الدرس.",
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
            "لا يحتوي الدرس على نص يمكن إنشاء اختبار منه.",
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
        "مفتاح Gemini غير موجود."
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
        : "لا توجد أسئلة سابقة.";

    const difficultyInstruction =
      difficulty === "hard"
        ? `
أنشئ سؤالًا متقدمًا يحتاج إلى الاستنتاج أو فهم العلاقة بين أحداث النص.
لا تجعل الإجابة مجرد نقل مباشر من جملة واحدة.
`
        : difficulty === "medium"
          ? `
أنشئ سؤالًا متوسطًا يجمع بين الفهم المباشر والاستنتاج البسيط.
`
          : `
أنشئ سؤالًا سهلًا وواضحًا يعتمد على معلومة صريحة في النص.
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
أنت معلم لغة عربية خبير. راعِ مستوى الطالب ومحتوى الدرس، ولا تفترض صفًا دراسيًا غير مذكور.

أنشئ سؤال اختيار من متعدد جديدًا اعتمادًا فقط على نص الدرس الآتي.

عنوان الدرس:
${lesson.title}

رقم السؤال في الجلسة:
${questionNumber}

المستوى المطلوب:
${difficulty}

المهارة المطلوبة في هذا السؤال:
${requestedSkill}

قيد إلزامي:
- أنشئ السؤال لقياس مهارة "${requestedSkill}" فقط.
- لا تغيّر اسم المهارة.
- لا تنشئ سؤالًا يقيس مهارة أخرى.
- أعد قيمة skill في JSON مساوية تمامًا لـ "${requestedSkill}".

${difficultyInstruction}

الأسئلة التي تم توليدها سابقًا:
${previousQuestionsText}

قواعد إلزامية:
1. لا تكرر أي سؤال سابق حرفيًا أو معنويًا.
2. لا تسأل مرة أخرى عن الفكرة نفسها بصياغة مختلفة.
3. اختر معلومة أو مهارة مختلفة عن الأسئلة السابقة.
4. لا تنشئ قصة أو شخصية أو حدثًا غير موجود في النص.
5. اجعل إجابة واحدة فقط صحيحة.
6. اجعل الاختيارات الخاطئة معقولة لكنها غير صحيحة.
7. يجب أن تتوافق صعوبة السؤال مع المستوى المطلوب.
8. لا تعتمد على معلومات من خارج النص.

نص الدرس:
${sourceText}

أعد JSON صالحًا فقط بالشكل الآتي:

{
  "question": "سؤال جديد لم يسبق طرحه",
  "choices": [
    "الاختيار الأول",
    "الاختيار الثاني",
    "الاختيار الثالث",
    "الاختيار الرابع"
  ],
  "correctAnswer": 0,
  "explanation": "تفسير الإجابة اعتمادًا على النص",
  "skill": "${requestedSkill}",
  "difficulty": "${difficulty}"
}

ملاحظات:
- correctAnswer رقم يبدأ من 0 وينتهي عند 3.
- لا تضف أي نص قبل JSON أو بعده.
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

محاولة توليد السؤال:
${generationAttempt}

أنشئ سؤالًا مختلفًا بوضوح عن جميع الأسئلة السابقة.`,
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
        "تعذر إنشاء سؤال جديد غير مكرر بعد عدة محاولات."
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
        `تعذر حفظ الاختبار: ${
          insertError?.message ??
          "خطأ غير معروف"
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
            : "حدث خطأ غير متوقع أثناء إنشاء الاختبار.",
      },
      {
        status: 500,
      }
    );
  }
}
