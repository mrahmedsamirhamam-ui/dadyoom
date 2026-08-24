import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  validateActivity,
} from "@/lib/lesson-ai/activity-validator";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

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
  maxLength = 5000
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
    !Array.isArray(value)
  );
}

async function getAdminClient() {
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
    return {
      error:
        NextResponse.json(
          {
            error:
              "يجب تسجيل الدخول.",
          },
          {
            status: 401,
          }
        ),
      supabase,
    };
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
    return {
      error:
        NextResponse.json(
          {
            error:
              "هذه الخاصية متاحة للمدير فقط.",
          },
          {
            status: 403,
          }
        ),
      supabase,
    };
  }

  return {
    error: null,
    supabase,
  };
}

export async function GET(
  request: Request
) {
  try {
    const {
      error:
        authError,
      supabase,
    } =
      await getAdminClient();

    if (authError) {
      return authError;
    }

    const url =
      new URL(
        request.url
      );

    const lessonId =
      cleanText(
        url.searchParams.get(
          "lessonId"
        ),
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
      data,
      error,
    } =
      await supabase
        .from(
          "lesson_activities"
        )
        .select(`
          id,
          lesson_id,
          title,
          activity_type,
          instructions,
          content,
          activity_order,
          points,
          is_published,
          section,
          prompt,
          answer,
          is_required,
          created_at,
          updated_at
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

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        activities:
          data ?? [],
      }
    );
  }
  catch (error) {
    console.error(
      "REVIEW_ACTIVITIES_GET_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر تحميل الأنشطة.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const {
      error:
        authError,
      supabase,
    } =
      await getAdminClient();

    if (authError) {
      return authError;
    }

    const body =
      (
        await request.json()
      ) as Record<
        string,
        unknown
      >;

    const id =
      cleanText(
        body.id,
        100
      );

    if (!id) {
      return NextResponse.json(
        {
          error:
            "id مطلوب.",
        },
        {
          status: 400,
        }
      );
    }

    const mediaOnly =
      body.mediaOnly ===
      true;

    const title =
      cleanText(
        body.title,
        500
      );

    const section =
      cleanText(
        body.section,
        500
      );

    const activityType =
      cleanText(
        body.activityType,
        100
      );

    if (
      !mediaOnly &&
      !title
    ) {
      return NextResponse.json(
        {
          error:
            "عنوان النشاط مطلوب.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !mediaOnly &&
      !section
    ) {
      return NextResponse.json(
        {
          error:
            "قسم النشاط مطلوب.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !mediaOnly &&
      !allowedTypes.has(
        activityType
      )
    ) {
      return NextResponse.json(
        {
          error:
            "نوع النشاط غير صالح.",
        },
        {
          status: 400,
        }
      );
    }

    const content =
      isObject(
        body.content
      )
        ? body.content
        : {};

    const answer =
      isObject(
        body.answer
      )
        ? body.answer
        : {};

    const publish =
      body.publish ===
      true;

    /*
     * Final publish protection belongs on the server.
     * The browser UI is only a convenience and must
     * never be the authority that decides publishability.
     */
    if (publish) {
      const validation =
        validateActivity({
          title,

          activity_type:
            activityType,

          content,

          answer,
        });

      if (
        !validation
          .validForPublish
      ) {
        return NextResponse.json(
          {
            success: false,

            error:
              "?? ???? ??? ?????? ??? ?????? ??? ??????.",

            validation,
          },
          {
            status: 400,
          }
        );
      }
    }

    if (mediaOnly) {
      const incomingContent =
        isObject(
          body.content
        )
          ? body.content
          : {};

      const imageOptions =
        Array.isArray(
          incomingContent.image_options
        )
          ? incomingContent.image_options
          : null;

      if (!imageOptions) {
        return NextResponse.json(
          {
            error:
              "image_options ?????? ?? mediaOnly.",
          },
          {
            status: 400,
          }
        );
      }

      const {
        data:
          currentActivity,
        error:
          currentError,
      } =
        await supabase
          .from(
            "lesson_activities"
          )
          .select(
            "id, content, is_published"
          )
          .eq(
            "id",
            id
          )
          .single();

      if (currentError) {
        throw currentError;
      }

      const currentContent =
        isObject(
          currentActivity.content
        )
          ? currentActivity.content
          : {};

      const nextContent = {
        ...currentContent,

        image_options:
          imageOptions,
      };

      const {
        data:
          updatedActivity,
        error:
          mediaUpdateError,
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
            id
          )
          .select()
          .single();

      if (mediaUpdateError) {
        throw mediaUpdateError;
      }

      return NextResponse.json(
        {
          success: true,

          mediaOnly: true,

          activity:
            updatedActivity,
        }
      );
    }

    const points =
      typeof body.points ===
        "number"
        ? Math.max(
            0,
            Math.round(
              body.points
            )
          )
        : 5;

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "lesson_activities"
        )
        .update({
          title,

          activity_type:
            activityType,

          section,

          instructions:
            cleanText(
              body.instructions,
              5000
            ) ||
            null,

          prompt:
            cleanText(
              body.prompt,
              5000
            ) ||
            null,

          content,

          answer,

          points,

          is_required:
            body.isRequired !==
            false,

          /*
           * This route manages the unpublished review queue.
           * Saving keeps the activity unpublished.
           * Only an explicit validated publish action may
           * promote it to the published state.
           */
          is_published:
            publish,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          id
        )
        .eq(
          "is_published",
          false
        )
        .select()
        .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        activity:
          data,
      }
    );
  }
  catch (error) {
    console.error(
      "REVIEW_ACTIVITIES_PATCH_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر تحديث النشاط.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request
) {
  try {
    const {
      error:
        authError,
      supabase,
    } =
      await getAdminClient();

    if (authError) {
      return authError;
    }

    const body =
      (
        await request.json()
      ) as Record<
        string,
        unknown
      >;

    const id =
      cleanText(
        body.id,
        100
      );

    if (!id) {
      return NextResponse.json(
        {
          error:
            "id مطلوب.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      error,
    } =
      await supabase
        .from(
          "lesson_activities"
        )
        .delete()
        .eq(
          "id",
          id
        );

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        id,
      }
    );
  }
  catch (error) {
    console.error(
      "REVIEW_ACTIVITIES_DELETE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر حذف النشاط.",
      },
      {
        status: 500,
      }
    );
  }
}
