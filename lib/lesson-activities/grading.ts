export type CorrectAnswerMode =
  | "unordered"
  | "ordered"
  | "matching"
  | "single_letter";

export type CorrectAnswerSpec = {
  mode: CorrectAnswerMode;
  values: string[];
};

type JsonRecord =
  Record<string, unknown>;

function isObject(
  value: unknown
): value is JsonRecord {
  return Boolean(
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  );
}

function stringArray(
  value: unknown
): string[] {
  return Array.isArray(value)
    ? value
        .filter(
          (item):
            item is string =>
            typeof item ===
            "string"
        )
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean)
    : [];
}

function normalizePair(
  value: unknown
): string | null {
  /*
   * Legacy format:
   * ["left", "right"]
   */
  if (
    Array.isArray(value)
  ) {
    const left =
      typeof value[0] ===
        "string"
        ? value[0].trim()
        : "";

    const right =
      typeof value[1] ===
        "string"
        ? value[1].trim()
        : "";

    return (
      left &&
      right
    )
      ? `${left}|||${right}`
      : null;
  }

  /*
   * Current AI/activity format:
   * {
   *   left: "...",
   *   right: "..."
   * }
   */
  if (
    isObject(value)
  ) {
    const left =
      typeof value.left ===
        "string"
        ? value.left.trim()
        : "";

    const right =
      typeof value.right ===
        "string"
        ? value.right.trim()
        : "";

    return (
      left &&
      right
    )
      ? `${left}|||${right}`
      : null;
  }

  return null;
}

export function getCorrectAnswerSpec(
  value: unknown
): CorrectAnswerSpec | null {
  if (
    !isObject(value)
  ) {
    return null;
  }

  const answer =
    value;

  // ==========================================================
  // 1. SINGLE / LEGACY MULTIPLE CHOICE
  // ==========================================================

  if (
    typeof answer.correct ===
      "string" &&
    answer.correct.trim()
  ) {
    return {
      mode:
        "unordered",

      values: [
        answer.correct.trim(),
      ],
    };
  }

  const correctArray =
    stringArray(
      answer.correct
    );

  if (
    correctArray.length > 0
  ) {
    return {
      mode:
        "unordered",

      values:
        correctArray,
    };
  }

  // ==========================================================
  // 2. CANONICAL MULTI-SELECT
  // ==========================================================

  const correctValues =
    stringArray(
      answer.correct_values
    );

  if (
    correctValues.length > 0
  ) {
    return {
      mode:
        "unordered",

      values:
        correctValues,
    };
  }

  // ==========================================================
  // 3. FILL BLANK
  // ==========================================================

  const answers =
    stringArray(
      answer.answers
    );

  if (
    answers.length > 0
  ) {
    return {
      mode:
        "ordered",

      values:
        answers,
    };
  }

  // ==========================================================
  // 4. ORDERING
  // ==========================================================

  const correctWords =
    stringArray(
      answer.correct_words
    );

  if (
    correctWords.length > 0
  ) {
    return {
      mode:
        "ordered",

      values:
        correctWords,
    };
  }

  // ==========================================================
  // 5. SINGLE LETTER
  // ==========================================================

  if (
    typeof answer.correct_letter ===
      "string" &&
    answer.correct_letter.trim()
  ) {
    return {
      mode:
        "single_letter",

      values: [
        answer.correct_letter
          .trim(),
      ],
    };
  }

  // ==========================================================
  // 6. MATCHING
  //    Supports BOTH old arrays and current {left,right}.
  // ==========================================================

  if (
    Array.isArray(
      answer.pairs
    )
  ) {
    const pairs =
      answer.pairs
        .map(
          normalizePair
        )
        .filter(
          (
            pair
          ): pair is string =>
            Boolean(pair)
        );

    if (
      pairs.length > 0
    ) {
      return {
        mode:
          "matching",

        values:
          pairs,
      };
    }
  }

  return null;
}
