import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import {
  readFile,
} from "node:fs/promises";

import path from "node:path";

import {
  scoreActivityMatch as
    sharedScoreActivityMatch,
} from "@/lib/lesson-ai/matching";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalyzePageRequest = {
  lessonId?: string;
  pageNumber?: number;
  imageUrl?: string;
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

type ActivityRegion = {
  title: string;
  activityType:
    | "listening"
    | "speaking"
    | "reading"
    | "multiple_choice"
    | "matching"
    | "fill_blank"
    | "writing"
    | "other";

  section: string;
  instructions: string;

  x: number;
  y: number;
  width: number;
  height: number;

  audioText: string;

  content: Record<string, unknown>;
  answer: Record<string, unknown>;
};

type AnalyzePageResult = {
  pageNumber: number;
  pageTitle: string;
  regions: ActivityRegion[];
};

function cleanText(
  value: unknown,
  maxLength = 500
): string {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

function clampPercent(
  value: unknown
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(value * 100) / 100
    )
  );
}

function extractJson(
  text: string
): unknown {
  const cleaned =
    text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned);
  }
  catch {
    const firstBrace =
      cleaned.indexOf("{");

    const lastBrace =
      cleaned.lastIndexOf("}");

    if (
      firstBrace < 0 ||
      lastBrace <= firstBrace
    ) {
      throw new Error(
        "لم يرجع Gemini JSON صالحًا."
      );
    }

    return JSON.parse(
      cleaned.slice(
        firstBrace,
        lastBrace + 1
      )
    );
  }
}

function normalizeResult(
  value: unknown,
  pageNumber: number
): AnalyzePageResult {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      "صيغة تحليل الصفحة غير صحيحة."
    );
  }

  const data =
    value as Record<string, unknown>;

  const rawRegions =
    Array.isArray(data.regions)
      ? data.regions
      : [];

  const allowedTypes =
    new Set([
      "listening",
      "speaking",
      "reading",
      "multiple_choice",
      "matching",
      "fill_blank",
      "writing",
      "other",
    ]);

  const regions =
    rawRegions
      .filter(
        (
          item
        ): item is Record<string, unknown> =>
          Boolean(item) &&
          typeof item === "object" &&
          !Array.isArray(item)
      )
      .map((item) => {
        const rawType =
          cleanText(
            item.activityType,
            50
          );

        const activityType =
          allowedTypes.has(rawType)
            ? rawType
            : "other";

        const content =
          item.content &&
          typeof item.content === "object" &&
          !Array.isArray(item.content)
            ? item.content as Record<
                string,
                unknown
              >
            : {};

        const answer =
          item.answer &&
          typeof item.answer === "object" &&
          !Array.isArray(item.answer)
            ? item.answer as Record<
                string,
                unknown
              >
            : {};

        return {
          title:
            cleanText(
              item.title,
              200
            ),

          activityType:
            activityType as
              ActivityRegion["activityType"],

          section:
            cleanText(
              item.section,
              100
            ),

          instructions:
            cleanText(
              item.instructions,
              1000
            ),

          x:
            clampPercent(
              item.x
            ),

          y:
            clampPercent(
              item.y
            ),

          width:
            clampPercent(
              item.width
            ),

          height:
            clampPercent(
              item.height
            ),

          audioText:
            cleanText(
              item.audioText,
              1500
            ),

          content,

          answer,
        };
      })
      .filter(
        (region) =>
          region.title &&
          region.width > 0 &&
          region.height > 0
      );

  return {
    pageNumber,
    pageTitle:
      cleanText(
        data.pageTitle,
        300
      ),
    regions,
  };
}

function mimeTypeFromPath(
  filePath: string
): string {
  const extension =
    path.extname(
      filePath
    ).toLowerCase();

  if (
    extension === ".png"
  ) {
    return "image/png";
  }

  if (
    extension === ".webp"
  ) {
    return "image/webp";
  }

  return "image/jpeg";
}

