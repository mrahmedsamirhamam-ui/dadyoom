import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  mergeActivityMedia,
} from "@/lib/lesson-ai/activity-media";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type RequestBody = {
  lessonId?: string;
  apply?: boolean;
  proposalIds?: string[];
};

const allowedTypes =
  new Set([
    "multiple_choice",
    "true_false",
    "fill_blank",
    "matching",
    "writing",
    "listening",
    "speaking",
    "reading",
  ]);

function cleanText(
  value: unknown,
  maxLength = 1000
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

function isObject(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return Boolean(
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  );
}

function hasUsefulContent(
  value: unknown
): boolean {
  if (!isObject(value)) {
    return false;
  }

  const keys =
    Object.keys(value);

  if (
    keys.length === 0
  ) {
    return false;
  }

  return Object.values(
    value
  ).some(
    (item) => {
      if (
        typeof item ===
          "string"
      ) {
        return (
          item.trim().length >
          0
        );
      }

      if (
        Array.isArray(item)
      ) {
        return (
          item.length >
          0
        );
      }

      if (
        isObject(item)
      ) {
        return (
          Object.keys(item)
            .length >
          0
        );
      }

      return (
        item !== null &&
        item !== undefined
      );
    }
  );
}

function normalizeTitle(
  value: string
): string {
  return value
    .replace(
      /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,
      ""
    )
    .replace(
      /[\u0623\u0625\u0622\u0671]/g,
      "\u0627"
    )
    .replace(
      /\u0649/g,
      "\u064A"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .toLowerCase();
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
      RequestBody;

    try {
      body =
        (
          await request.json()
        ) as RequestBody;
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

    const apply =
      body.apply === true;

    const selectedProposalIds =
      Array.isArray(
        body.proposalIds
      )
        ? new Set(
            body.proposalIds
              .filter(
                (value) =>
                  typeof value ===
                    "string"
              )
              .map(
                (value) =>
                  value.trim()
              )
              .filter(Boolean)
          )
        : null;

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
          title,
          activity_type,
          activity_order,
          content
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

    const {
      data:
        rejects,
      error:
        rejectsError,
    } =
      await supabase
        .from(
          "lesson_ai_analysis_proposals"
        )
        .select(`
          id,
          source_page,
          image_url,
          detected_title,
          detected_type,
          section,
          instructions,
          audio_text,
          region_x,
          region_y,
          region_width,
          region_height,
          content,
          answer,
          confidence,
          decision
        `)
        .eq(
          "lesson_id",
          lessonId
        )
        .eq(
          "decision",
          "REJECT"
        )
        .order(
          "source_page",
          {
            ascending: true,
          }
        );

    if (
      rejectsError
    ) {
      throw rejectsError;
    }

    const existingKeys =
      new Set(
        (
          existingActivities ??
          []
        ).map(
          (activity) => {
            const sourcePage =
              isObject(
                activity.content
              ) &&
              typeof activity
                .content
                .source_page ===
                "number"
                ? activity
                    .content
                    .source_page
                : null;

            return [
              normalizeTitle(
                String(
                  activity.title ??
                  ""
                )
              ),

              String(
                activity.activity_type ??
                ""
              ),

              String(
                sourcePage ??
                ""
              ),
            ].join("|");
          }
        )
      );

    let nextOrder =
      Math.max(
        0,
        ...(
          existingActivities ??
          []
        ).map(
          (activity) =>
            Number(
              activity
                .activity_order ??
              0
            )
        )
      ) + 1;

    const candidates = [];

    for (
      const reject of
        rejects ??
        []
    ) {
      const title =
        cleanText(
          reject.detected_title,
          500
        );

      const type =
        cleanText(
          reject.detected_type,
          100
        );

      const page =
        Number(
          reject.source_page
        );

      const content =
        mergeActivityMedia(
          reject.content,
          {
            sourcePage:
              page,

            imageUrl:
              reject.image_url,

            audioText:
              reject.audio_text,

            region: {
              x:
                reject.region_x,

              y:
                reject.region_y,

              width:
                reject.region_width,

              height:
                reject.region_height,
            },
          }
        );

      const answer =
        isObject(
          reject.answer
        )
          ? reject.answer
          : {};

      const reasons:
        string[] = [];

      if (!title) {
        reasons.push(
          "missing_title"
        );
      }

      if (
        !allowedTypes.has(
          type
        )
      ) {
        reasons.push(
          "unsupported_type"
        );
      }

      if (
        !Number.isFinite(
          page
        ) ||
        page <= 0
      ) {
        reasons.push(
          "invalid_page"
        );
      }

      if (
        !hasUsefulContent(
          reject.content
        )
      ) {
        reasons.push(
          "empty_content"
        );
      }

      const duplicateKey =
        [
          normalizeTitle(
            title
          ),
          type,
          String(page),
        ].join("|");

      if (
        existingKeys.has(
          duplicateKey
        )
      ) {
        reasons.push(
          "duplicate_existing"
        );
      }

      const eligible =
        reasons.length === 0;

      const candidate = {
        proposalId:
          reject.id,

        sourcePage:
          page,

        title,

        activityType:
          type,

        section:
          cleanText(
            reject.section,
            500
          ) ||
          "التدريبات",

        instructions:
          cleanText(
            reject.instructions,
            2000
          ),

        prompt:
          cleanText(
            reject.audio_text,
            2000
          ),

        content,

        answer,

        confidence:
          Number(
            reject.confidence ??
            0
          ),

        eligible,

        reasons,

        proposedActivityOrder:
          eligible
            ? nextOrder
            : null,
      };

      candidates.push(
        candidate
      );

      if (eligible) {
        existingKeys.add(
          duplicateKey
        );

        nextOrder += 1;
      }
    }

    const eligibleCandidates =
      candidates.filter(
        (item) =>
          item.eligible &&
          (
            !selectedProposalIds ||
            selectedProposalIds.size === 0 ||
            selectedProposalIds.has(
              item.proposalId
            )
          )
      );

    if (
      apply &&
      eligibleCandidates
        .length >
        0
    ) {
      const rows =
        eligibleCandidates.map(
          (item) => ({
            lesson_id:
              lessonId,

            title:
              item.title,

            activity_type:
              item.activityType,

            instructions:
              item.instructions ||
              null,

            content:
              item.content,

            activity_order:
              item
                .proposedActivityOrder,

            points:
              5,

            is_published:
              false,

            section:
              item.section,

            prompt:
              item.prompt ||
              null,

            answer:
              item.answer,

            is_required:
              true,
          })
        );

      const {
        error:
          insertError,
      } =
        await supabase
          .from(
            "lesson_activities"
          )
          .insert(
            rows
          );

      if (
        insertError
      ) {
        throw insertError;
      }
    }

    return NextResponse.json(
      {
        success: true,

        mode:
          apply
            ? "apply"
            : "preview",

        lessonId,

        summary: {
          rejects:
            rejects?.length ??
            0,

          eligible:
            eligibleCandidates
              .length,

          skipped:
            candidates.length -
            eligibleCandidates
              .length,

          inserted:
            apply
              ? eligibleCandidates
                  .length
              : 0,
        },

        candidates,
      }
    );
  }
  catch (error) {
    console.error(
      "CREATE_REJECT_CANDIDATES_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر تجهيز الأنشطة الجديدة.",
      },
      {
        status: 500,
      }
    );
  }
}
