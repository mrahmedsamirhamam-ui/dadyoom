import {
  NextResponse,
} from "next/server";

import {
  access,
} from "node:fs/promises";

import {
  join,
} from "node:path";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  getCorrectAnswerSpec,
} from "@/lib/lesson-activities/grading";


type JsonObject =
  Record<string, unknown>;


type ActivityRow = {
  id: string;
  lesson_id: string;
  activity_order: number | null;
  title: string | null;
  activity_type: string | null;
  content: unknown;
  answer: unknown;
  points: number | null;
  is_published: boolean | null;
};


type RuntimeIssue = {
  code: string;
  level:
    | "error"
    | "warning";
  message: string;
};


function objectValue(
  value: unknown
): JsonObject {
  return (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  )
    ? value as JsonObject
    : {};
}


function strings(
  value: unknown
): string[] {
  return Array.isArray(value)
    ? value
        .filter(
          (
            item
          ): item is string =>
            typeof item ===
              "string"
        )
        .map(
          item =>
            item.trim()
        )
        .filter(Boolean)
    : [];
}


function objects(
  value: unknown
): JsonObject[] {
  return Array.isArray(value)
    ? value.filter(
        (
          item
        ): item is JsonObject =>
          Boolean(
            item &&
            typeof item ===
              "object" &&
            !Array.isArray(item)
          )
      )
    : [];
}


function text(
  value: unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


function publicUrlToPath(
  value: string
): string | null {
  const clean =
    value.trim();

  if (
    !clean ||
    !clean.startsWith("/")
  ) {
    return null;
  }

  return join(
    process.cwd(),
    "public",
    ...clean
      .replace(
        /^\/+/,
        ""
      )
      .split("/")
  );
}


async function publicAssetExists(
  value: unknown
): Promise<boolean | null> {
  const url =
    text(value);

  if (!url) {
    return null;
  }

  /*
   * Remote URLs are considered resolvable
   * by this local-file audit.
   */
  if (
    /^https?:\/\//i.test(
      url
    )
  ) {
    return true;
  }

  const path =
    publicUrlToPath(
      url
    );

  if (!path) {
    return null;
  }

  try {
    await access(path);
    return true;
  }
  catch {
    return false;
  }
}


function imageOptionUrls(
  content: JsonObject
): string[] {
  const candidates:
    string[] = [];

  const imageOptions =
    objects(
      content.image_options
    );

  for (
    const item
    of imageOptions
  ) {
    const url =
      text(
        item.image_url ??
        item.url ??
        item.src
      );

    if (url) {
      candidates.push(url);
    }
  }

  return candidates;
}


