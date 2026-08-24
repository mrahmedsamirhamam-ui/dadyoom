import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  readFile,
} from "node:fs/promises";

import path from "node:path";

import {
  scoreActivityMatch as
    sharedScoreActivityMatch,
} from "@/lib/lesson-ai/matching";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type PageInput = {
  pageNumber?: number;
  imageUrl?: string;
};

type AnalyzePagesRequest = {
  lessonId?: string;
  pages?: PageInput[];
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

type ActivityType =
  | "listening"
  | "speaking"
  | "reading"
  | "multiple_choice"
  | "matching"
  | "fill_blank"
  | "writing"
  | "other";

type ActivityRegion = {
  title: string;
  activityType: ActivityType;
  section: string;
  instructions: string;

  x: number;
  y: number;
  width: number;
  height: number;

  audioText: string;

  content:
    Record<string, unknown>;

  answer:
    Record<string, unknown>;
};

type PageAnalysis = {
  pageNumber: number;
  pageTitle: string;
  regions: ActivityRegion[];
};

function cleanText(
  value: unknown,
  maxLength = 500
): string {
  return typeof value ===
    "string"
    ? value
        .trim()
        .slice(
          0,
          maxLength
        )
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
      Math.round(
        value * 100
      ) / 100
    )
  );
}

