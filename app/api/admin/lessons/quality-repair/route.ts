import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  normalizeActivity,
} from "@/lib/lesson-ai/activity-normalizer";

import {
  validateActivity,
} from "@/lib/lesson-ai/activity-validator";


type RepairBody = {
  apply?: unknown;
};

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
  is_published: boolean | null;
};

type RepairResult = {
  changed: boolean;
  content: JsonObject;
  answer: JsonObject;
  notes: string[];
};


function objectValue(
  value: unknown
): JsonObject {
  return (
    value &&
    typeof value === "object" &&
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
            typeof item === "string"
        )
        .map(
          item =>
            item.trim()
        )
        .filter(Boolean)
    : [];
}


function unique(
  values: string[]
): string[] {
  return [
    ...new Set(values),
  ];
}


function sameJson(
  a: unknown,
  b: unknown
) {
  return (
    JSON.stringify(a) ===
    JSON.stringify(b)
  );
}


function errorsCount(
  issues: Array<{
    level: string;
  }>
) {
  return issues.filter(
    issue =>
      issue.level === "error"
  ).length;
}


function warningsCount(
  issues: Array<{
    level: string;
  }>
) {
  return issues.filter(
    issue =>
      issue.level === "warning"
  ).length;
}


function inlineOptions(
  value: unknown
): string[] {
  if (
    typeof value !== "string"
  ) {
    return [];
  }

  const text =
    value.trim();

  if (!text) {
    return [];
  }

  /*
   * (أ / ب)
   */
  const parenthesized =
    text.match(
      /\(([^()]*)\)/
    );

  if (
    parenthesized?.[1]
  ) {
    const values =
      unique(
        parenthesized[1]
          .split(
            /\s*\/\s*|\s*[|]\s*/
          )
          .map(x => x.trim())
          .filter(Boolean)
      );

    if (
      values.length >= 2
    ) {
      return values;
    }
  }

  /*
   * أ / ب / ج
   */
  if (
    text.includes("/")
  ) {
    const values =
      unique(
        text
          .split(/\s*\/\s*/)
          .map(x => x.trim())
          .filter(Boolean)
      );

    if (
      values.length >= 2
    ) {
      return values;
    }
  }

  /*
   * أ، ب، ج
   */
  const comma =
    unique(
      text
        .split(/\s*[،,]\s*/)
        .map(x => x.trim())
        .filter(Boolean)
    );

  if (
    comma.length >= 2 &&
    comma.length <= 10
  ) {
    return comma;
  }

  return [];
}