export async function GET() {
  try {
    const supabase =
      await createClient();

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
          activity_order,
          title,
          activity_type,
          content,
          answer,
          points,
          is_published
        `)
        .order(
          "lesson_id",
          {
            ascending: true,
          }
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

    const activities:
      ActivityRow[] =
        data ?? [];

    const results = [];

    let runtimeReady =
      0;

    let runtimeErrors =
      0;

    let runtimeWarnings =
      0;

    let gradable =
      0;

    let completionOnly =
      0;

    let published =
      0;

    let unpublished =
      0;

    let withMainImage =
      0;

    let missingMainImageFile =
      0;

    let withImageOptions =
      0;

    let missingImageOptionFiles =
      0;


    for (
      const activity
      of activities
    ) {
      const issues:
        RuntimeIssue[] = [];

      const type =
        text(
          activity.activity_type
        );

      const content =
        objectValue(
          activity.content
        );

      const answer =
        objectValue(
          activity.answer
        );

      const correctSpec =
        getCorrectAnswerSpec(
          answer
        );

      if (correctSpec) {
        gradable++;
      }
      else {
        completionOnly++;
      }

      if (
        activity.is_published ===
        true
      ) {
        published++;
      }
      else {
        unpublished++;
      }


      // ======================================================
      // General runtime contract
      // ======================================================

      if (!activity.id) {
        issues.push({
          code:
            "RUNTIME_ID_MISSING",
          level:
            "error",
          message:
            "معرف النشاط غير موجود.",
        });
      }

      if (!type) {
        issues.push({
          code:
            "RUNTIME_TYPE_MISSING",
          level:
            "error",
          message:
            "نوع النشاط غير موجود.",
        });
      }

      if (
        !text(
          activity.title
        )
      ) {
        issues.push({
          code:
            "RUNTIME_TITLE_MISSING",
          level:
            "error",
          message:
            "عنوان النشاط غير موجود.",
        });
      }


      // ======================================================
      // Renderer-compatible structures
      // ======================================================

      const options =
        strings(
          content.options
        );

      const imageLabels =
        strings(
          content.imageLabels
        );

      const words =
        strings(
          content.words
        );

      const left =
        strings(
          content.left
        );

      const right =
        strings(
          content.right
        );

      const fillItems =
        objects(
          content.items
        );

      const questions =
        strings(
          content.questions
        );

      const itemOptions =
        fillItems.some(
          item =>
            strings(
              item.options
            ).length > 0
        );


      if (
        type ===
        "multiple_choice"
      ) {
        const executable =
          options.length >
            0 ||
          imageLabels.length >
            0 ||
          questions.length >
            0 ||
          itemOptions;

        if (!executable) {
          issues.push({
            code:
              "RUNTIME_MCQ_NOT_RENDERABLE",
            level:
              "error",
            message:
              "لا توجد خيارات قابلة للعرض في نشاط الاختيار.",
          });
        }

        if (!correctSpec) {
          issues.push({
            code:
              "RUNTIME_MCQ_NOT_GRADABLE",
            level:
              "error",
            message:
              "نشاط الاختيار لا يملك عقد إجابة قابلًا للتصحيح.",
          });
        }
      }


      if (
        type ===
        "matching"
      ) {
        const standardMatching =
          left.length > 0 &&
          right.length > 0;

        const ordering =
          words.length > 0 &&
          correctSpec?.mode ===
            "ordered";

        if (
          !standardMatching &&
          !ordering
        ) {
          issues.push({
            code:
              "RUNTIME_MATCHING_NOT_RENDERABLE",
            level:
              "error",
            message:
              "نشاط التوصيل/الترتيب لا يملك بنية قابلة للتفاعل.",
          });
        }

        if (!correctSpec) {
          issues.push({
            code:
              "RUNTIME_MATCHING_NOT_GRADABLE",
            level:
              "error",
            message:
              "نشاط التوصيل لا يملك إجابة قابلة للتصحيح.",
          });
        }
      }


      if (
        type ===
        "fill_blank"
      ) {
        const executable =
          fillItems.length >
            0 ||
          words.length >
            0;

        if (!executable) {
          issues.push({
            code:
              "RUNTIME_FILL_NOT_RENDERABLE",
            level:
              "error",
            message:
              "نشاط الفراغ لا يملك items أو words قابلة للعرض.",
          });
        }

        if (!correctSpec) {
          issues.push({
            code:
              "RUNTIME_FILL_NOT_GRADABLE",
            level:
              "error",
            message:
              "نشاط الفراغ لا يملك إجابة قابلة للتصحيح.",
          });
        }
      }


      if (
        type ===
          "reading" ||
        type ===
          "listening" ||
        type ===
          "speaking" ||
        type ===
          "writing"
      ) {
        /*
         * These may intentionally be completion-only.
         * No grading error is raised here.
         */
      }


      // ======================================================
      // Main activity image
      // ======================================================

      const mainImageUrl =
        text(
          content.image_url
        );

      if (mainImageUrl) {
        withMainImage++;

        const exists =
          await publicAssetExists(
            mainImageUrl
          );

        if (
          exists ===
          false
        ) {
          missingMainImageFile++;

          issues.push({
            code:
              "RUNTIME_MAIN_IMAGE_MISSING",
            level:
              "error",
            message:
              `ملف الصورة غير موجود: ${mainImageUrl}`,
          });
        }
      }


      // ======================================================
      // Image-option assets
      // ======================================================

      const optionUrls =
        imageOptionUrls(
          content
        );

      if (
        optionUrls.length >
        0
      ) {
        withImageOptions++;

        for (
          const url
          of optionUrls
        ) {
          const exists =
            await publicAssetExists(
              url
            );

          if (
            exists ===
            false
          ) {
            missingImageOptionFiles++;

            issues.push({
              code:
                "RUNTIME_IMAGE_OPTION_MISSING",
              level:
                "error",
              message:
                `ملف خيار الصورة غير موجود: ${url}`,
            });
          }
        }
      }


      // ======================================================
      // Grading answer contract sanity
      // ======================================================

      if (
        correctSpec &&
        correctSpec.values
          .length === 0
      ) {
        issues.push({
          code:
            "RUNTIME_EMPTY_CORRECT_SPEC",
          level:
            "error",
          message:
            "عقد الإجابة موجود لكنه فارغ.",
        });
      }

      const errors =
        issues.filter(
          issue =>
            issue.level ===
            "error"
        ).length;

      const warnings =
        issues.filter(
          issue =>
            issue.level ===
            "warning"
        ).length;

      if (
        errors === 0 &&
        warnings === 0
      ) {
        runtimeReady++;
      }

      runtimeErrors +=
        errors;

      runtimeWarnings +=
        warnings;

      results.push({
        id:
          activity.id,

        lessonId:
          activity.lesson_id,

        order:
          activity.activity_order,

        title:
          activity.title,

        type,

        published:
          activity.is_published ===
          true,

        points:
          activity.points ?? 0,

        gradingMode:
          correctSpec
            ?.mode ??
          "completion_only",

        answerCount:
          correctSpec
            ?.values
            .length ??
          0,

        mainImage:
          mainImageUrl ||
          null,

        imageOptionCount:
          optionUrls.length,

        runtimeReady:
          errors === 0 &&
          warnings === 0,

        issues,
      });
    }


    const problematic =
      results.filter(
        item =>
          !item.runtimeReady
      );


    const grouped:
      Record<
        string,
        number
      > = {};

    for (
      const item
      of problematic
    ) {
      for (
        const issue
        of item.issues
      ) {
        grouped[
          issue.code
        ] =
          (
            grouped[
              issue.code
            ] ??
            0
          ) + 1;
      }
    }


    return NextResponse.json({
      ok: true,

      summary: {
        totalActivities:
          activities.length,

        runtimeReady,

        needsAttention:
          problematic.length,

        runtimeErrors,

        runtimeWarnings,

        published,

        unpublished,

        gradable,

        completionOnly,

        withMainImage,

        missingMainImageFile,

        withImageOptions,

        missingImageOptionFiles,
      },

      grouped,

      problematic,
    });
  }
  catch (error) {
    console.error(
      "RUNTIME_AUDIT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "تعذر تشغيل فحص Runtime.",
      },
      {
        status: 500,
      }
    );
  }
}
