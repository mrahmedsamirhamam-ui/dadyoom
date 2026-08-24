import {
  NextResponse,
} from "next/server";

import {
  readFile,
} from "node:fs/promises";

import path from "node:path";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  getRequiredImageLabels,
  normalizeImageOptions,
} from "@/lib/lesson-ai/image-options";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type RequestBody = {
  lessonId?: string;
  apply?: boolean;
  includePublished?: boolean;
  activityOrders?: number[];
};

type JsonObject =
  Record<string, unknown>;

function isObject(
  value: unknown
): value is JsonObject {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function cleanText(
  value: unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
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
      publicRoot
    )
  ) {
    throw new Error(
      "مسار الصورة خارج public."
    );
  }

  return filePath;
}

function mimeTypeFromPath(
  filePath: string
): string {
  const extension =
    path
      .extname(
        filePath
      )
      .toLowerCase();

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

function extractGeminiText(
  value: unknown
): string {
  if (!isObject(value)) {
    return "";
  }

  const candidates =
    Array.isArray(
      value.candidates
    )
      ? value.candidates
      : [];

  const first =
    candidates[0];

  if (!isObject(first)) {
    return "";
  }

  const candidateContent =
    first.content;

  if (
    !isObject(
      candidateContent
    )
  ) {
    return "";
  }

  const parts =
    Array.isArray(
      candidateContent.parts
    )
      ? candidateContent.parts
      : [];

  for (
    const part of
      parts
  ) {
    if (
      isObject(part) &&
      typeof part.text ===
        "string"
    ) {
      return part.text.trim();
    }
  }

  return "";
}

export async function POST(
  request: Request
) {
  try {
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
        .maybeSingle();

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

    const body =
      (
        await request.json()
      ) as RequestBody;

    const lessonId =
      cleanText(
        body.lessonId
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

    const apply =
      body.apply === true;

    const includePublished =
      body.includePublished ===
        true;

    if (
      apply &&
      includePublished
    ) {
      return NextResponse.json(
        {
          error:
            "includePublished ???? ?? ??? preview ???.",
        },
        {
          status: 400,
        }
      );
    }

    const selectedOrders =
      Array.isArray(
        body.activityOrders
      )
        ? new Set(
            body.activityOrders
              .filter(
                (value) =>
                  Number.isFinite(
                    value
                  ) &&
                  value > 0
              )
              .map(
                (value) =>
                  Math.round(
                    value
                  )
              )
          )
        : null;

    const apiKey =
      (
        process.env
          .GEMINI_API_KEY_BACKUP ||
        process.env
          .GEMINI_API_KEY
      )?.trim();

    const model =
      (
        process.env
          .GEMINI_MODEL_BACKUP ||
        process.env
          .GEMINI_MODEL ||
        "gemini-3.5-flash-lite"
      ).trim();

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

    const {
      data:
        activities,
      error:
        activitiesError,
    } =
      await supabase
        .from(
          "lesson_activities"
        )
        .select(`
          id,
          title,
          activity_type,
          activity_order,
          instructions,
          content,
          answer,
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

    const visibleActivities =
      includePublished
        ? (
            activities ??
            []
          )
        : (
            activities ??
            []
          ).filter(
            (activity) =>
              activity.is_published ===
                false
          );

    const targets =
      visibleActivities
        .filter(
          (activity) =>
            !selectedOrders ||
            selectedOrders
              .size === 0 ||
            selectedOrders.has(
              Number(
                activity
                  .activity_order
              )
            )
        )
        .map(
          (activity) => {
            const content =
              isObject(
                activity.content
              )
                ? activity.content
                : {};

            return {
              activity,
              content,

              labels:
                getRequiredImageLabels(
                  activity
                    .activity_type,
                  content
                ),

              imageUrl:
                cleanText(
                  content
                    .image_url
                ),
            };
          }
        )
        .filter(
          (item) =>
            item.labels.length >
              0 &&
            Boolean(
              item.imageUrl
            )
        );

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      `${encodeURIComponent(model)}:generateContent`;

    const results = [];

    let complete =
      0;

    let incomplete =
      0;

    let updated =
      0;

    for (
      const target of
        targets
    ) {
      const {
        activity,
        content,
        labels,
        imageUrl,
      } =
        target;

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
          `صورة النشاط #${activity.activity_order} فارغة.`
        );
      }

      const base64 =
        bytes.toString(
          "base64"
        );

      const prompt =
        `
You are a precise visual analyst for Arabic school textbook pages.

Your task is NOT to analyze the entire page.
Your task is to extract image regions belonging to ONE specific activity only.

TARGET ACTIVITY:

- Activity order: ${activity.activity_order}
- Activity type: ${activity.activity_type}
- Title: ${activity.title}
- Instructions: ${activity.instructions ?? ""}

REQUIRED IMAGES, IN FIXED ORDER:

${labels
  .map(
    (label, index) =>
      `${index + 1}. ${label}`
  )
  .join("\n")}

FOLLOW THIS PROCESS STRICTLY:

1. First locate the exact target activity on the page using its title, instructions, and visual layout.
2. Establish the visual boundaries of that activity before selecting any images.
3. Ignore every image belonging to another activity, even if it looks semantically similar.
4. Inspect only the actual illustrations/photos inside the target activity.
5. Match the requested image list to the visible images as one global assignment.
6. Each physical image may be assigned to only one index.
7. Never reuse the same physical image for multiple indexes.
8. Verify people, objects, gender, relative positions, and overall scene composition.
9. For a requested scene with multiple people, select the complete matching scene, not a nearby individual or unrelated illustration.
10. If a requested image cannot be identified with high confidence, OMIT that index instead of guessing.

COORDINATE CONTRACT:

- Return only index to identify the requested item. Do not return label.
- x = left edge of the bounding box.
- y = top edge of the bounding box.
- width = bounding-box width.
- height = bounding-box height.
- Use a 0-to-1000 coordinate system for the FULL PAGE.
- (0,0) is the top-left corner of the page.
- (1000,1000) is the bottom-right corner of the page.

BOUNDING-BOX RULES:

- The box must tightly contain the illustration/photo itself.
- Include a very small safety margin so heads, limbs, or object edges are not clipped.
- Do NOT include question text, words, answer lines, activity numbers, borders, or page numbers.
- Do NOT include any neighboring image.
- Do NOT select blank page space unless it is visually part of the illustration.
- Prefer a slightly larger complete image box over a box that cuts off part of the subject.
- Prefer a slightly smaller clean box over one that includes text or another activity.

FINAL SELF-CHECK FOR EVERY RETURNED INDEX:

- Is this image inside the correct target activity?
- Does it visually match the requested Arabic label?
- Is the complete relevant subject visible?
- Is text or a neighboring activity excluded?
- Is this physical image unique to this index?
- Would a human teacher recognize this crop immediately without needing surrounding page context?

confidence must be from 0 to 100.
Do not return an item when confidence is below 90.

Return JSON only.
        `.trim();

      const geminiResponse =
        await fetch(
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
                contents: [
                  {
                    role:
                      "user",

                    parts: [
                      {
                        inline_data: {
                          mime_type:
                            mimeTypeFromPath(
                              filePath
                            ),

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
                    0.05,

                  topP:
                    0.7,

                  maxOutputTokens:
                    4000,

                  responseMimeType:
                    "application/json",

                  responseSchema: {
                    type:
                      "OBJECT",

                    properties: {
                      options: {
                        type:
                          "ARRAY",

                        items: {
                          type:
                            "OBJECT",

                          properties: {
                            index: {
                              type:
                                "NUMBER",
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

                            confidence: {
                              type:
                                "NUMBER",
                            },
                          },

                          required: [
                            "index",
                            "x",
                            "y",
                            "width",
                            "height",
                            "confidence",
                          ],
                        },
                      },
                    },

                    required: [
                      "options",
                    ],
                  },
                },
              }),

            cache:
              "no-store",
          }
        );

      const raw =
        await geminiResponse
          .json();

      if (
        !geminiResponse.ok
      ) {
        results.push({
          activityOrder:
            activity
              .activity_order,

          title:
            activity.title,

          labels,

          complete:
            false,

          missing:
            labels,

          error:
            isObject(raw) &&
            isObject(
              raw.error
            )
              ? cleanText(
                  raw.error
                    .message
                )
              : "Gemini request failed.",
        });

        incomplete +=
          1;

        continue;
      }

      const responseText =
        extractGeminiText(
          raw
        );

      let parsed:
        unknown = {};

      try {
        parsed =
          responseText
            ? JSON.parse(
                responseText
              )
            : {};
      }
      catch {
        parsed = {};
      }

      const normalized =
        normalizeImageOptions(
          parsed,
          labels,
          imageUrl
        );

      if (
        normalized.complete
      ) {
        complete +=
          1;
      }
      else {
        incomplete +=
          1;
      }

      let didUpdate =
        false;

      /*
       * Safety gate:
       * Never write partial image option sets.
       */
      if (
        apply &&
        normalized.complete
      ) {
        const nextContent = {
          ...content,

          image_options:
            normalized.options,
        };

        const {
          error:
            updateError,
        } =
          await supabase
            .from(
              "lesson_activities"
            )
            .update({
              content:
                nextContent,

              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              activity.id
            )
            .eq(
              "is_published",
              false
            );

        if (
          updateError
        ) {
          throw updateError;
        }

        updated +=
          1;

        didUpdate =
          true;
      }

      results.push({
        activityOrder:
          activity
            .activity_order,

        title:
          activity.title,

        labels,

        found:
          normalized
            .options
            .length,

        required:
          labels.length,

        complete:
          normalized.complete,

        missing:
          normalized.missing,

        updated:
          didUpdate,

        options:
          normalized.options,

        aiReturned:
          isObject(parsed) &&
          Array.isArray(
            parsed.options
          )
            ? parsed.options.length
            : 0,



      });
    }

    return NextResponse.json({
      success: true,

      mode:
        apply
          ? "apply"
          : "preview",

      lessonId,

      summary: {
        targets:
          targets.length,

        complete,

        incomplete,

        updated,
      },

      results,
    });
  }
  catch (error) {
    console.error(
      "GENERATE_IMAGE_OPTIONS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "تعذر توليد خيارات الصور.",
      },
      {
        status: 500,
      }
    );
  }
}