function sentenceTokens(
  value: unknown
): string[] {
  if (
    typeof value !== "string"
  ) {
    return [];
  }

  return unique(
    value
      .replace(
        /[.,،؛:!?؟()"«»[\]{}]/g,
        " "
      )
      .split(/\s+/)
      .map(x => x.trim())
      .filter(Boolean)
  );
}


function blankCount(
  value: string
) {
  return (
    value.match(
      /(?:\.{3,}|_{2,}|…+|ـ{3,})/g
    )?.length ?? 0
  );
}


function safeLegacyRepair(
  activity: ActivityRow
): RepairResult {
  const type =
    String(
      activity.activity_type ?? ""
    );

  const title =
    String(
      activity.title ?? ""
    );

  const content =
    objectValue(
      activity.content
    );

  const answer =
    objectValue(
      activity.answer
    );

  const nextContent: JsonObject = {
    ...content,
  };

  const nextAnswer: JsonObject = {
    ...answer,
  };


  /*
   * ========================================================
   * MATCHING
   * ========================================================
   */
  if (
    type === "matching"
  ) {
    const pairs =
      Array.isArray(
        answer.pairs
      )
        ? answer.pairs
        : [];

    const normalizedPairs =
      pairs
        .map(
          pair => {
            const row =
              objectValue(pair);

            const left =
              typeof row.left === "string"
                ? row.left.trim()
                : "";

            const right =
              typeof row.right === "string"
                ? row.right.trim()
                : "";

            return (
              left &&
              right
            )
              ? {
                  left,
                  right,
                }
              : null;
          }
        )
        .filter(
          (
            pair
          ): pair is {
            left: string;
            right: string;
          } =>
            pair !== null
        );

    if (
      normalizedPairs.length > 0
    ) {
      const oldLeft =
        strings(
          content.left
        );

      const oldRight =
        strings(
          content.right
        );

      let changed =
        false;

      if (
        oldLeft.length === 0
      ) {
        nextContent.left =
          unique(
            normalizedPairs.map(
              pair =>
                pair.left
            )
          );

        changed =
          true;
      }

      if (
        oldRight.length === 0
      ) {
        nextContent.right =
          unique(
            normalizedPairs.map(
              pair =>
                pair.right
            )
          );

        changed =
          true;
      }

      if (changed) {
        return {
          changed: true,
          content:
            nextContent,
          answer:
            nextAnswer,
          notes: [
            "استعادة left/right من answer.pairs.",
          ],
        };
      }
    }

    return {
      changed: false,
      content:
        nextContent,
      answer:
        nextAnswer,
      notes: [],
    };
  }


  /*
   * ========================================================
   * MULTIPLE CHOICE
   * ========================================================
   */
  if (
    type === "multiple_choice"
  ) {
    const items =
      Array.isArray(
        content.items
      )
        ? content.items
        : [];

    const answers =
      strings(
        answer.answers
      );

    const correctValues =
      strings(
        answer.correct_values
      );

    const singleCorrect =
      typeof answer.correct ===
        "string"
        ? answer.correct.trim()
        : "";

    const words =
      strings(
        content.words
      );


    /*
     * Existing items with one known correct
     * value for each item.
     */
    if (
      items.length > 0
    ) {
      const expected =
        correctValues.length ===
          items.length
          ? correctValues
          : answers.length ===
              items.length
            ? answers
            : [];

      if (
        expected.length ===
        items.length
      ) {
        const fixed =
          items.map(
            (
              rawItem,
              index
            ) => {
              const item =
                objectValue(
                  rawItem
                );

              const existing =
                strings(
                  item.options
                );

              if (
                existing.length >= 2
              ) {
                return item;
              }

              const sentence =
                typeof item.sentence ===
                  "string"
                  ? item.sentence.trim()
                  : "";

              const correct =
                expected[
                  index
                ] ?? "";

              /*
               * First preference:
               * explicit source alternatives.
               */
              const inline =
                inlineOptions(
                  sentence
                );

              if (
                inline.length >= 2 &&
                inline.includes(
                  correct
                )
              ) {
                return {
                  ...item,
                  options:
                    inline,
                };
              }

              /*
               * Second:
               * correct word occurs literally
               * inside the original sentence.
               */
              const tokens =
                sentenceTokens(
                  sentence
                );

              if (
                tokens.length >= 2 &&
                tokens.includes(
                  correct
                )
              ) {
                return {
                  ...item,
                  options:
                    tokens,
                };
              }

              return null;
            }
          );

        if (
          fixed.every(
            (
              item
            ): item is JsonObject =>
              item !== null
          )
        ) {
          nextContent.items =
            fixed;

          return {
            changed: true,
            content:
              nextContent,
            answer:
              nextAnswer,
            notes: [
              `تطبيع ${fixed.length} عناصر MCQ من بيانات السؤال الأصلية.`,
            ],
          };
        }
      }


      /*
       * The item sentences themselves are the
       * alternatives, with one known correct.
       */
      if (
        singleCorrect &&
        items.length >= 2
      ) {
        const sentences =
          items
            .map(
              rawItem => {
                const item =
                  objectValue(
                    rawItem
                  );

                return typeof item.sentence ===
                  "string"
                  ? item.sentence.trim()
                  : "";
              }
            )
            .filter(Boolean);

        if (
          sentences.length ===
            items.length &&
          sentences.includes(
            singleCorrect
          )
        ) {
          nextContent.options =
            unique(
              sentences
            );

          delete nextContent.items;

          return {
            changed: true,
            content:
              nextContent,
            answer:
              nextAnswer,
            notes: [
              "تحويل الجمل الأصلية إلى خيارات MCQ.",
            ],
          };
        }
      }
    }


    /*
     * words are already the alternatives.
     */
    if (
      words.length >= 2
    ) {
      if (
        singleCorrect &&
        words.includes(
          singleCorrect
        )
      ) {
        nextContent.options =
          unique(words);

        return {
          changed: true,
          content:
            nextContent,
          answer:
            nextAnswer,
          notes: [
            "تحويل words إلى options.",
          ],
        };
      }

      if (
        correctValues.length > 0 &&
        correctValues.every(
          value =>
            words.includes(
              value
            )
        )
      ) {
        nextContent.options =
          unique(words);

        return {
          changed: true,
          content:
            nextContent,
          answer:
            nextAnswer,
          notes: [
            "تحويل words إلى options باستخدام correct_values الأصلية.",
          ],
        };
      }
    }

    return {
      changed: false,
      content:
        nextContent,
      answer:
        nextAnswer,
      notes: [],
    };
  }


  /*
   * ========================================================
   * FILL BLANK
   * ========================================================
   */
  if (
    type === "fill_blank"
  ) {
    const existingItems =
      Array.isArray(
        content.items
      )
        ? content.items
        : [];

    const answers =
      strings(
        answer.answers
      );

    const correctValues =
      strings(
        answer.correct_values
      );

    const correctWords =
      strings(
        answer.correct_words
      );

    const singleCorrect =
      typeof answer.correct ===
        "string"
        ? answer.correct.trim()
        : "";

    const words =
      strings(
        content.words
      );

    const questions =
      strings(
        content.questions
      );

    const explicitOptions =
      unique(
        strings(
          content.options
        )
      );

    const text =
      typeof content.text ===
        "string"
        ? content.text.trim()
        : "";


    /*
     * Existing items: normalize answer aliases.
     */
    if (
      existingItems.length > 0 &&
      answers.length === 0
    ) {
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
            "correct_values → answers.",
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
            "correct_words → answers.",
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
            "correct → answers.",
          ],
        };
      }
    }


    /*
     * questions + answers.
     */
    if (
      questions.length > 0 &&
      answers.length ===
        questions.length
    ) {
      const shared =
        explicitOptions.length > 0
          ? explicitOptions
          : unique(
              answers
            );

      if (
        shared.length > 0 &&
        answers.every(
          value =>
            shared.includes(
              value
            )
        )
      ) {
        nextContent.items =
          questions.map(
            question => ({
              sentence:
                question,
              options:
                shared,
            })
          );

        return {
          changed: true,
          content:
            nextContent,
          answer:
            nextAnswer,
          notes: [
            `${questions.length} questions → items.`,
          ],
        };
      }
    }


    /*
     * Single text + known correct.
     */
    if (
      text &&
      singleCorrect
    ) {
      const sourceOptions =
        explicitOptions.length > 0
          ? explicitOptions
          : [
              singleCorrect,
            ];

      if (
        sourceOptions.includes(
          singleCorrect
        )
      ) {
        nextContent.items = [
          {
            sentence:
              text,
            options:
              sourceOptions,
          },
        ];

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
            "text + correct → fill item.",
          ],
        };
      }
    }


    /*
     * Multiple blanks in one original text.
     */
    const blanks =
      blankCount(
        text
      );

    if (
      text &&
      blanks > 0 &&
      answers.length ===
        blanks
    ) {
      const sourceOptions =
        explicitOptions.length > 0
          ? explicitOptions
          : unique(
              answers
            );

      if (
        sourceOptions.length > 0 &&
        answers.every(
          value =>
            sourceOptions.includes(
              value
            )
        )
      ) {
        nextContent.items =
          answers.map(
            (
              _,
              index
            ) => ({
              sentence:
                `الفراغ ${
                  index + 1
                }: ${text}`,
              options:
                sourceOptions,
            })
          );

        return {
          changed: true,
          content:
            nextContent,
          answer:
            nextAnswer,
          notes: [
            `${blanks} فراغات → items.`,
          ],
        };
      }
    }


    /*
     * One answer per source word.
     */
    const wordAnswers =
      answers.length ===
        words.length
        ? answers
        : correctValues.length ===
            words.length
          ? correctValues
          : [];

    if (
      words.length > 0 &&
      wordAnswers.length ===
        words.length
    ) {
      const shared =
        unique(
          wordAnswers
        );

      nextContent.items =
        words.map(
          word => ({
            sentence:
              word,
            options:
              shared,
          })
        );

      nextAnswer.answers =
        wordAnswers;

      return {
        changed: true,
        content:
          nextContent,
        answer:
          nextAnswer,
        notes: [
          `${words.length} كلمات → fill items.`,
        ],
      };
    }


    /*
     * Word analysis:
     *
     * Example:
     * 3 source words, 9 segment answers.
     * Build 9 fill items without inventing
     * any educational answer.
     */
    if (
      /أحلل|أُحَل|أُحَلِّل|أُحَلِّل/.test(
        title
      ) &&
      words.length > 0 &&
      answers.length >
        words.length &&
      answers.length %
        words.length ===
        0
    ) {
      const partsPerWord =
        answers.length /
        words.length;

      const shared =
        unique(
          answers
        );

      const generated:
        Array<{
          sentence: string;
          options: string[];
        }> = [];

      for (
        let wordIndex = 0;
        wordIndex < words.length;
        wordIndex++
      ) {
        for (
          let part = 0;
          part < partsPerWord;
          part++
        ) {
          generated.push({
            sentence:
              `${words[wordIndex]} — المقطع ${
                part + 1
              }`,
            options:
              shared,
          });
        }
      }

      nextContent.items =
        generated;

      return {
        changed: true,
        content:
          nextContent,
        answer:
          nextAnswer,
        notes: [
          `تحويل تحليل الكلمات إلى ${generated.length} عناصر من الإجابات الأصلية.`,
        ],
      };
    }

    return {
      changed: false,
      content:
        nextContent,
      answer:
        nextAnswer,
      notes: [],
    };
  }


  return {
    changed: false,
    content:
      nextContent,
    answer:
      nextAnswer,
    notes: [],
  };
}


