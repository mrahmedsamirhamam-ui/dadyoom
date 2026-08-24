type JsonObject =
  Record<string, unknown>;

export type ReviewStatus =
  | "READY"
  | "NEEDS_IMAGES"
  | "NEEDS_SOURCE_REBUILD"
  | "READING_OK"
  | "NEEDS_ANSWER_REVIEW"
  | "REVIEW";

export type ReviewStatusResult = {
  status: ReviewStatus;
  label: string;
  reason: string;
};

function isObject(
  value: unknown
): value is JsonObject {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function hasNonEmptyArray(
  value: unknown
): boolean {
  return (
    Array.isArray(value) &&
    value.length > 0
  );
}

export function getActivityReviewStatus(
  activity: {
    activity_type?: unknown;
    content?: unknown;
    answer?: unknown;
  }
): ReviewStatusResult {
  const type =
    typeof activity.activity_type === "string"
      ? activity.activity_type
      : "";

  const content =
    isObject(activity.content)
      ? activity.content
      : {};

  const answer =
    isObject(activity.answer)
      ? activity.answer
      : {};

  if (
    type === "reading"
  ) {
    return {
      status: "READING_OK",
      label: "نشاط قراءة سليم",
      reason:
        "نشاط القراءة لا يحتاج خيارات أو إجابة تصحيحية دائمًا.",
    };
  }

  if (
    type === "matching"
  ) {
    const left =
      hasNonEmptyArray(
        content.left
      );

    const right =
      hasNonEmptyArray(
        content.right
      );

    const pairs =
      hasNonEmptyArray(
        answer.pairs
      );

    const rightValues =
      Array.isArray(content.right)
        ? content.right
        : [];

    const hasImageDescriptions =
      rightValues.some(
        (value) =>
          typeof value === "string" &&
          value.trim().startsWith(
            "صورة"
          )
      );

    if (
      left &&
      right &&
      pairs &&
      hasImageDescriptions
    ) {
      return {
        status:
          "NEEDS_IMAGES",
        label:
          "يحتاج صورًا",
        reason:
          "بنية التوصيل مكتملة لكن الخيارات تعتمد على أوصاف صور نصية.",
      };
    }

    if (
      left &&
      right &&
      pairs
    ) {
      return {
        status:
          "READY",
        label:
          "جاهز",
        reason:
          "بنية التوصيل والإجابات مكتملة.",
      };
    }

    return {
      status:
        "NEEDS_SOURCE_REBUILD",
      label:
        "يحتاج إعادة بناء",
      reason:
        "بيانات التوصيل غير مكتملة.",
    };
  }

  if (
    type ===
    "multiple_choice"
  ) {
    if (
      hasNonEmptyArray(
        content.imageLabels
      )
    ) {
      return {
        status:
          "NEEDS_IMAGES",
        label:
          "يحتاج صورًا",
        reason:
          "النشاط يعتمد على صور ولم يتم ربط الصور الفعلية بعد.",
      };
    }

    const items =
      Array.isArray(
        content.items
      )
        ? content.items
        : [];

    if (
      items.length === 0
    ) {
      return {
        status:
          "NEEDS_SOURCE_REBUILD",
        label:
          "يحتاج إعادة بناء",
        reason:
          "لا توجد items قابلة للتنفيذ.",
      };
    }

    const allHaveOptions =
      items.every(
        (item) =>
          isObject(item) &&
          hasNonEmptyArray(
            item.options
          )
      );

    if (
      allHaveOptions
    ) {
      return {
        status:
          "READY",
        label:
          "جاهز",
        reason:
          "كل عناصر الاختيار تحتوي خيارات منظمة.",
      };
    }

    return {
      status:
        "NEEDS_SOURCE_REBUILD",
      label:
        "يحتاج إعادة بناء",
      reason:
        "بعض عناصر الاختيار لا تحتوي options ويمكن أن تكون بيانات المصدر ناقصة.",
    };
  }

  if (
    type ===
    "fill_blank"
  ) {
    const items =
      hasNonEmptyArray(
        content.items
      );

    const answers =
      hasNonEmptyArray(
        answer.answers
      ) ||
      hasNonEmptyArray(
        answer.correct_values
      );

    if (
      items &&
      answers
    ) {
      return {
        status:
          "NEEDS_ANSWER_REVIEW",
        label:
          "راجع الإجابات",
        reason:
          "البنية موجودة، ويجب التحقق من صحة الإجابات قبل النشر.",
      };
    }

    return {
      status:
        "NEEDS_SOURCE_REBUILD",
      label:
        "يحتاج إعادة بناء",
      reason:
        "نشاط الفراغ أو إجاباته غير مكتملة.",
    };
  }

  return {
    status:
      "REVIEW",
    label:
      "يحتاج مراجعة",
    reason:
      "لا توجد قاعدة نهائية لهذا النوع بعد.",
  };
}