function extractJson(
  text: string
): unknown {
  const cleaned =
    text
      .trim()
      .replace(
        /^```json\s*/i,
        ""
      )
      .replace(
        /^```\s*/i,
        ""
      )
      .replace(
        /\s*```$/i,
        ""
      );

  try {
    return JSON.parse(
      cleaned
    );
  }
  catch {
    const first =
      cleaned.indexOf("{");

    const last =
      cleaned.lastIndexOf("}");

    if (
      first < 0 ||
      last <= first
    ) {
      throw new Error(
        "لم يرجع Gemini JSON صالحًا."
      );
    }

    return JSON.parse(
      cleaned.slice(
        first,
        last + 1
      )
    );
  }
}

function normalizeRegion(
  value: unknown
): ActivityRegion | null {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const data =
    value as Record<
      string,
      unknown
    >;

  const allowedTypes =
    new Set<ActivityType>([
      "listening",
      "speaking",
      "reading",
      "multiple_choice",
      "matching",
      "fill_blank",
      "writing",
      "other",
    ]);

  const rawType =
    cleanText(
      data.activityType,
      50
    );

  const activityType:
    ActivityType =
      allowedTypes.has(
        rawType as ActivityType
      )
        ? rawType as ActivityType
        : "other";

  const content =
    data.content &&
    typeof data.content ===
      "object" &&
    !Array.isArray(
      data.content
    )
      ? data.content as Record<
          string,
          unknown
        >
      : {};

  const answer =
    data.answer &&
    typeof data.answer ===
      "object" &&
    !Array.isArray(
      data.answer
    )
      ? data.answer as Record<
          string,
          unknown
        >
      : {};

  const region:
    ActivityRegion = {
      title:
        cleanText(
          data.title,
          250
        ),

      activityType,

      section:
        cleanText(
          data.section,
          120
        ),

      instructions:
        cleanText(
          data.instructions,
          1200
        ),

      x:
        clampPercent(
          data.x
        ),

      y:
        clampPercent(
          data.y
        ),

      width:
        clampPercent(
          data.width
        ),

      height:
        clampPercent(
          data.height
        ),

      audioText:
        cleanText(
          data.audioText,
          1800
        ),

      content,

      answer,
    };

  if (
    !region.title ||
    region.width <= 0 ||
    region.height <= 0
  ) {
    return null;
  }

  return region;
}

function normalizeBatchResult(
  value: unknown,
  expectedPages:
    Set<number>
): PageAnalysis[] {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      "صيغة تحليل الصفحات غير صحيحة."
    );
  }

  const root =
    value as Record<
      string,
      unknown
    >;

  const rawPages =
    Array.isArray(
      root.pages
    )
      ? root.pages
      : [];

  return rawPages
    .filter(
      (
        item
      ): item is Record<
        string,
        unknown
      > =>
        Boolean(item) &&
        typeof item ===
          "object" &&
        !Array.isArray(item)
    )
    .map((item) => {
      const pageNumber =
        typeof item.pageNumber ===
          "number"
          ? Math.round(
              item.pageNumber
            )
          : 0;

      const rawRegions =
        Array.isArray(
          item.regions
        )
          ? item.regions
          : [];

      const regions =
        rawRegions
          .map(
            normalizeRegion
          )
          .filter(
            (
              region
            ): region is ActivityRegion =>
              region !== null
          );

      return {
        pageNumber,

        pageTitle:
          cleanText(
            item.pageTitle,
            300
          ),

        regions,
      };
    })
    .filter(
      (page) =>
        expectedPages.has(
          page.pageNumber
        )
    )
    .sort(
      (a, b) =>
        a.pageNumber -
        b.pageNumber
    );
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

async function fetchGemini(
    endpoint: string,
    init: RequestInit
  ): Promise<Response> {
    const primaryModel =
      process.env
        .GEMINI_MODEL
        ?.trim() ?? "";

    const backupModel =
      process.env
        .GEMINI_MODEL_BACKUP
        ?.trim();

    const backupApiKey =
      process.env
        .GEMINI_API_KEY_BACKUP
        ?.trim();

    const primaryHeaders =
      new Headers(
        init.headers
      );

    const primaryApiKey =
      primaryHeaders.get(
        "x-goog-api-key"
      )?.trim() ?? "";

    const configs: Array<{
      name: "primary" | "backup";
      endpoint: string;
      apiKey: string;
      model: string;
    }> = [
      {
        name:
          "primary",

        endpoint,

        apiKey:
          primaryApiKey,

        model:
          primaryModel,
      },
    ];

    if (
      backupModel &&
      (
        backupModel !==
          primaryModel ||
        (
          backupApiKey &&
          backupApiKey !==
            primaryApiKey
        )
      )
    ) {
      const backupEndpoint =
        endpoint.replace(
          `${encodeURIComponent(primaryModel)}:generateContent`,
          `${encodeURIComponent(backupModel)}:generateContent`
        );

      configs.push({
        name:
          "backup",

        endpoint:
          backupEndpoint,

        apiKey:
          backupApiKey ||
          primaryApiKey,

        model:
          backupModel,
      });
    }

    let lastResponse:
      Response | null =
        null;

    for (
      let index = 0;
      index < configs.length;
      index += 1
    ) {
      const config =
        configs[index];

      const headers =
        new Headers(
          init.headers
        );

      headers.set(
        "x-goog-api-key",
        config.apiKey
      );

      const response =
        await fetch(
          config.endpoint,
          {
            ...init,
            headers,
          }
        );

      lastResponse =
        response;

      if (
        response.ok
      ) {
        console.info(
          "GEMINI_BATCH_SUCCESS:",
          {
            config:
              config.name,

            model:
              config.model,

            status:
              response.status,
          }
        );

        return response;
      }

      let message =
        "";

      try {
        const copy =
          response.clone();

        const data =
          (await copy.json()) as GeminiResponse;

        message =
          data.error?.message ??
          "";
      }
      catch {
        message =
          `HTTP ${response.status}`;
      }

      const canFallback =
        response.status === 429 ||
        response.status === 404 ||
        response.status === 408 ||
        response.status >= 500;

      const hasNext =
        index <
        configs.length - 1;

      console.warn(
        "GEMINI_BATCH_ATTEMPT_FAILED:",
        {
          config:
            config.name,

          model:
            config.model,

          status:
            response.status,

          message,

          willTryBackup:
            canFallback &&
            hasNext,
        }
      );

      if (
        !canFallback ||
        !hasNext
      ) {
        return response;
      }

      console.warn(
        "GEMINI_BATCH_SWITCHING_TO_BACKUP:",
        {
          fromModel:
            config.model,

          toModel:
            configs[index + 1]
              .model,
        }
      );
    }

    if (
      lastResponse
    ) {
      return lastResponse;
    }

    throw new Error(
      "Gemini primary and backup requests failed."
    );
  }


const regionSchema = {
  type: "OBJECT",

  properties: {
    title: {
      type: "STRING",
    },

    activityType: {
      type: "STRING",

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
      type: "STRING",
    },

    instructions: {
      type: "STRING",
    },

    x: {
      type: "NUMBER",
    },

    y: {
      type: "NUMBER",
    },

    width: {
      type: "NUMBER",
    },

    height: {
      type: "NUMBER",
    },

    audioText: {
      type: "STRING",
    },

    content: {
      type: "OBJECT",

      properties: {
        text: {
          type: "STRING",
        },

        letter: {
          type: "STRING",
        },

        forms: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        options: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        questions: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        examples: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        keywords: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        words: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        left: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        right: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
        },

        items: {
          type: "ARRAY",

          items: {
            type: "OBJECT",

            properties: {
              prompt: {
                type: "STRING",
              },

              sentence: {
                type: "STRING",
              },

              options: {
                type: "ARRAY",

                items: {
                  type: "STRING",
                },
              },
            },
          },
        },

        imageLabels: {
          type: "ARRAY",

          items: {
            type: "STRING",
          },
        },

        notes: {
          type: "STRING",
        },
      },
    },

    answer: {
      type: "OBJECT",

      properties: {
        correct: {
          type: "STRING",
        },

        correct_values: {
          type: "ARRAY",

          items: {
            type: "STRING",
          },
        },

        answers: {
          type: "ARRAY",

          items: {
            type: "STRING",
          },
        },

        correct_words: {
          type: "ARRAY",

          items: {
            type: "STRING",
          },
        },

        correct_letter: {
          type: "STRING",
        },

        pairs: {
          type: "ARRAY",

          items: {
            type: "OBJECT",

            properties: {
              left: {
                type: "STRING",
              },

              right: {
                type: "STRING",
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
} as const;

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

    if (
      !apiKey ||
      !model
    ) {
      return NextResponse.json(
        {
          error:
            "إعدادات Gemini غير مكتملة.",
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
        profile.role ??
        ""
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
      AnalyzePagesRequest;

    try {
      body =
        (
          await request.json()
        ) as AnalyzePagesRequest;
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

    const pages =
      Array.isArray(
        body.pages
      )
        ? body.pages
            .map(
              (page) => ({
                pageNumber:
                  typeof page.pageNumber ===
                    "number"
                    ? Math.round(
                        page.pageNumber
                      )
                    : 0,

                imageUrl:
                  cleanText(
                    page.imageUrl,
                    1000
                  ),
              })
            )
            .filter(
              (page) =>
                page.pageNumber > 0 &&
                Boolean(
                  page.imageUrl
                )
            )
        : [];

    if (
      pages.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "أرسل صفحة واحدة على الأقل.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      pages.length > 4
    ) {
      return NextResponse.json(
        {
          error:
            "الحد الأقصى 4 صفحات في كل دفعة.",
        },
        {
          status: 400,
        }
      );
    }

    const uniquePages =
      new Set(
        pages.map(
          (page) =>
            page.pageNumber
        )
      );

    if (
      uniquePages.size !==
      pages.length
    ) {
      return NextResponse.json(
        {
          error:
            "لا تكرر رقم الصفحة داخل الدفعة.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: lesson,
      error:
        lessonError,
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

    const {
      data:
        existingActivities,
      error:
        activitiesError,
    } =
      await supabase
        .from(
          "lesson_activities"
        )
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

    if (
      activitiesError
    ) {
      throw activitiesError;
    }

    const imageParts:
      Array<Record<
        string,
        unknown
      >> = [];

    for (
      const page of pages
    ) {
      const filePath =
        resolvePublicImagePath(
          page.imageUrl
        );

      const bytes =
        await readFile(
          filePath
        );

      if (
        bytes.length === 0
      ) {
        throw new Error(
          `ملف الصفحة ${page.pageNumber} فارغ.`
        );
      }

      imageParts.push({
        text:
          `الصورة التالية تخص الصفحة رقم ${page.pageNumber}.`,
      });

      imageParts.push({
        inline_data: {
          mime_type:
            mimeTypeFromPath(
              filePath
            ),

          data:
            bytes.toString(
              "base64"
            ),
        },
      });
    }

    const requestedNumbers =
      pages
        .map(
          (page) =>
            page.pageNumber
        )
        .join(
          "، "
        );

    const prompt =
      `
حلل جميع صور صفحات كتاب اللغة العربية المرفقة في هذا الطلب.

السياق:
- منصة: ضاديوم
- عنوان الدرس: ${lesson.title}
- رقم الدرس: ${lesson.lesson_number ?? ""}
- أرقام الصفحات المطلوب تحليلها: ${requestedNumbers}

أمام كل صورة وضعت لك نصًا يحدد رقم الصفحة التي تخصها.

أرجع عنصرًا واحدًا داخل pages لكل صفحة مرفقة.
يجب أن يكون pageNumber مطابقًا للرقم المكتوب قبل الصورة تمامًا.

لكل صفحة:
- استخرج الأنشطة الظاهرة في تلك الصفحة فقط.
- لا تنقل نشاطًا من صورة إلى صفحة أخرى.
- لا تكرر النشاط نفسه بلا سبب.

لكل نشاط:
1. العنوان.
2. activityType من القيم المسموحة.
3. section.
4. instructions.
5. x و y و width و height كنسب مئوية من 0 إلى 100 بالنسبة للصورة الخاصة بتلك الصفحة.
6. audioText مناسب ليقرأه ضاد.
7. content الفعلي الذي يحتاجه النشاط الرقمي.
8. answer فقط إذا كانت الإجابة مؤكدة.
9. لا تخترع إجابة غير واضحة.

أنواع activityType:
listening
speaking
reading
multiple_choice
matching
fill_blank
writing
other

قواعد content:
- reading: text وexamples وkeywords وwords عند الحاجة.
- multiple_choice: options، ويمكن استخدام questions أو items.
- fill_blank: items مع prompt أو sentence وoptions.
- matching: left وright.
- writing: letter وforms.
- الصور: imageLabels إذا أمكن التعرف عليها.

قواعد answer:
- correct للإجابة الواحدة.
- correct_values لعدة إجابات.
- answers للفراغات المتعددة.
- correct_words للترتيب.
- correct_letter للحرف.
- pairs للتوصيل.

مهم:
نريد تحويل الصفحة إلى نشاط يمكن للطالب تنفيذه داخل ضاديوم دون الحاجة إلى الكتاب أو الكراسة.

أرجع JSON فقط.
      `.trim();

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      `${encodeURIComponent(model)}:generateContent`;

    const geminiResponse =
      await fetchGemini(
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
أنت محلل بصري خبير في مناهج اللغة العربية.

ستستقبل عدة صور في الطلب نفسه.
كل صورة لها رقم صفحة مذكور قبلها.

حلل كل صورة بصورة مستقلة ثم أرجع جميع النتائج داخل pages.
لا تخلط محتوى صفحة مع صفحة أخرى.
لا تفترض محتوى غير ظاهر.
                      `.trim(),
                  },
                ],
              },

              contents: [
                {
                  role:
                    "user",

                  parts: [
                    ...imageParts,

                    {
                      text:
                        prompt,
                    },
                  ],
                },
              ],

              generationConfig: {
                maxOutputTokens:
                  12000,

                responseMimeType:
                  "application/json",

                responseSchema: {
                  type:
                    "OBJECT",

                  properties: {
                    pages: {
                      type:
                        "ARRAY",

                      items: {
                        type:
                          "OBJECT",

                        properties: {
                          pageNumber: {
                            type:
                              "INTEGER",
                          },

                          pageTitle: {
                            type:
                              "STRING",
                          },

                          regions: {
                            type:
                              "ARRAY",

                            items:
                              regionSchema,
                          },
                        },

                        required: [
                          "pageNumber",
                          "pageTitle",
                          "regions",
                        ],
                      },
                    },
                  },

                  required: [
                    "pages",
                  ],
                },
              },
            }),

          cache:
            "no-store",
        }
      );

    const data =
      (
        await geminiResponse.json()
      ) as GeminiResponse;

    if (
      !geminiResponse.ok
    ) {
      const message =
        data.error?.message ||
        `Gemini error ${geminiResponse.status}`;

      console.error(
        "LESSON_PAGES_GEMINI_ERROR:",
        {
          status:
            geminiResponse.status,

          message,
        }
      );

      return NextResponse.json(
        {
          error:
            `تعذر تحليل مجموعة الصفحات: ${message}`,
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
            "Gemini رفض تحليل مجموعة الصفحات.",
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
            part.text ??
            ""
        )
        .join("")
        .trim() ??
      "";

    if (
      !generatedText
    ) {
      return NextResponse.json(
        {
          error:
            "لم يرجع Gemini تحليلًا للصفحات.",
        },
        {
          status: 502,
        }
      );
    }

    let parsed: unknown;

try {
  parsed =
    extractJson(
      generatedText
    );
}
catch (error) {
  const finishReason =
    data
      .candidates?.[0]
      ?.finishReason ??
    "";

  console.error(
    "LESSON_PAGES_JSON_PARSE_ERROR:",
    {
      finishReason,

      generatedTextLength:
        generatedText.length,

      generatedTextTail:
        generatedText.slice(
          -800
        ),

      error:
        error instanceof Error
          ? error.message
          : String(error),
    }
  );

  return NextResponse.json(
    {
      error:
        "تعذر قراءة JSON الناتج من Gemini.",

      diagnostic: {
        finishReason,

        generatedTextLength:
          generatedText.length,
      },
    },
    {
      status: 502,
    }
  );
}

    const analyses =
      normalizeBatchResult(
        parsed,
        uniquePages
      );

    const results =
      analyses.map(
        (analysis) => {
          const input =
            pages.find(
              (page) =>
                page.pageNumber ===
                analysis.pageNumber
            );

          const proposals =
            analysis.regions.map(
              (region) => {
                const ranked =
                  (
                    existingActivities ??
                    []
                  )
                    .map(
                      (activity) => ({
                        activity,

                        score:
                          sharedScoreActivityMatch(
                            analysis.pageNumber,
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
                  best?.score ??
                  0;

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

          return {
            pageNumber:
              analysis.pageNumber,

            imageUrl:
              input?.imageUrl ??
              null,

            analysis,

            proposals,
          };
        }
      );

    const proposals =
      results.flatMap(
        (result) =>
          result.proposals.map(
            (proposal) => ({
              pageNumber:
                result.pageNumber,

              imageUrl:
                result.imageUrl,

              ...proposal,
            })
          )
      );

    const auto =
      proposals.filter(
        (proposal) =>
          proposal.decision ===
          "AUTO"
      );

    const review =
      proposals.filter(
        (proposal) =>
          proposal.decision ===
          "REVIEW"
      );

    const reject =
      proposals.filter(
        (proposal) =>
          proposal.decision ===
          "REJECT"
      );

    return NextResponse.json(
      {
        success: true,

        lessonId,

        requestedPages:
          pages.map(
            (page) =>
              page.pageNumber
          ),

        returnedPages:
          results.map(
            (result) =>
              result.pageNumber
          ),

        summary: {
          pagesRequested:
            pages.length,

          pagesReturned:
            results.length,

          proposals:
            proposals.length,

          auto:
            auto.length,

          review:
            review.length,

          reject:
            reject.length,
        },

        results,

        auto,
        review,
        reject,

        mode:
          "preview",
      },
      {
        status: 200,
      }
    );
  }
  catch (error) {
    console.error(
      "LESSON_PAGES_ANALYZER_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر تحليل مجموعة الصفحات.",
      },
      {
        status: 500,
      }
    );
  }
}
