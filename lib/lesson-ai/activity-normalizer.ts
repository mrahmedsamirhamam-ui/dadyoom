type JsonObject =
  Record<string, unknown>;

export type NormalizableActivity = {
  title?: unknown;
  activity_type?: unknown;
  content?: unknown;
  answer?: unknown;
};

export type NormalizeResult = {
  changed: boolean;
  content: JsonObject;
  answer: JsonObject;
  notes: string[];
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

function cleanText(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function uniqueStrings(
  values: string[]
): string[] {
  return [
    ...new Set(
      values
        .map(
          (value) =>
            value.trim()
        )
        .filter(Boolean)
    ),
  ];
}

function splitOptionsFromSentence(
  value: unknown
): string[] {
  const text =
    cleanText(value);

  if (!text) {
    return [];
  }

  /*
   * 1)
   * [هَذَا، هَذِهِ]
   */
  const openIndex =
    text.indexOf("[");

  const closeIndex =
    openIndex >= 0
      ? text.indexOf(
          "]",
          openIndex + 1
        )
      : -1;

  if (
    openIndex >= 0 &&
    closeIndex > openIndex
  ) {
    const inside =
      text.slice(
        openIndex + 1,
        closeIndex
      );

    const options =
      uniqueStrings(
        inside.split(
          /[,،|؛;]/g
        )
      );

    if (
      options.length >= 2
    ) {
      return options;
    }
  }

  /*
   * 2)
   * بَهِيَّةُ - باسِمُ - كَبِيرٌ
   *
   * وندعم أيضًا:
   * –
   * —
   * ـ
   */
  const dashOptions =
    uniqueStrings(
      text.split(
        /\s*[-–—ـ]\s*/g
      )
    );

  if (
    dashOptions.length >= 2
  ) {
    return dashOptions;
  }

  return [];
}

function cleanSentenceToken(
  value: string
): string {
  return value
    .replace(
      /^[\s.,??:!??"'??()[\]{}]+/,
      ""
    )
    .replace(
      /[\s.,??:!??"'??()[\]{}]+$/,
      ""
    )
    .trim();
}

function sentenceOptions(
  value: unknown
): string[] {
  const text =
    cleanText(value);

  if (!text) {
    return [];
  }

  return uniqueStrings(
    text
      .split(/\s+/g)
      .map(
        cleanSentenceToken
      )
      .filter(Boolean)
  );
}

function normalizeMultipleChoice(
  content: JsonObject,
  answer: JsonObject
): NormalizeResult {
  const nextContent:
    JsonObject = {
      ...content,
    };

  const nextAnswer:
    JsonObject = {
      ...answer,
    };

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
      changed: false,

      content:
        nextContent,

      answer:
        nextAnswer,

      notes: [
        "النشاط لا يحتوي items يمكن تنظيمها.",
      ],
    };
  }

  let changed =
    false;

  let normalizedCount =
    0;

  let alreadyNormalizedCount =
    0;

  /*
   * ??? ??? ?????? #26:
   * answer.answers ???? ?????? ?????
   * ?? ?????????? ???????? ???:
   * ??? / ???
   */
  const answerValues =
    Array.isArray(
      answer.answers
    )
      ? answer.answers
          .filter(
            (value):
              value is string =>
              typeof value ===
              "string"
          )
      : [];

  const sharedAnswerOptions =
    uniqueStrings(
      answerValues
    );

  const canUseSharedAnswers =
    answerValues.length ===
      items.length &&
    sharedAnswerOptions.length >=
      2 &&
    sharedAnswerOptions.length <=
      4;

  /*
   * ??? ??? ?????? #19:
   * correct_words ???? ??????
   * ???? ??? ?????? ????? ???? ??????.
   */
  const correctWords =
    Array.isArray(
      answer.correct_words
    )
      ? answer.correct_words
          .filter(
            (value):
              value is string =>
              typeof value ===
              "string"
          )
      : [];

  const canUseSentenceWords =
    correctWords.length ===
    items.length;

  const normalizedItems =
    items.map(
      (
        rawItem,
        index
      ) => {
        if (
          !isObject(
            rawItem
          )
        ) {
          return rawItem;
        }

        const item:
          JsonObject = {
            ...rawItem,
          };

        const existingOptions =
          Array.isArray(
            item.options
          )
            ? item.options
                .filter(
                  (value):
                    value is string =>
                    typeof value ===
                    "string"
                )
            : [];

        if (
          existingOptions.length >=
          2
        ) {
          alreadyNormalizedCount +=
            1;

          return item;
        }

        /*
         * ?????:
         * ???????? ???????? ?????
         * ???? [ ] ?? ??????.
         */
        const extractedOptions =
          splitOptionsFromSentence(
            item.sentence
          );

        if (
          extractedOptions.length >=
          2
        ) {
          item.options =
            extractedOptions;

          changed =
            true;

          normalizedCount +=
            1;

          return item;
        }

        /*
         * ??????:
         * ??? / ??? ?? ?? ??????
         * ?????? ?????? ?????.
         */
        if (
          canUseSharedAnswers
        ) {
          item.options =
            sharedAnswerOptions;

          changed =
            true;

          normalizedCount +=
            1;

          return item;
        }

        /*
         * ??????:
         * ???? ????? ?? ??????
         * ???????? ???? ??????.
         */
        if (
          canUseSentenceWords
        ) {
          const options =
            sentenceOptions(
              item.sentence
            );

          const correctWord =
            correctWords[
              index
            ] ?? "";

          const hasCorrectWord =
            options.includes(
              correctWord
            );

          if (
            options.length >=
              2 &&
            hasCorrectWord
          ) {
            item.options =
              options;

            item.correctWord =
              correctWord;

            changed =
              true;

            normalizedCount +=
              1;

            return item;
          }
        }

        return item;
      }
    );

  if (changed) {
    nextContent.items =
      normalizedItems;

    return {
      changed: true,

      content:
        nextContent,

      answer:
        nextAnswer,

      notes: [
        `تم تنظيم ${normalizedCount} عنصر/عناصر من بيانات النشاط الأصلية.`,
        alreadyNormalizedCount >
        0
          ? `${alreadyNormalizedCount} عنصر/عناصر كانت منظمة مسبقًا.`
          : "",
      ].filter(Boolean),
    };
  }

  if (
    alreadyNormalizedCount ===
    items.length
  ) {
    return {
      changed: false,

      content:
        nextContent,

      answer:
        nextAnswer,

      notes: [
        "هذا النشاط منظم بالفعل ولا يحتاج تصحيحًا تلقائيًا.",
      ],
    };
  }

  return {
    changed: false,

    content:
      nextContent,

    answer:
      nextAnswer,

    notes: [
      "لم أستطع إعادة بناء خيارات آمنة من بيانات النشاط الحالية.",
    ],
  };
}


function normalizeFillBlank(
  content: JsonObject,
  answer: JsonObject
): NormalizeResult {
  const nextContent: JsonObject = {
    ...content,
  };

  const nextAnswer: JsonObject = {
    ...answer,
  };

  const stringArray = (
    value: unknown
  ): string[] =>
    Array.isArray(value)
      ? value
          .filter(
            (item):
              item is string =>
              typeof item === "string"
          )
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean)
      : [];

  const existingItems =
    Array.isArray(
      content.items
    )
      ? content.items
      : [];

  const answers =
    stringArray(
      answer.answers
    );

  const correctValues =
    stringArray(
      answer.correct_values
    );

  const correctWords =
    stringArray(
      answer.correct_words
    );

  const singleCorrect =
    cleanText(
      answer.correct
    );

  const explicitOptions =
    uniqueStrings(
      stringArray(
        content.options
      )
    );

  /*
   * ----------------------------------------------------------
   * A) Existing items:
   * normalize legacy answer aliases only.
   * ----------------------------------------------------------
   */
  if (
    existingItems.length > 0
  ) {
    if (
      answers.length > 0
    ) {
      return {
        changed: false,

        content:
          nextContent,

        answer:
          nextAnswer,

        notes: [
          "بنية fill_blank منظمة بالفعل.",
        ],
      };
    }

    if (
      correctValues.length ===
      existingItems.length
    ) {
      nextAnswer.answers =
        correctValues;

      return {
        changed: true,

        content:
          nextContent,

        answer:
          nextAnswer,

        notes: [
          "تم تحويل correct_values إلى answers.",
        ],
      };
    }

    if (
      correctWords.length ===
      existingItems.length
    ) {
      nextAnswer.answers =
        correctWords;

      return {
        changed: true,

        content:
          nextContent,

        answer:
          nextAnswer,

        notes: [
          "تم تحويل correct_words إلى answers.",
        ],
      };
    }

    if (
      existingItems.length === 1 &&
      singleCorrect
    ) {
      nextAnswer.answers = [
        singleCorrect,
      ];

      return {
        changed: true,

        content:
          nextContent,

        answer:
          nextAnswer,

        notes: [
          "تم تحويل correct إلى answers.",
        ],
      };
    }

    return {
      changed: false,

      content:
        nextContent,

      answer:
        nextAnswer,

      notes: [
        "توجد items ولكن لا توجد إجابة أصلية مؤكدة يمكن تحويلها.",
      ],
    };
  }

  /*
   * ----------------------------------------------------------
   * B) questions + answers
   * ----------------------------------------------------------
   */
  const questions =
    stringArray(
      content.questions
    );

  if (
    questions.length > 0 &&
    answers.length ===
      questions.length
  ) {
    const sharedAnswers =
      uniqueStrings(
        answers
      );

    const fallbackOptions =
      explicitOptions.length >= 2
        ? explicitOptions
        : (
            sharedAnswers.length >= 2 &&
            sharedAnswers.length <= 8
          )
          ? sharedAnswers
          : [];

    const items =
      questions.map(
        (
          question,
          index
        ) => {
          const extracted =
            splitOptionsFromSentence(
              question
            );

          const options =
            extracted.length >= 2
              ? extracted
              : fallbackOptions;

          const correct =
            answers[
              index
            ] ?? "";

          if (
            options.length < 2 ||
            !options.includes(
              correct
            )
          ) {
            return null;
          }

          return {
            sentence:
              question,

            options,
          };
        }
      );

    if (
      items.every(
        (
          item
        ): item is {
          sentence: string;
          options: string[];
        } =>
          item !== null
      )
    ) {
      nextContent.items =
        items;

      return {
        changed: true,

        content:
          nextContent,

        answer:
          nextAnswer,

        notes: [
          `تم تحويل ${items.length} سؤال/أسئلة من questions إلى items.`,
        ],
      };
    }
  }

  /*
   * ----------------------------------------------------------
   * C) text + answer
   *
   * Supports:
   * - answer.correct
   * - one answer.answers value
   * - one answer.correct_values value
   *
   * Only when genuine options already exist.
   * ----------------------------------------------------------
   */
  const text =
    cleanText(
      content.text
    );

  const singleAnswer =
    singleCorrect ||
    (
      answers.length === 1
        ? answers[0]
        : ""
    ) ||
    (
      correctValues.length === 1
        ? correctValues[0]
        : ""
    );

  if (
    text &&
    singleAnswer &&
    explicitOptions.length >= 2 &&
    explicitOptions.includes(
      singleAnswer
    )
  ) {
    nextContent.items = [
      {
        sentence:
          text,

        options:
          explicitOptions,
      },
    ];

    nextAnswer.answers = [
      singleAnswer,
    ];

    return {
      changed: true,

      content:
        nextContent,

      answer:
        nextAnswer,

      notes: [
        "تم تحويل text + إجابة مؤكدة + options إلى fill_blank تفاعلي.",
      ],
    };
  }

  /*
   * ----------------------------------------------------------
   * D) Multiple text lines + multiple answers.
   *
   * We only use real line breaks already present in the source.
   * No artificial sentence guessing.
   * ----------------------------------------------------------
   */
  if (
    text &&
    answers.length > 1 &&
    explicitOptions.length >= 2
  ) {
    const textLines =
      text
        .split(
          /\r?\n+/g
        )
        .map(
          (line) =>
            line.trim()
        )
        .filter(Boolean);

    const allAnswersAvailable =
      answers.every(
        (value) =>
          explicitOptions.includes(
            value
          )
      );

    if (
      textLines.length ===
        answers.length &&
      allAnswersAvailable
    ) {
      nextContent.items =
        textLines.map(
          (sentence) => ({
            sentence,

            options:
              explicitOptions,
          })
        );

      return {
        changed: true,

        content:
          nextContent,

        answer:
          nextAnswer,

        notes: [
          `تم تحويل ${textLines.length} أسطر نصية إلى items دون اختراع محتوى جديد.`,
        ],
      };
    }
  }

  /*
   * ----------------------------------------------------------
   * E) correct_words is deliberately NOT converted when
   * there are no items.
   *
   * Many such records are ordering / analysis exercises,
   * so turning every word into a fill item would change
   * the educational meaning.
   * ----------------------------------------------------------
   */

  return {
    changed: false,

    content:
      nextContent,

    answer:
      nextAnswer,

    notes: [
      "لا توجد بنية آمنة كافية لتحويل هذا fill_blank تلقائيًا دون تغيير معنى النشاط.",
    ],
  };
}

function normalizeMatching(
  content: JsonObject,
  answer: JsonObject
): NormalizeResult {
  const left =
    Array.isArray(
      content.left
    )
      ? content.left
      : [];

  const right =
    Array.isArray(
      content.right
    )
      ? content.right
      : [];

  const pairs =
    Array.isArray(
      answer.pairs
    )
      ? answer.pairs
      : [];

  if (
    left.length > 0 &&
    right.length > 0 &&
    pairs.length > 0
  ) {
    return {
      changed: false,

      content: {
        ...content,
      },

      answer: {
        ...answer,
      },

      notes: [
        "نشاط التوصيل منظم بالفعل ولا يحتاج تصحيحًا.",
      ],
    };
  }

  return {
    changed: false,

    content: {
      ...content,
    },

    answer: {
      ...answer,
    },

    notes: [
      "نشاط التوصيل يحتاج بيانات إضافية ولا يمكن إصلاحها آليًا بأمان.",
    ],
  };
}

function normalizeReading(
  content: JsonObject,
  answer: JsonObject
): NormalizeResult {
  return {
    changed: false,

    content: {
      ...content,
    },

    answer: {
      ...answer,
    },

    notes: [
      "نشاط القراءة لا يحتاج إجابة أو تصحيحًا تلقائيًا إذا كان المحتوى موجودًا.",
    ],
  };
}

export function normalizeActivity(
  activity:
    NormalizableActivity
): NormalizeResult {
  const type =
    cleanText(
      activity.activity_type
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

  switch (type) {
    case "multiple_choice":
      return normalizeMultipleChoice(
        content,
        answer
      );

    case "fill_blank":
      return normalizeFillBlank(
        content,
        answer
      );

    case "matching":
      return normalizeMatching(
        content,
        answer
      );

    case "reading":
      return normalizeReading(
        content,
        answer
      );

    default:
      return {
        changed: false,

        content: {
          ...content,
        },

        answer: {
          ...answer,
        },

        notes: [
          `لا يوجد تصحيح تلقائي مطلوب أو آمن حاليًا للنوع: ${type}`,
        ],
      };
  }
}
