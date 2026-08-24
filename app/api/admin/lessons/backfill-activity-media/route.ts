import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  mergeActivityMedia,
} from "@/lib/lesson-ai/activity-media";

import {
  normalizeForMatch,
} from "@/lib/lesson-ai/matching";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type RequestBody = {
  lessonId?: string;
  apply?: boolean;
};

type JsonObject =
  Record<string, unknown>;

function isObject(
  value: unknown
): value is JsonObject {
  return Boolean(
    value &&
    typeof value ===
      "object" &&
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

function pageFromContent(
  value: unknown
): number | null {
  if (!isObject(value)) {
    return null;
  }

  const page =
    Number(
      value.source_page
    );

  return (
    Number.isFinite(page) &&
    page > 0
  )
    ? Math.round(page)
    : null;
}

function identity(
  title: unknown,
  type: unknown,
  page: unknown
): string {
  return [
    normalizeForMatch(
      cleanText(title)
    ),

    cleanText(type),

    String(
      Number(page) || ""
    ),
  ].join("|");
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
          content,
          is_published
        `)
        .eq(
          "lesson_id",
          lessonId
        )
        .eq(
          "is_published",
          false
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
        proposals,
      error:
        proposalsError,
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
          audio_text,
          region_x,
          region_y,
          region_width,
          region_height,
          confidence,
          decision
        `)
        .eq(
          "lesson_id",
          lessonId
        )
        .order(
          "confidence",
          {
            ascending: false,
          }
        );

    if (
      proposalsError
    ) {
      throw proposalsError;
    }

    const proposalMap =
      new Map<
        string,
        NonNullable<
          typeof proposals
        >[number]
      >();

    for (
      const proposal of
        proposals ??
        []
    ) {
      const key =
        identity(
          proposal
            .detected_title,

          proposal
            .detected_type,

          proposal
            .source_page
        );

      /*
       * Proposals are sorted by confidence DESC.
       * Keep the strongest exact identity match.
       */
      if (
        key &&
        !proposalMap.has(
          key
        )
      ) {
        proposalMap.set(
          key,
          proposal
        );
      }
    }

    const results = [];

    let matched =
      0;

    let changed =
      0;

    let updated =
      0;

    for (
      const activity of
        activities ??
        []
    ) {
      const sourcePage =
        pageFromContent(
          activity.content
        );

      const key =
        identity(
          activity.title,
          activity
            .activity_type,
          sourcePage
        );

      const proposal =
        proposalMap.get(
          key
        ) ??
        null;

      if (!proposal) {
        results.push({
          id:
            activity.id,

          activityOrder:
            activity
              .activity_order,

          title:
            activity.title,

          sourcePage,

          matched:
            false,

          changed:
            false,

          updated:
            false,
        });

        continue;
      }

      matched += 1;

      const nextContent =
        mergeActivityMedia(
          activity.content,
          {
            sourcePage:
              proposal
                .source_page,

            imageUrl:
              proposal
                .image_url,

            audioText:
              proposal
                .audio_text,

            region: {
              x:
                proposal
                  .region_x,

              y:
                proposal
                  .region_y,

              width:
                proposal
                  .region_width,

              height:
                proposal
                  .region_height,
            },
          }
        );

      const contentChanged =
        JSON.stringify(
          nextContent
        ) !==
        JSON.stringify(
          activity.content ??
          {}
        );

      if (
        contentChanged
      ) {
        changed += 1;
      }

      let didUpdate =
        false;

      if (
        apply &&
        contentChanged
      ) {
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

        didUpdate =
          true;

        updated +=
          1;
      }

      results.push({
        id:
          activity.id,

        activityOrder:
          activity
            .activity_order,

        title:
          activity.title,

        sourcePage,

        proposalId:
          proposal.id,

        decision:
          proposal.decision,

        confidence:
          proposal.confidence,

        matched:
          true,

        changed:
          contentChanged,

        updated:
          didUpdate,

        media: {
          imageUrl:
            nextContent
              .image_url ??
            null,

          imageRegion:
            nextContent
              .image_region ??
            null,

          audioText:
            nextContent
              .audio_text ??
            null,
        },
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
        activities:
          activities?.length ??
          0,

        proposals:
          proposals?.length ??
          0,

        matched,

        changed,

        updated,

        unmatched:
          (
            activities?.length ??
            0
          ) -
          matched,
      },

      results,
    });
  }
  catch (error) {
    console.error(
      "BACKFILL_ACTIVITY_MEDIA_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "تعذر ربط وسائط الأنشطة.",
      },
      {
        status: 500,
      }
    );
  }
}
