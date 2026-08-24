import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  scoreActivityMatch,
  type ActivityRegion,
} from "@/lib/lesson-ai/matching";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type RequestBody = {
  lessonId?: string;
};

function cleanText(
  value: unknown,
  maxLength = 200
): string {
  return typeof value === "string"
    ? value
        .trim()
        .slice(
          0,
          maxLength
        )
    : "";
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
          activity_order,
          title,
          activity_type,
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
          matched_activity_id,
          matched_activity_order,
          matched_activity_title,
          confidence,
          decision,
          batch_index
        `)
        .eq(
          "lesson_id",
          lessonId
        )
        .order(
          "source_page",
          {
            ascending: true,
          }
        );

    if (
      proposalsError
    ) {
      throw proposalsError;
    }

    if (
      !proposals ||
      proposals.length === 0
    ) {
      return NextResponse.json(
        {
          success: true,

          lessonId,

          summary: {
            proposals: 0,
            updated: 0,
            auto: 0,
            review: 0,
            reject: 0,
          },

          results: [],
        }
      );
    }

    const results = [];

    for (
      const proposal of
        proposals
    ) {
      const region:
        ActivityRegion = {
          title:
            String(
              proposal.detected_title ??
              ""
            ),

          activityType:
            String(
              proposal.detected_type ??
              "other"
            ) as ActivityRegion["activityType"],

          section:
            String(
              proposal.section ??
              ""
            ),

          instructions:
            String(
              proposal.instructions ??
              ""
            ),

          x:
            Number(
              proposal.region_x ??
              0
            ),

          y:
            Number(
              proposal.region_y ??
              0
            ),

          width:
            Number(
              proposal.region_width ??
              0
            ),

          height:
            Number(
              proposal.region_height ??
              0
            ),

          audioText:
            String(
              proposal.audio_text ??
              ""
            ),

          content:
            (
              proposal.content &&
              typeof proposal.content ===
                "object" &&
              !Array.isArray(
                proposal.content
              )
            )
              ? proposal.content as
                  Record<
                    string,
                    unknown
                  >
              : {},

          answer:
            (
              proposal.answer &&
              typeof proposal.answer ===
                "object" &&
              !Array.isArray(
                proposal.answer
              )
            )
              ? proposal.answer as
                  Record<
                    string,
                    unknown
                  >
              : {},
        };

      const ranked =
        (activities ?? [])
          .map(
            (activity) => ({
              activity,

              score:
                scoreActivityMatch(
                  Number(
                    proposal.source_page
                  ),
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
        ranked[0] ??
        null;

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

      const {
        error:
          updateError,
      } =
        await supabase
          .from(
            "lesson_ai_analysis_proposals"
          )
          .update({
            matched_activity_id:
              best?.activity.id ??
              null,

            matched_activity_order:
              typeof best?.activity
                .activity_order ===
                "number"
                ? best.activity
                    .activity_order
                : null,

            matched_activity_title:
              best?.activity.title ??
              null,

            confidence,

            decision,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            proposal.id
          );

      if (
        updateError
      ) {
        throw updateError;
      }

      results.push({
        id:
          proposal.id,

        sourcePage:
          proposal.source_page,

        detectedTitle:
          proposal.detected_title,

        old: {
          matchedActivityId:
            proposal
              .matched_activity_id,

          matchedActivityOrder:
            proposal
              .matched_activity_order,

          matchedActivityTitle:
            proposal
              .matched_activity_title,

          confidence:
            proposal.confidence,

          decision:
            proposal.decision,
        },

        new: {
          matchedActivityId:
            best?.activity.id ??
            null,

          matchedActivityOrder:
            best?.activity
              .activity_order ??
            null,

          matchedActivityTitle:
            best?.activity.title ??
            null,

          confidence,

          decision,
        },
      });
    }

    const auto =
      results.filter(
        (item) =>
          item.new.decision ===
          "AUTO"
      ).length;

    const review =
      results.filter(
        (item) =>
          item.new.decision ===
          "REVIEW"
      ).length;

    const reject =
      results.filter(
        (item) =>
          item.new.decision ===
          "REJECT"
      ).length;

    return NextResponse.json(
      {
        success: true,

        lessonId,

        summary: {
          proposals:
            results.length,

          updated:
            results.length,

          auto,
          review,
          reject,
        },

        results,
      }
    );
  }
  catch (error) {
    console.error(
      "REMATCH_PROPOSALS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر إعادة حساب المطابقة.",
      },
      {
        status: 500,
      }
    );
  }
}