/*
 * Run several deterministic passes.
 * normalizeActivity may fix one layer and
 * safeLegacyRepair may fix the next.
 */
function buildCandidate(
  activity: ActivityRow
): RepairResult {
  let content =
    objectValue(
      activity.content
    );

  let answer =
    objectValue(
      activity.answer
    );

  const notes:
    string[] = [];

  let changedEver =
    false;

  for (
    let pass = 0;
    pass < 5;
    pass++
  ) {
    let changedThisPass =
      false;

    const normalized =
      normalizeActivity({
        ...activity,
        content,
        answer,
      });

    if (
      normalized.changed &&
      (
        !sameJson(
          normalized.content,
          content
        ) ||
        !sameJson(
          normalized.answer,
          answer
        )
      )
    ) {
      content =
        normalized.content;

      answer =
        normalized.answer;

      notes.push(
        ...normalized.notes
      );

      changedEver =
        true;

      changedThisPass =
        true;
    }

    const legacy =
      safeLegacyRepair({
        ...activity,
        content,
        answer,
      });

    if (
      legacy.changed &&
      (
        !sameJson(
          legacy.content,
          content
        ) ||
        !sameJson(
          legacy.answer,
          answer
        )
      )
    ) {
      content =
        legacy.content;

      answer =
        legacy.answer;

      notes.push(
        ...legacy.notes
      );

      changedEver =
        true;

      changedThisPass =
        true;
    }

    if (
      !changedThisPass
    ) {
      break;
    }
  }

  return {
    changed:
      changedEver,
    content,
    answer,
    notes:
      unique(
        notes.filter(Boolean)
      ),
  };
}


