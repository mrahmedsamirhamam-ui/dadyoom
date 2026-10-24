import { logger } from "@/lib/logger";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type AssessmentRequestItem = {
  question?: string;
  modelAnswer?: string;
  studentAnswer?: string;
};

type AssessmentRequestBody = {
  lessonId?: string;
  items?: AssessmentRequestItem[];
};

type GradingResult = {
  correct: boolean;
  score: number;
  feedback: string;
  teacherComment: string;
  skill: string;
  mistakeCategory: string | null;
  difficulty: "سهل" | "متوسط" | "صعب";
  recommendation: string;
  strengths: string[];
  mistakes: string[];
};

const MODEL =
  process.env.GEMINI_GRADING_MODEL ?? "gemini-3.6-flash";

function clampScore(value: unknown) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function cleanResult(value: unknown): GradingResult {
  const item =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  const score = clampScore(item.score);
  const correct =
    typeof item.correct === "boolean"
      ? item.correct
      : score >= 70;

  const difficulty =
    item.difficulty === "سهل" ||
    item.difficulty === "متوسط" ||
    item.difficulty === "صعب"
      ? item.difficulty
      : "متوسط";

  const mistakeCategory =
    typeof item.mistakeCategory === "string" &&
    item.mistakeCategory.trim()
      ? item.mistakeCategory.trim()
      : null;

  return {
    correct,
    score,
    feedback:
      typeof item.feedback === "string" &&
      item.feedback.trim()
        ? item.feedback.trim()
        : correct
          ? "إجابتك صحيحة في المعنى."
          : "راجع الإجابة النموذجية وحاول مرة أخرى.",
    teacherComment:
      typeof item.teacherComment === "string" &&
      item.teacherComment.trim()
        ? item.teacherComment.trim()
        : correct
          ? "أحسنت، واصل التقدم."
          : "حاول التركيز على الفكرة الأساسية في السؤال.",
    skill:
      typeof item.skill === "string" &&
      item.skill.trim()
        ? item.skill.trim()
        : "الاستيعاب",
    mistakeCategory,
    difficulty,
    recommendation:
      typeof item.recommendation === "string" &&
      item.recommendation.trim()
        ? item.recommendation.trim()
        : correct
          ? "انتقل إلى السؤال أو النشاط التالي."
          : "أعد مراجعة الجزء المرتبط بهذه المهارة.",
    strengths: cleanStringArray(item.strengths),
    mistakes: cleanStringArray(item.mistakes),
  };
}

async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // يمكن تجاهلها في بعض سياقات Server Components.
          }
        },
      },
    }
  );
}

type GeminiApiError = {
  code?: number | string;
  message?: string;
  status?: string;
};

type GeminiContentPart = {
  text?: string;
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiContentPart[];
    role?: string;
  };
  finishReason?: string;
};

type GeminiApiResponse = {
  error?: GeminiApiError;
  candidates?: GeminiCandidate[];
};

type GeminiAttemptResult = {
  response: Response;
  data: GeminiApiResponse;
  keyIndex: number;
};

async function requestGeminiWithFallback(
  endpoint: string,
  apiKeys: string[],
  requestBody: unknown
): Promise<GeminiAttemptResult> {
  let lastResponse: Response | null = null;
  let lastData: GeminiApiResponse = {};

  for (
    let keyIndex = 0;
    keyIndex < apiKeys.length;
    keyIndex += 1
  ) {
    const apiKey = apiKeys[keyIndex];

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    const data = (await response
      .json()
      .catch(() => ({}))) as GeminiApiResponse;

    lastResponse = response;
    lastData = data;

    if (response.ok) {
      if (keyIndex > 0) {
        logger.info(
          "GEMINI_BACKUP_KEY_USED",
          {
            keyIndex,
          }
        );
      }

      return {
        response,
        data,
        keyIndex,
      };
    }

    const errorCode =
      Number(data?.error?.code) ||
      response.status;

    const canTryNextKey =
      errorCode === 429 ||
      errorCode === 500 ||
      errorCode === 502 ||
      errorCode === 503 ||
      errorCode === 504;

    console.warn("GEMINI_KEY_ATTEMPT_FAILED", {
      keyIndex,
      status: response.status,
      errorCode,
      message:
        data?.error?.message ??
        "Gemini request failed.",
      willTryBackup:
        canTryNextKey &&
        keyIndex < apiKeys.length - 1,
    });

    if (!canTryNextKey) {
      return {
        response,
        data,
        keyIndex,
      };
    }
  }

  if (!lastResponse) {
    throw new Error(
      "No Gemini API request was attempted."
    );
  }

  return {
    response: lastResponse,
    data: lastData,
    keyIndex: apiKeys.length - 1,
  };
}