function resolvePublicImagePath(
  imageUrl: string
): string {
  const clean =
    imageUrl
      .trim()
      .replace(
        /^\/+/,
        ""
      );

  if (
    !clean ||
    clean.includes("..")
  ) {
    throw new Error(
      "مسار الصورة غير صالح."
    );
  }

  const publicRoot =
    path.resolve(
      process.cwd(),
      "public"
    );

  const filePath =
    path.resolve(
      publicRoot,
      clean
    );

  if (
    !filePath.startsWith(
      publicRoot +
      path.sep
    )
  ) {
    throw new Error(
      "مسار الصورة خارج public."
    );
  }

  return filePath;
}


function sleep(
  milliseconds: number
): Promise<void> {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}

function getGeminiRetryDelay(
  message: string,
  attempt: number
): number {
  const match =
    message.match(
      /retry in\s+([0-9.]+)s/i
    );

  if (match) {
    const seconds =
      Number(
        match[1]
      );

    if (
      Number.isFinite(seconds)
    ) {
      return Math.ceil(
        seconds * 1000
      ) + 1500;
    }
  }

  const fallbackDelays = [
    15000,
    30000,
    60000,
  ];

  return fallbackDelays[
    Math.min(
      attempt,
      fallbackDelays.length - 1
    )
  ];
}