export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as
        RepairBody;

    const apply =
      body.apply === true;

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

    const activities: ActivityRow[] =
      data ?? [];

    let examined =
      0;

    let alreadyClean =
      0;

    let publishedSkipped =
      0;

    let noSafeRepair =
      0;

    let repairable =
      0;

    let improved =
      0;

    let updated =
      0;

    let rejectedRepair =
      0;

    const results = [];

    for (
      const activity
      of activities
    ) {
      examined++;

      const before =
        validateActivity({
          title:
            activity.title,
          activity_type:
            activity.activity_type,
          content:
            activity.content,
          answer:
            activity.answer,
        });

      if (
        before.issues.length === 0
      ) {
        alreadyClean++;
        continue;
      }

      /*
       * Published content is never
       * changed automatically.
       */
      if (
        activity.is_published ===
        true
      ) {
        publishedSkipped++;

        results.push({
          id:
            activity.id,
          lessonId:
            activity.lesson_id,
          order:
            activity.activity_order,
          title:
            activity.title,
          type:
            activity.activity_type,
          action:
            "published_skipped",
          beforeScore:
            before.score,
          afterScore:
            before.score,
          beforeIssues:
            before.issues,
          afterIssues:
            before.issues,
          notes: [
            "نشاط منشور؛ لم يتم تعديله تلقائيًا.",
          ],
          preview:
            apply
              ? undefined
              : {
                  content:
                    activity.content,
                  answer:
                    activity.answer,
                },
        });

        continue;
      }

      const candidate =
        buildCandidate(
          activity
        );

      if (
        !candidate.changed
      ) {
        noSafeRepair++;

        results.push({
          id:
            activity.id,
          lessonId:
            activity.lesson_id,
          order:
            activity.activity_order,
          title:
            activity.title,
          type:
            activity.activity_type,
          action:
            "no_safe_repair",
          beforeScore:
            before.score,
          afterScore:
            before.score,
          beforeIssues:
            before.issues,
          afterIssues:
            before.issues,
          notes:
            candidate.notes,
          preview:
            apply
              ? undefined
              : {
                  content:
                    activity.content,
                  answer:
                    activity.answer,
                },
        });

        continue;
      }

      repairable++;

      const after =
        validateActivity({
          title:
            activity.title,
          activity_type:
            activity.activity_type,
          content:
            candidate.content,
          answer:
            candidate.answer,
        });

      const beforeErrors =
        errorsCount(
          before.issues
        );

      const afterErrors =
        errorsCount(
          after.issues
        );

      const beforeWarnings =
        warningsCount(
          before.issues
        );

      const afterWarnings =
        warningsCount(
          after.issues
        );

      /*
       * Hard safety gate.
       */
      const safe =
        after.score >
          before.score &&
        afterErrors <=
          beforeErrors &&
        afterWarnings <=
          beforeWarnings;

      if (!safe) {
        rejectedRepair++;

        results.push({
          id:
            activity.id,
          lessonId:
            activity.lesson_id,
          order:
            activity.activity_order,
          title:
            activity.title,
          type:
            activity.activity_type,
          action:
            "repair_rejected",
          beforeScore:
            before.score,
          afterScore:
            after.score,
          beforeIssues:
            before.issues,
          afterIssues:
            after.issues,
          notes:
            candidate.notes,
          preview:
            apply
              ? undefined
              : {
                  content:
                    candidate.content,
                  answer:
                    candidate.answer,
                },
        });

        continue;
      }

      improved++;

      if (apply) {
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
                candidate.content,
              answer:
                candidate.answer,
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

        if (updateError) {
          throw updateError;
        }

        updated++;
      }

      results.push({
        id:
          activity.id,
        lessonId:
          activity.lesson_id,
        order:
          activity.activity_order,
        title:
          activity.title,
        type:
          activity.activity_type,
        action:
          apply
            ? "updated"
            : "would_update",
        beforeScore:
          before.score,
        afterScore:
          after.score,
        beforeIssues:
          before.issues,
        afterIssues:
          after.issues,
        notes:
          candidate.notes,
      });
    }

    return NextResponse.json({
      ok: true,
      mode:
        apply
          ? "apply"
          : "preview",
      summary: {
        examined,
        alreadyClean,
        publishedSkipped,
        noSafeRepair,
        repairable,
        improved,
        rejectedRepair,
        updated,
      },
      results,
    });
  }
  catch (error) {
    console.error(
      "QUALITY_REPAIR_ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "تعذر تنفيذ الإصلاح النهائي.",
      },
      {
        status: 500,
      }
    );
  }
}