export async function POST(request: Request) {
  try {
    const apiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_BACKUP,
      process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    ].filter(
      (key): key is string =>
        typeof key === "string" &&
        key.trim().length > 0
    );

    const uniqueApiKeys = Array.from(
      new Set(apiKeys.map((key) => key.trim()))
    );

    if (uniqueApiKeys.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لا يوجد مفتاح Gemini في ملف .env.local.",
        },
        { status: 500 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "يجب تسجيل الدخول قبل تصحيح الإجابات.",
        },
        { status: 401 }
      );
    }

    const body =
      (await request.json()) as AssessmentRequestBody;

    const items = Array.isArray(body.items)
      ? body.items
      : [];

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "لا توجد إجابات لتصحيحها.",
        },
        { status: 400 }
      );
    }

    if (items.length > 20) {
      return NextResponse.json(
        {
          success: false,
          message:
            "الحد الأقصى هو 20 سؤالًا في الطلب الواحد.",
        },
        { status: 400 }
      );
    }

    // The request owns the model answers; they are not verifiable against a
    // published question key. This endpoint must remain feedback-only.
    // Academic progress is written exclusively by trusted grading routes.
    const safeItems = items.map((item, index) => ({
      number: index + 1,
      question: String(item.question ?? "").slice(
        0,
        1500
      ),
      modelAnswer: String(
        item.modelAnswer ?? ""
      ).slice(0, 1500),
      studentAnswer: String(
        item.studentAnswer ?? ""
      ).slice(0, 1500),
    }));

    const prompt = `
أنت معلم تربوي متخصص في اللغة العربية داخل منصة ضاديوم.

صحح إجابات الطالب بالمعنى، ولا تعتمد على التطابق الحرفي.

قواعد التصحيح:
1. اقبل الإجابة إذا عبّرت عن المعنى المطلوب، حتى لو اختلف ترتيب الكلمات أو الصياغة.
2. اقبل الجملة الكاملة عندما تكون الإجابة النموذجية كلمة قصيرة.
3. اقبل المرادفات الصحيحة، وااختلاف علامات الترقيم والتشكيل والهمزات.
4. لا تعتبر الإجابة صحيحة لمجرد احتوائها على بعض كلمات النموذج؛ يجب أن تؤدي المعنى المطلوب.
5. في الأسئلة متعددة العناصر، أعط درجة جزئية بحسب العناصر الصحيحة.
6. اجعل correct=true عندما تكون الدرجة 70 أو أكثر.
7. اجعل feedback موجزًا وواضحًا.
8. اجعل teacherComment تعليقًا تربويًا دافئًا يشبه تعليق المعلم.
9. حدد skill بعبارة عربية قصيرة مثل: النحو، الإملاء، القراءة، الاستيعاب، التعبير، المفردات.
10. اجعل mistakeCategory فارغة null عند عدم وجود خطأ واضح.
11. اجعل difficulty واحدة فقط من: سهل، متوسط، صعب.
12. أعد strengths و mistakes كمصفوفتين من العبارات القصيرة.
13. اكتب recommendation كتوصية عملية قصيرة.
14. حافظ على ترتيب النتائج مطابقًا لترتيب الأسئلة.

الأسئلة والإجابات:
${JSON.stringify(safeItems)}
`.trim();

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      `${encodeURIComponent(MODEL)}:generateContent`;

    const geminiRequestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            results: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  correct: {
                    type: "BOOLEAN",
                  },
                  score: {
                    type: "INTEGER",
                    minimum: 0,
                    maximum: 100,
                  },
                  feedback: {
                    type: "STRING",
                  },
                  teacherComment: {
                    type: "STRING",
                  },
                  skill: {
                    type: "STRING",
                  },
                  mistakeCategory: {
                    anyOf: [
                      { type: "STRING" },
                      { type: "NULL" },
                    ],
                  },
                  difficulty: {
                    type: "STRING",
                    enum: [
                      "سهل",
                      "متوسط",
                      "صعب",
                    ],
                  },
                  recommendation: {
                    type: "STRING",
                  },
                  strengths: {
                    type: "ARRAY",
                    items: {
                      type: "STRING",
                    },
                  },
                  mistakes: {
                    type: "ARRAY",
                    items: {
                      type: "STRING",
                    },
                  },
                },
                required: [
                  "correct",
                  "score",
                  "feedback",
                  "teacherComment",
                  "skill",
                  "mistakeCategory",
                  "difficulty",
                  "recommendation",
                  "strengths",
                  "mistakes",
                ],
              },
            },
          },
          required: ["results"],
        },
      },
    };

    const {
      response: geminiResponse,
      data: geminiData,
      keyIndex: usedKeyIndex,
    } = await requestGeminiWithFallback(
      endpoint,
      uniqueApiKeys,
      geminiRequestBody
    );

    logger.info("GEMINI_GRADING_KEY", {
      key:
        usedKeyIndex === 0
          ? "primary"
          : `backup-${usedKeyIndex}`,
    });

    if (!geminiResponse.ok) {
      if (geminiData?.error?.code === 429 || geminiResponse.status === 429) {
        const results: GradingResult[] = safeItems.map((item) => {
          const model = item.modelAnswer.trim().toLowerCase();
          const answer = item.studentAnswer.trim().toLowerCase();

          const correct =
            model.length > 0 &&
            answer.length > 0 &&
            (answer === model || (model.length >= 3 && answer.includes(model)));

          return {
            correct,
            score: correct ? 100 : 40,
            feedback: correct
              ? "إجابة صحيحة."
              : "راجع الإجابة النموذجية.",
            teacherComment: correct
              ? "أحسنت."
              : "حاول مرة أخرى.",
            skill: "الاستيعاب",
            mistakeCategory: correct ? null : "general",
            difficulty: "متوسط",
            recommendation: correct
              ? "انتقل للسؤال التالي."
              : "أعد قراءة الدرس.",
            strengths: correct ? ["إجابة صحيحة"] : [],
            mistakes: correct ? [] : ["الإجابة غير مطابقة"],
          };
        });
        // Formative practice only: the caller supplied both modelAnswer and
        // studentAnswer. Never persist a grade or award skill mastery.
        return NextResponse.json({
          success: true,
          fallback: true,
          practiceOnly: true,
          persisted: false,
          results,
        });
      }

      console.error(
        "GEMINI_GRADING_ERROR:",
        geminiData
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "تعذر الاتصال بخدمة التصحيح الذكي.",
          error:
            geminiData?.error?.message ??
            "Gemini request failed.",
        },
        { status: 502 }
      );
    }

    const text =
      geminiData?.candidates?.[0]?.content
        ?.parts?.[0]?.text;

    if (typeof text !== "string") {
      return NextResponse.json(
        {
          success: false,
          message:
            "لم تُرجع خدمة التصحيح نتيجة مفهومة.",
        },
        { status: 502 }
      );
    }

    type GeminiGradingResponse = {
      results?: unknown[];
    };

    const parsed = JSON.parse(text) as GeminiGradingResponse;

    const rawResults: unknown[] = Array.isArray(parsed.results)
      ? parsed.results
      : [];

    if (rawResults.length !== safeItems.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            "عدد نتائج التصحيح لا يطابق عدد الأسئلة.",
        },
        { status: 502 }
      );
    }

    const results: GradingResult[] = rawResults.map(
      (item: unknown) => cleanResult(item)
    );

    // Unverified caller-supplied reference answers are not academic evidence.
    // These AI comments may assist practice, but only the separately
    // server-authorized assessment routes can persist graded attempts.
    return NextResponse.json({
      success: true,
      practiceOnly: true,
      persisted: false,
      results,
    });
  } catch (error) {
    console.error(
      "SMART_GRADING_UNEXPECTED_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ غير متوقع أثناء التصحيح الذكي.",
      },
      { status: 500 }
    );
  }
}
