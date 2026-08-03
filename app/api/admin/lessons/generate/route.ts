import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateLessonRequest = {
  title?: string;
  country?: string;
  curriculum?: string;
  stage?: string;
  grade?: string;
  unit?: string;
  skill?: string;
  difficulty?: string;
  estimatedMinutes?: number;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
    code?: number;
    status?: string;
  };
};

export type GeneratedLesson = {
  objectives: string[];
  introduction: string;
  explanation: string;
  vocabulary: Array<{
    word: string;
    meaning: string;
    example: string;
  }>;
  activities: Array<{
    title: string;
    instructions: string;
  }>;
  assessment: Array<{
    question: string;
    answer: string;
  }>;
  homework: string;
};

function cleanText(value: unknown, maxLength = 300): string {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (
      firstBrace === -1 ||
      lastBrace === -1 ||
      lastBrace <= firstBrace
    ) {
      throw new Error(
        "لم يُرجع Gemini محتوى JSON صالحًا."
      );
    }

    return JSON.parse(
      cleaned.slice(firstBrace, lastBrace + 1)
    );
  }
}

function normalizeStringArray(
  value: unknown,
  limit: number
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string"
    )
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeGeneratedLesson(
  value: unknown
): GeneratedLesson {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      "صيغة محتوى الدرس غير صحيحة."
    );
  }

  const data = value as Record<string, unknown>;

  const vocabulary = Array.isArray(data.vocabulary)
    ? data.vocabulary
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) &&
            typeof item === "object" &&
            !Array.isArray(item)
        )
        .map((item) => ({
          word: cleanText(item.word, 100),
          meaning: cleanText(item.meaning, 300),
          example: cleanText(item.example, 400),
        }))
        .filter(
          (item) =>
            item.word ||
            item.meaning ||
            item.example
        )
        .slice(0, 10)
    : [];

  const activities = Array.isArray(data.activities)
    ? data.activities
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) &&
            typeof item === "object" &&
            !Array.isArray(item)
        )
        .map((item) => ({
          title: cleanText(item.title, 150),
          instructions: cleanText(
            item.instructions,
            1000
          ),
        }))
        .filter(
          (item) =>
            item.title || item.instructions
        )
        .slice(0, 8)
    : [];

  const assessment = Array.isArray(data.assessment)
    ? data.assessment
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) &&
            typeof item === "object" &&
            !Array.isArray(item)
        )
        .map((item) => ({
          question: cleanText(
            item.question,
            500
          ),
          answer: cleanText(item.answer, 500),
        }))
        .filter(
          (item) =>
            item.question || item.answer
        )
        .slice(0, 10)
    : [];

  const lesson: GeneratedLesson = {
    objectives: normalizeStringArray(
      data.objectives,
      8
    ),
    introduction: cleanText(
      data.introduction,
      2000
    ),
    explanation: cleanText(
      data.explanation,
      8000
    ),
    vocabulary,
    activities,
    assessment,
    homework: cleanText(data.homework, 2000),
  };

  if (
    lesson.objectives.length === 0 ||
    !lesson.explanation
  ) {
    throw new Error(
      "المحتوى الناتج غير مكتمل. حاول توليد الدرس مرة أخرى."
    );
  }

  return lesson;
}

