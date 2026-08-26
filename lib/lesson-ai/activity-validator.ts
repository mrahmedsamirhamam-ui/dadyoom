import { imageOptionsCoverLabels } from "@/lib/lesson-ai/image-options";

export type ActivityValidationInput = {
  title?: unknown;
  activity_type?: unknown;
  content?: unknown;
  answer?: unknown;
};

export type ActivityIssue = {
  code: string;
  level:
    | "error"
    | "warning";
  message: string;
};

export type ActivityValidationResult = {
  validForPublish: boolean;
  score: number;
  issues: ActivityIssue[];
};

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

function nonEmptyArray(
  value: unknown
): value is unknown[] {
  return (
    Array.isArray(value) &&
    value.length > 0
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

function looksLikeImageLabel(
  value: unknown
): boolean {
  const text =
    cleanText(value);

  return (
    text.startsWith(
      "صورة "
    ) ||
    text.startsWith(
      "الصورة "
    )
  );
}

export function validateActivity(
  activity:
    ActivityValidationInput
): ActivityValidationResult {
  const issues:
    ActivityIssue[] = [];

  const type =
    cleanText(
      activity.activity_type
    );

  const title =
    cleanText(
      activity.title
    );

  const content =
    isObject(
      activity.content
    )
      ? activity.content
      : {};

  const answer =
    isObject(
      activity.answer
    )
      ? activity.answer
      : {};

  if (!title) {
    issues.push({
      code:
        "MISSING_TITLE",
      level:
        "error",
      message:
        "عنوان النشاط غير موجود.",
    });
  }

  if (!type) {
    issues.push({
      code:
        "MISSING_TYPE",
      level:
        "error",
      message:
        "نوع النشاط غير موجود.",
    });
  }

  if (
    Object.keys(
      content
    ).length === 0
  ) {
    issues.push({
      code:
        "EMPTY_CONTENT",
      level:
        "error",
      message:
        "محتوى النشاط فارغ.",
    });
  }

  if (
    type ===
    "matching"
  ) {
    const left =
      content.left;

    const right =
      content.right;

    const pairs =
      answer.pairs;

const orderingWords =
  Array.isArray(
    content.words
  )
    ? content.words.filter(
        (
          value
        ): value is string =>
          typeof value ===
            "string" &&
          value.trim().length >
            0
      )
    : [];

const orderingAnswer =
  Array.isArray(
    answer.correct_words
  )
    ? answer.correct_words.filter(
        (
          value
        ): value is string =>
          typeof value ===
            "string" &&
          value.trim().length >
            0
      )
    : [];

const isOrdering =
  orderingWords.length > 0 &&
  orderingAnswer.length > 0 &&
  orderingWords.length ===
    orderingAnswer.length;

    if (
  !isOrdering &&
  (
    !nonEmptyArray(
      left
    ) ||
    !nonEmptyArray(
      right
    )
  )
) {
      issues.push({
        code:
          "MATCHING_OPTIONS_MISSING",
        level:
          "error",
        message:
          "نشاط التوصيل يحتاج قائمتي left وright.",
      });
    }

    if (
  !isOrdering &&
  !nonEmptyArray(
    pairs
  )
) {
      issues.push({
        code:
          "MATCHING_ANSWER_MISSING",
        level:
          "error",
        message:
          "إجابات pairs غير موجودة.",
      });
    }

    const matchingImageLabels =
      nonEmptyArray(
        right
      )
        ? right
            .filter(
              looksLikeImageLabel
            )
            .map(
              cleanText
            )
            .filter(Boolean)
        : [];

    const matchingImagesResolved =
      matchingImageLabels.length >
        0 &&
      imageOptionsCoverLabels(
        content,
        matchingImageLabels
      );

    if (
      matchingImageLabels.length >
        0 &&
      !matchingImagesResolved
    ) {
      issues.push({
        code:
          "IMAGE_PLACEHOLDER_ONLY",
        level:
          "warning",
        message:
          "خيارات المطابقة المصورة تحتاج إلى صور تغطي جميع العناصر.",
      });
    }
  }

  if (
    type ===
    "multiple_choice"
  ) {
    const options =
      content.options;

    const questions =
      content.questions;

    const items =
      content.items;

    const imageLabels =
      content.imageLabels;

    const hasOptions =
      nonEmptyArray(
        options
      );

    const hasQuestions =
      nonEmptyArray(
        questions
      );

    const hasItems =
      nonEmptyArray(
        items
      );

    const itemsHaveOptions =
      hasItems &&
      items.every(
        (item) =>
          isObject(item) &&
          nonEmptyArray(
            item.options
          )
      );

    const hasImages =
      nonEmptyArray(
        imageLabels
      );

    if (
      !hasOptions &&
      !hasQuestions &&
      !hasItems &&
      !hasImages
    ) {
      issues.push({
        code:
          "MCQ_STRUCTURE_MISSING",
        level:
          "error",
        message:
          "نشاط الاختيار لا يحتوي بنية خيارات قابلة للتنفيذ.",
      });
    }

    const mcqImageLabels =
      nonEmptyArray(
        imageLabels
      )
        ? imageLabels
            .map(
              cleanText
            )
            .filter(Boolean)
        : [];

    const mcqImagesResolved =
      mcqImageLabels.length >
        0 &&
      imageOptionsCoverLabels(
        content,
        mcqImageLabels
      );

    if (
      hasImages &&
      !mcqImagesResolved
    ) {
      issues.push({
        code:
          "IMAGE_OPTIONS_NEED_ASSETS",
        level:
          "warning",
        message:
          "خيارات السؤال المصورة تحتاج إلى صور تغطي جميع الخيارات.",
      });
    }

    if (
      hasItems &&
      !hasOptions &&
      !itemsHaveOptions
    ) {
      issues.push({
        code:
          "MCQ_ITEMS_NEED_NORMALIZATION",
        level:
          "warning",
        message:
          "عناصر النشاط تحتاج تحويل الخيارات النصية إلى options منظمة.",
      });
    }
  }

  if (
    type ===
    "fill_blank"
  ) {
    if (
      !nonEmptyArray(
        content.items
      )
    ) {
      issues.push({
        code:
          "FILL_ITEMS_MISSING",
        level:
          "error",
        message:
          "نشاط إكمال الفراغ يحتاج items.",
      });
    }

    if (
      !nonEmptyArray(
        answer.answers
      ) &&
      !nonEmptyArray(
        answer.correct_values
      )
    ) {
      issues.push({
        code:
          "FILL_ANSWERS_MISSING",
        level:
          "error",
        message:
          "إجابات نشاط الفراغ غير موجودة.",
      });
    }
  }

  if (
    type ===
      "reading" ||
    type ===
      "speaking" ||
    type ===
      "listening"
  ) {
    /*
     * هذه الأنشطة لا تشترط دائمًا
     * وجود answer.
     */
  }

  const errors =
    issues.filter(
      (issue) =>
        issue.level ===
        "error"
    ).length;

  const warnings =
    issues.filter(
      (issue) =>
        issue.level ===
        "warning"
    ).length;

  const score =
    Math.max(
      0,
      100 -
        errors * 40 -
        warnings * 15
    );

  return {
    validForPublish:
      errors === 0 &&
      warnings === 0,

    score,

    issues,
  };
}