async function fetchWithGeminiRetry(
  url: string,
  init: RequestInit
): Promise<Response> {
  const maxAttempts = 4;

  for (
    let attempt = 0;
    attempt < maxAttempts;
    attempt += 1
  ) {
    const response =
      await fetch(
        url,
        init
      );

    const retryable =
      response.status === 429 ||
      response.status === 408 ||
      response.status >= 500;

    if (
      response.ok ||
      !retryable ||
      attempt ===
        maxAttempts - 1
    ) {
      return response;
    }

    let message = "";

    try {
      const cloned =
        response.clone();

      const errorData =
        await cloned.json() as GeminiResponse;

      message =
        errorData.error?.message ??
        "";
    }
    catch {
      message = "";
    }

    const delay =
      getGeminiRetryDelay(
        message,
        attempt
      );

    console.warn(
      "GEMINI_PAGE_RETRY:",
      {
        attempt:
          attempt + 1,
        nextAttempt:
          attempt + 2,
        status:
          response.status,
        delayMs:
          delay,
        message,
      }
    );

    await sleep(delay);
  }

  throw new Error(
    "Gemini retry loop ended unexpectedly."
  );
}
export async function POST(
  request: Request
) {
  try {
    const apiKey =
      process.env
        .GEMINI_API_KEY
        ?.trim();

    const model =
      process.env
        .GEMINI_MODEL
        ?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY غير موجود.",
        },
        {
          status: 500,
        }
      );
    }

    if (!model) {
      return NextResponse.json(
        {
          error:
            "GEMINI_MODEL غير موجود.",
        },
        {
          status: 500,
        }
      );
    }

    const supabase =
      await createClient();

    const {
      data: {
        user,
      },
    } =
      await supabase
        .auth
        .getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "يجب تسجيل الدخول.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: profile,
      error:
        profileError,
    } =
      await supabase
        .from("profiles")
        .select("role")
        .eq(
          "id",
          user.id
        )
        .single();

    if (
      profileError ||
      !profile ||
      String(
        profile.role ?? ""
      )
        .trim()
        .toLowerCase() !==
        "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "هذه الخاصية متاحة للمدير فقط.",
        },
        {
          status: 403,
        }
      );
    }

    let body:
      AnalyzePageRequest;

    try {
      body =
        (await request.json()) as AnalyzePageRequest;
    }
    catch {
      return NextResponse.json(
        {
          error:
            "بيانات الطلب غير صالحة.",
        },
        {
          status: 400,
        }
      );
    }

    const lessonId =
      cleanText(
        body.lessonId,
        100
      );

    const imageUrl =
      cleanText(
        body.imageUrl,
        1000
      );

    const pageNumber =
      typeof body.pageNumber ===
        "number" &&
      Number.isFinite(
        body.pageNumber
      )
        ? Math.round(
            body.pageNumber
          )
        : 0;

    if (!lessonId) {
      return NextResponse.json(
        {
          error:
            "lessonId مطلوب.",
        },
        {
          status: 400,
        }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          error:
            "imageUrl مطلوب.",
        },
        {
          status: 400,
        }
      );
    }

    if (pageNumber <= 0) {
      return NextResponse.json(
        {
          error:
            "pageNumber غير صالح.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: lesson,
      error: lessonError,
    } =
      await supabase
        .from("lessons")
        .select(
          "id,title,lesson_number"
        )
        .eq(
          "id",
          lessonId
        )
        .maybeSingle();

    if (
      lessonError
    ) {
      throw lessonError;
    }

    if (!lesson) {
      return NextResponse.json(
        {
          error:
            "الدرس غير موجود.",
        },
        {
          status: 404,
        }
      );
    }

    const filePath =
      resolvePublicImagePath(
        imageUrl
      );

    const bytes =
      await readFile(
        filePath
      );

    if (
      bytes.length === 0
    ) {
      throw new Error(
        "ملف الصورة فارغ."
      );
    }

    const base64 =
      bytes.toString(
        "base64"
      );

    const mimeType =
      mimeTypeFromPath(
        filePath
      );

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      `${encodeURIComponent(model)}:generateContent`;

    const prompt = `
حلل صورة صفحة كتاب اللغة العربية المرفقة.

السياق:
- منصة: ضاديوم
- عنوان الدرس: ${lesson.title}
- رقم الدرس: ${lesson.lesson_number ?? ""}
- رقم الصفحة المصدرية: ${pageNumber}

المطلوب:
استخرج الأنشطة التعليمية الظاهرة في الصفحة فقط.

لكل نشاط:
1. حدد عنوانه.
2. حدد نوع النشاط من القيم المسموحة.
3. حدد القسم مثل: الاستماع، التحدث، القراءة، الكتابة، التدريب.
4. اكتب تعليمات قصيرة مناسبة للطالب.
5. حدد المستطيل الذي يحتوي النشاط في الصورة بالنسبة المئوية:
   x = المسافة من اليسار.
   y = المسافة من الأعلى.
   width = عرض المنطقة.
   height = ارتفاع المنطقة.
   القيم من 0 إلى 100.
6. اكتب audioText مناسبًا ليقرأه ضاد بصوت واضح.
7. استخرج content من الصفحة قدر الإمكان.
8. استخرج answer فقط إذا كانت الإجابة ظاهرة أو مؤكدة من الصفحة.
9. لا تخترع إجابات غير واضحة.
10. لا تضمّن حدود الصفحة أو الشعار إذا لم يكونا جزءًا من النشاط.
11. إذا امتد نشاط واحد على جزء محدد، اجعل region محكمًا حول محتواه.
12. لا تكرر النشاط نفسه أكثر من مرة.

أنواع النشاط المسموحة:
listening
speaking
reading
multiple_choice
matching
fill_blank
writing
other

بالنسبة إلى content:

- reading:
  استخرج النص أو المقاطع في text،
  واستخدم examples أو keywords عند الحاجة.

- multiple_choice:
  استخرج جميع الخيارات الظاهرة في options.
  إذا كان هناك أكثر من سؤال داخل النشاط فاستخدم questions أيضًا.

- fill_blank:
  استخدم items.
  كل item قد يحتوي sentence أو prompt وoptions.

- matching:
  استخرج عناصر العمود الأول في left
  وعناصر العمود الثاني في right.

- writing:
  استخرج الحرف في letter
  وأشكاله أو مقاطعه في forms.

- إذا احتوى النشاط صورًا:
  اكتب أسماء الصور الواضحة في imageLabels.

بالنسبة إلى answer:

- لا تترك answer فارغًا إذا كانت الإجابة يمكن استنتاجها يقينًا من الصفحة.
- للاختيار الواحد استخدم correct.
- إذا كانت هناك عدة إجابات صحيحة استخدم correct_values.
- لأنشطة الفراغات المتعددة استخدم answers.
- لترتيب الكلمات استخدم correct_words.
- للحرف المطلوب استخدم correct_letter.
- للتوصيل استخدم pairs، وكل زوج يحتوي left وright.
- إذا لم تكن الإجابة مؤكدة بصريًا، اترك حقول answer غير الموجودة فارغة بدل اختراع إجابة.

مهم جدًا:
لا تكتفِ بوصف النشاط.
استخرج المادة التعليمية نفسها التي يحتاجها المحرك ليحوّل الصفحة إلى نشاط رقمي قابل للتنفيذ دون كتاب ورقي.

أرجع JSON فقط.
    `.trim();

    const geminiResponse =
  await fetchWithGeminiRetry(
        endpoint,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-goog-api-key":
              apiKey,
          },

          body:
            JSON.stringify({
              systemInstruction: {
                parts: [
                  {
                    text:
                      `
أنت محلل بصري خبير في مناهج اللغة العربية للمرحلة المدرسية.

مهمتك تحويل صفحات الكتب إلى أنشطة رقمية دقيقة لمنصة ضاديوم.

اقرأ الصفحة بصريًا ولا تفترض محتوى غير ظاهر.
حدد إحداثيات الأنشطة بدقة بالنسبة المئوية.
لا تخلط بين أكثر من نشاط في منطقة واحدة إلا إذا كانا جزءًا من مهمة واحدة.
                      `.trim(),
                  },
                ],
              },

              contents: [
                {
                  role:
                    "user",

                  parts: [
                    {
                      inline_data: {
                        mime_type:
                          mimeType,

                        data:
                          base64,
                      },
                    },

                    {
                      text:
                        prompt,
                    },
                  ],
                },
              ],

              generationConfig: {
                temperature:
                  0.1,

                topP:
                  0.8,

                maxOutputTokens:
                  6000,

                responseMimeType:
                  "application/json",

                responseSchema: {
                  type:
                    "OBJECT",

                  properties: {
                    pageTitle: {
                      type:
                        "STRING",
                    },

                    regions: {
                      type:
                        "ARRAY",

                      items: {
                        type:
                          "OBJECT",

                        properties: {
                          title: {
                            type:
                              "STRING",
                          },

                          activityType: {
                            type:
                              "STRING",

                            enum: [
                              "listening",
                              "speaking",
                              "reading",
                              "multiple_choice",
                              "matching",
                              "fill_blank",
                              "writing",
                              "other",
                            ],
                          },

                          section: {
                            type:
                              "STRING",
                          },

                          instructions: {
                            type:
                              "STRING",
                          },

                          x: {
                            type:
                              "NUMBER",
                          },

                          y: {
                            type:
                              "NUMBER",
                          },

                          width: {
                            type:
                              "NUMBER",
                          },

                          height: {
                            type:
                              "NUMBER",
                          },

                          audioText: {
                            type:
                              "STRING",
                          },

                          content: {
                            type:
                              "OBJECT",

                            properties: {
                              text: {
                                type:
                                  "STRING",
                              },

                              letter: {
                                type:
                                  "STRING",
                              },

                              forms: {
                                type:
                                  "ARRAY",

                                items: {
                                  type:
                                    "STRING",
                                },
                              },

                              options: {
                                type:
                                  "ARRAY",

                                items: {
                                  type:
                                    "STRING",
                                },
                              },

                              questions: {
                                type:
                                  "ARRAY",

                                items: {
                                  type:
                                    "STRING",
                                },
                              },

                              examples: {
                                type:
                                  "ARRAY",

                                items: {
                                  type:
                                    "STRING",
                                },
                              },

                              keywords: {
                                type:
                                  "ARRAY",

                                items: {
                                  type:
                                    "STRING",
                                },
                              },

                              words: {
                                type:
                                  "ARRAY",

                                items: {
                                  type:
                                    "STRING",
                                },
                              },

                              left: {
                                type:
                                  "ARRAY",

                                items: {
                                  type:
                                    "STRING",
                                },
                              },

                              right: {
                                type:
                                  "ARRAY",

                                items: {
                                  type:
                                    "STRING",
                                },
                              },

                              items: {
                                type:
                                  "ARRAY",

                                items: {
                                  type:
                                    "OBJECT",

                                  properties: {
                                    prompt: {
                                      type:
                                        "STRING",
                                    },

                                    sentence: {
                                      type:
                                        "STRING",
                                    },

                                    options: {
                                      type:
                                        "ARRAY",

                                      items: {
                                        type:
                                          "STRING",
                                      },
                                    },
                                  },
                                },
                              },

                              imageLabels: {
                                type:
                                  "ARRAY",

                                items: {
                                  type:
                                    "STRING",
                                },
                              },

                              notes: {
                                type:
                                  "STRING",
                              },
                            },
                          },

                          answer: {
                            type:
                              "OBJECT",

                            properties: {
                              correct: {
                                type:
                                  "STRING",
                              },

                              correct_values: {
                                type:
                                  "ARRAY",

                                items: {
                                  type:
                                    "STRING",
                                },
                              },

                              answers: {
                                type:
                                  "ARRAY",

                                items: {
                                  type:
                                    "STRING",
                                },
                              },

                              correct_words: {
                                type:
                                  "ARRAY",

                                items: {
                                  type:
                                    "STRING",
                                },
                              },

                              correct_letter: {
                                type:
                                  "STRING",
                              },

                              pairs: {
                                type:
                                  "ARRAY",

                                items: {
                                  type:
                                    "OBJECT",

                                  properties: {
                                    left: {
                                      type:
                                        "STRING",
                                    },

                                    right: {
                                      type:
                                        "STRING",
                                    },
                                  },

                                  required: [
                                    "left",
                                    "right",
                                  ],
                                },
                              },
                            },
                          },
                        },

                        required: [
                          "title",
                          "activityType",
                          "section",
                          "instructions",
                          "x",
                          "y",
                          "width",
                          "height",
                          "audioText",
                          "content",
                          "answer",
                        ],
                      },
                    },
                  },

                  required: [
                    "pageTitle",
                    "regions",
                  ],
                },
              },
            }),

          cache:
            "no-store",
        }
      );

    const data =
      (await geminiResponse.json()) as GeminiResponse;

    if (
      !geminiResponse.ok
    ) {
      const message =
        data.error?.message ||
        `Gemini error ${geminiResponse.status}`;

      console.error(
        "LESSON_PAGE_ANALYZER_GEMINI_ERROR:",
        {
          status:
            geminiResponse.status,
          message,
        }
      );

      return NextResponse.json(
        {
          error:
            `تعذر تحليل الصفحة: ${message}`,
        },
        {
          status:
            geminiResponse.status,
        }
      );
    }

    if (
      data
        .promptFeedback
        ?.blockReason
    ) {
      return NextResponse.json(
        {
          error:
            "Gemini رفض تحليل الصفحة.",
        },
        {
          status: 400,
        }
      );
    }

    const generatedText =
      data
        .candidates?.[0]
        ?.content
        ?.parts
        ?.map(
          (part) =>
            part.text ?? ""
        )
        .join("")
        .trim() ?? "";

    if (!generatedText) {
      return NextResponse.json(
        {
          error:
            "لم يرجع Gemini تحليلًا للصفحة.",
        },
        {
          status: 502,
        }
      );
    }

    const parsed =
      extractJson(
        generatedText
      );

    const result =
      normalizeResult(
        parsed,
        pageNumber
      );

    const {
      data: existingActivities,
      error: activitiesError,
    } =
      await supabase
        .from("lesson_activities")
        .select(`
          id,
          activity_order,
          title,
          activity_type,
          section,
          content,
          answer,
          points,
          is_published
        `)
        .eq(
          "lesson_id",
          lessonId
        )
        .order(
          "activity_order",
          {
            ascending: true,
          }
        );

    if (activitiesError) {
      throw activitiesError;
    }

const proposals =
    result.regions.map(
      (region) => {
        const ranked =
          (existingActivities ?? [])
            .map(
              (activity) => ({
                activity,

                score:
                  sharedScoreActivityMatch(
                    pageNumber,
                    region,
                    activity
                  ),
              })
            )
            .sort(
              (a, b) =>
                b.score -
                a.score
            );

        const best =
          ranked[0];

        const confidence =
          best
            ? best.score
            : 0;

        const decision =
          confidence >= 80
            ? "AUTO"
            : confidence >= 60
              ? "REVIEW"
              : "REJECT";

        return {
          region,

          matchedActivity:
            best?.activity ??
            null,

          confidence,

          decision,
        };
      }
    );

  return NextResponse.json(
      {
        success: true,
        lessonId,
        imageUrl,
        analysis:
          result,
      
        proposals,
},
      {
        status: 200,
      }
    );
  }
  catch (error) {
    console.error(
      "LESSON_PAGE_ANALYZER_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر تحليل الصفحة.",
      },
      {
        status: 500,
      }
    );
  }
}