export async function POST(request: Request) {
  try {
    const apiKey =
      process.env.GEMINI_API_KEY?.trim();

    const model =
      process.env.GEMINI_MODEL?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "مفتاح Gemini غير موجود في إعدادات الخادم.",
        },
        { status: 500 }
      );
    }

    if (!model) {
      return NextResponse.json(
        {
          error:
            "اسم نموذج Gemini غير موجود في ملف .env.local.",
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "يجب تسجيل الدخول لتوليد الدروس.",
        },
        { status: 401 }
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error(
        "LESSON_GENERATOR_PROFILE_ERROR:",
        profileError
      );

      return NextResponse.json(
        {
          error:
            "تعذر التحقق من صلاحيات الحساب.",
        },
        { status: 403 }
      );
    }

    const role =
      typeof profile.role === "string"
        ? profile.role.trim().toLowerCase()
        : "";

    if (role !== "admin") {
      return NextResponse.json(
        {
          error:
            "هذه الخاصية متاحة للمدير فقط.",
        },
        { status: 403 }
      );
    }

    let body: GenerateLessonRequest;

    try {
      body =
        (await request.json()) as GenerateLessonRequest;
    } catch {
      return NextResponse.json(
        {
          error: "بيانات الطلب غير صالحة.",
        },
        { status: 400 }
      );
    }

    const title = cleanText(body.title, 200);
    const country = cleanText(
      body.country,
      150
    );
    const curriculum = cleanText(
      body.curriculum,
      200
    );
    const stage = cleanText(body.stage, 150);
    const grade = cleanText(body.grade, 150);
    const unit = cleanText(body.unit, 200);
    const skill = cleanText(body.skill, 100);
    const difficulty = cleanText(
      body.difficulty,
      100
    );

    const estimatedMinutes =
      typeof body.estimatedMinutes === "number" &&
      Number.isFinite(body.estimatedMinutes)
        ? Math.min(
            Math.max(
              Math.round(body.estimatedMinutes),
              5
            ),
            180
          )
        : 45;

    if (!title) {
      return NextResponse.json(
        {
          error:
            "اكتب عنوان الدرس قبل استخدام الذكاء الاصطناعي.",
        },
        { status: 400 }
      );
    }

    if (!grade) {
      return NextResponse.json(
        {
          error:
            "اختر الصف الدراسي قبل توليد الدرس.",
        },
        { status: 400 }
      );
    }

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      `${encodeURIComponent(model)}:generateContent`;

    const prompt = `
أنشئ محتوى درس احترافيًا في اللغة العربية اعتمادًا على البيانات التالية:

عنوان الدرس: ${title}
الدولة: ${country || "غير محددة"}
المنهج: ${curriculum || "غير محدد"}
المرحلة التعليمية: ${stage || "غير محددة"}
الصف الدراسي: ${grade}
الوحدة: ${unit || "غير محددة"}
المهارة: ${skill || "لغة عربية عامة"}
مستوى الصعوبة: ${difficulty || "متوسط"}
مدة الدرس التقريبية: ${estimatedMinutes} دقيقة

الشروط:
- اجعل المحتوى مناسبًا لعمر الطالب وصفه الدراسي.
- استخدم العربية الفصحى السهلة والواضحة.
- اجعل الأهداف قابلة للملاحظة والقياس.
- قدم تمهيدًا قصيرًا وجذابًا.
- قدم شرحًا منظمًا مع أمثلة مناسبة.
- أضف مفردات مرتبطة بالدرس عند الحاجة.
- أضف أنشطة صفية متنوعة.
- أضف أسئلة تقويم مع الإجابات النموذجية.
- أضف واجبًا منزليًا مناسبًا.
- لا تذكر أنك نموذج ذكاء اصطناعي.
- لا تضف أي نص خارج كائن JSON.
    `.trim();

    const geminiResponse = await fetch(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: `
أنت خبير في المناهج وطرائق تدريس اللغة العربية، وتعمل داخل منصة
"ضاديوم — بيت العربية الرقمي".

مهمتك إنشاء دروس عربية دقيقة وتربوية، تراعي المرحلة والصف والمنهج والمهارة.

أرجع النتيجة بصيغة JSON صالحة فقط، وفق البنية المحددة، من دون Markdown أو تعليقات أو نص إضافي.
                `.trim(),
              },
            ],
          },

          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],

          generationConfig: {
            temperature: 0.4,
            topP: 0.9,
            maxOutputTokens: 4000,

            responseMimeType:
              "application/json",

            responseSchema: {
              type: "OBJECT",
              properties: {
                objectives: {
                  type: "ARRAY",
                  items: {
                    type: "STRING",
                  },
                },

                introduction: {
                  type: "STRING",
                },

                explanation: {
                  type: "STRING",
                },

                vocabulary: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      word: {
                        type: "STRING",
                      },
                      meaning: {
                        type: "STRING",
                      },
                      example: {
                        type: "STRING",
                      },
                    },
                    required: [
                      "word",
                      "meaning",
                      "example",
                    ],
                  },
                },

                activities: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: {
                        type: "STRING",
                      },
                      instructions: {
                        type: "STRING",
                      },
                    },
                    required: [
                      "title",
                      "instructions",
                    ],
                  },
                },

                assessment: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      question: {
                        type: "STRING",
                      },
                      answer: {
                        type: "STRING",
                      },
                    },
                    required: [
                      "question",
                      "answer",
                    ],
                  },
                },

                homework: {
                  type: "STRING",
                },
              },

              required: [
                "objectives",
                "introduction",
                "explanation",
                "vocabulary",
                "activities",
                "assessment",
                "homework",
              ],
            },
          },
        }),
        cache: "no-store",
      }
    );

    const data =
      (await geminiResponse.json()) as GeminiResponse;

    if (!geminiResponse.ok) {
      const errorMessage =
        data.error?.message ||
        `فشل طلب Gemini، رمز الخطأ: ${geminiResponse.status}`;

      console.error(
        "LESSON_GENERATOR_GEMINI_ERROR:",
        {
          status: geminiResponse.status,
          model,
          message: errorMessage,
        }
      );

      return NextResponse.json(
        {
          error:
            `تعذر إنشاء الدرس: ${errorMessage}`,
        },
        {
          status:
            geminiResponse.status >= 400 &&
            geminiResponse.status <= 599
              ? geminiResponse.status
              : 500,
        }
      );
    }

    if (data.promptFeedback?.blockReason) {
      return NextResponse.json(
        {
          error:
            "تعذر توليد هذا المحتوى. جرّب تعديل عنوان الدرس.",
        },
        { status: 400 }
      );
    }

    const generatedText =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim() ?? "";

    if (!generatedText) {
      console.error(
        "LESSON_GENERATOR_EMPTY_RESPONSE:",
        {
          model,
          finishReason:
            data.candidates?.[0]?.finishReason,
        }
      );

      return NextResponse.json(
        {
          error:
            "لم يُرجع Gemini محتوى واضحًا للدرس.",
        },
        { status: 502 }
      );
    }

    let lesson: GeneratedLesson;

    try {
      const parsed = extractJson(generatedText);
      lesson = normalizeGeneratedLesson(parsed);
    } catch (error) {
      console.error(
        "LESSON_GENERATOR_JSON_ERROR:",
        {
          error,
          generatedText,
        }
      );

      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "تعذر قراءة محتوى الدرس الناتج.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        lesson,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "LESSON_GENERATOR_UNEXPECTED_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `حدث خطأ غير متوقع: ${error.message}`
            : "حدث خطأ غير متوقع أثناء توليد الدرس.",
      },
      { status: 500 }
    );
  }
}