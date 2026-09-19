"use client";

import {
  useMemo,
  useRef,
  useState,
} from "react";

type TeachingSlideSource = {
  slide?: number;
  title?: string;
  body?: string;
};

type InstructionEntry = {
  kind?: string;
  items?: TeachingSlideSource[];
};

type QuestionOption = {
  id: string;
  text: string;
};

type QuestionSource = {
  id?: unknown;
  question?: unknown;
  options?: unknown;
  correct_answer?: unknown;
};

type TeachingSlide = {
  kind: "teach";
  key: string;
  title: string;
  body: string;
};

type QuizSlide = {
  kind: "quiz";
  key: string;
  title: string;
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
};

type DeckSlide =
  | TeachingSlide
  | QuizSlide;

type Props = {
  instructions: unknown;
  questions?: unknown;
};

function extractTeachingSlides(
  instructions: unknown
): TeachingSlideSource[] {
  if (!Array.isArray(instructions)) {
    return [];
  }

  const entry =
    instructions.find((item) => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return false;
      }

      return (
        (item as InstructionEntry).kind ===
        "slides"
      );
    }) as InstructionEntry | undefined;

  if (
    !entry ||
    !Array.isArray(entry.items)
  ) {
    return [];
  }

  return entry.items.filter(
    (item) =>
      Boolean(
        item &&
        typeof item === "object" &&
        (
          typeof item.title ===
            "string" ||
          typeof item.body ===
            "string"
        )
      )
  );
}

function normalizeOptions(
  value: unknown
): QuestionOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (
        typeof item === "string"
      ) {
        return {
          id: String(index),
          text: item,
        };
      }

      if (
        !item ||
        typeof item !== "object"
      ) {
        return null;
      }

      const record =
        item as Record<
          string,
          unknown
        >;

      const text =
        String(
          record.text ??
          record.label ??
          record.value ??
          ""
        ).trim();

      if (!text) {
        return null;
      }

      return {
        id: String(
          record.id ??
          index
        ),
        text,
      };
    })
    .filter(
      (
        item
      ): item is QuestionOption =>
        item !== null
    );
}

function normalizeQuestions(
  questions: unknown
): QuizSlide[] {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .map((item, index) => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return null;
      }

      const question =
        item as QuestionSource;

      const text =
        String(
          question.question ??
          ""
        ).trim();

      const options =
        normalizeOptions(
          question.options
        );

      const correctAnswer =
        String(
          question.correct_answer ??
          ""
        ).trim();

      if (
        !text ||
        options.length < 2
      ) {
        return null;
      }

      return {
        kind: "quiz" as const,
        key:
          "quiz-" +
          String(
            question.id ??
            index
          ),
        title: "سؤال سريع",
        question: text,
        options,
        correctAnswer,
      };
    })
    .filter(
      (
        item
      ): item is QuizSlide =>
        item !== null
    )
    .slice(0, 3);
}

function buildDeck(
  instructions: unknown,
  questions: unknown
): DeckSlide[] {
  const sourceSlides =
    extractTeachingSlides(
      instructions
    );

  const teachingSlides:
    TeachingSlide[] =
    sourceSlides.map(
      (slide, index) => ({
        kind: "teach",
        key:
          "teach-" +
          String(
            slide.slide ??
            index + 1
          ),
        title:
          slide.title?.trim() ||
          "نتعلم معًا",
        body:
          slide.body?.trim() ||
          "",
      })
    );

  const quizzes =
    normalizeQuestions(
      questions
    );

  if (
    teachingSlides.length === 0
  ) {
    return [];
  }

  if (
    quizzes.length === 0
  ) {
    return teachingSlides;
  }

  const positions = [
    Math.min(
      2,
      teachingSlides.length
    ),
    Math.min(
      Math.max(
        3,
        Math.ceil(
          teachingSlides.length /
          2
        )
      ),
      teachingSlides.length
    ),
    Math.max(
      1,
      teachingSlides.length - 1
    ),
  ];

  const result: DeckSlide[] =
    [];

  let quizIndex = 0;

  teachingSlides.forEach(
    (slide, index) => {
      result.push(slide);

      const afterSlide =
        index + 1;

      while (
        quizIndex <
          quizzes.length &&
        positions[quizIndex] ===
          afterSlide
      ) {
        result.push(
          quizzes[quizIndex]
        );

        quizIndex += 1;
      }
    }
  );

  while (
    quizIndex <
    quizzes.length
  ) {
    result.push(
      quizzes[quizIndex]
    );

    quizIndex += 1;
  }

  return result;
}

function teachingEmoji(
  index: number
) {
  const icons = [
    "📖",
    "🔊",
    "✍️",
    "⭐",
    "🧠",
    "🎯",
    "📚",
    "🏆",
  ];

  return icons[
    index %
    icons.length
  ];
}

export default function LessonLearningSlides({
  instructions,
  questions,
}: Props) {
  const deck =
    useMemo(
      () =>
        buildDeck(
          instructions,
          questions
        ),
      [
        instructions,
        questions,
      ]
    );

  const [
    current,
    setCurrent,
  ] =
    useState(0);

  const [
    answers,
    setAnswers,
  ] =
    useState<
      Record<string, string>
    >({});

  const [
    checked,
    setChecked,
  ] =
    useState<
      Record<string, boolean>
    >({});

  const touchStart =
    useRef<number | null>(
      null
    );

  if (
    deck.length === 0
  ) {
    return null;
  }

  const goPrevious = () => {
    setCurrent(
      (value) =>
        Math.max(
          0,
          value - 1
        )
    );
  };

  const goNext = () => {
    setCurrent(
      (value) =>
        Math.min(
          deck.length - 1,
          value + 1
        )
    );
  };

  const progress =
    Math.round(
      (
        (current + 1) /
        deck.length
      ) * 100
    );

  return (
    <section
      aria-labelledby="lesson-deck-title"
      className="overflow-hidden rounded-[2rem] border border-amber-200 bg-white shadow-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-100 bg-[#fffaf0] px-5 py-4 sm:px-7">
        <div>
          <p className="text-sm font-black text-amber-700">
            الدرس التفاعلي
          </p>

          <h2
            id="lesson-deck-title"
            className="text-2xl font-black text-slate-950 sm:text-3xl"
          >
            تعلّم بالشرائح
          </h2>
        </div>

        <div className="rounded-full bg-emerald-950 px-4 py-2 text-sm font-black text-white">
          {current + 1}
          {" / "}
          {deck.length}
        </div>
      </div>

      <div className="h-2 bg-slate-100">
        <div
          className="h-full bg-amber-400 transition-all duration-500"
          style={{
            width:
              String(progress) +
              "%",
          }}
        />
      </div>

      <div
        className="relative overflow-hidden bg-[#fdf8ec] outline-none"
        dir="ltr"
        tabIndex={0}
        onKeyDown={(event) => {
          if (
            event.key ===
            "ArrowLeft"
          ) {
            goNext();
          }

          if (
            event.key ===
            "ArrowRight"
          ) {
            goPrevious();
          }
        }}
        onTouchStart={(
          event
        ) => {
          touchStart.current =
            event.touches[0]
              .clientX;
        }}
        onTouchEnd={(
          event
        ) => {
          if (
            touchStart.current ===
            null
          ) {
            return;
          }

          const delta =
            event.changedTouches[0]
              .clientX -
            touchStart.current;

          if (delta < -50) {
            goNext();
          }

          if (delta > 50) {
            goPrevious();
          }

          touchStart.current =
            null;
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform:
              "translateX(-" +
              String(
                current * 100
              ) +
              "%)",
          }}
        >
          {deck.map(
            (
              slide,
              index
            ) => {
              const isQuiz =
                slide.kind ===
                "quiz";

              const selected =
                answers[
                  slide.key
                ] ?? "";

              const hasChecked =
                Boolean(
                  checked[
                    slide.key
                  ]
                );

              const selectedOption =
                isQuiz
                  ? slide.options.find(
                      (
                        option
                      ) =>
                        option.id ===
                        selected
                    )
                  : undefined;

              const isCorrect =
                isQuiz &&
                hasChecked &&
                (
                  selected ===
                    slide.correctAnswer ||
                  selectedOption?.text ===
                    slide.correctAnswer
                );

              return (
                <article
                  key={
                    slide.key
                  }
                  dir="rtl"
                  className="min-w-full"
                >
                  <div className="relative mx-auto flex min-h-[520px] max-w-6xl items-center px-6 py-10 sm:min-h-[580px] sm:px-12 lg:min-h-[620px] lg:px-16">
                    <div
                      className={[
                        "w-full rounded-[2rem] border p-7 shadow-lg sm:p-10 lg:p-12",
                        isQuiz
                          ? "border-amber-300 bg-gradient-to-br from-amber-50 via-white to-emerald-50"
                          : "border-emerald-200 bg-white",
                      ].join(
                        " "
                      )}
                    >
                      <div className="mb-8 flex items-start justify-between gap-4">
                        <span
                          className={[
                            "rounded-full px-4 py-2 text-sm font-black",
                            isQuiz
                              ? "bg-amber-400 text-slate-950"
                              : "bg-emerald-950 text-white",
                          ].join(
                            " "
                          )}
                        >
                          {isQuiz
                            ? "تفاعل سريع"
                            : "شرح"}
                        </span>

                        <span className="text-5xl sm:text-6xl">
                          {isQuiz
                            ? "❓"
                            : teachingEmoji(
                                index
                              )}
                        </span>
                      </div>

                      {slide.kind ===
                      "teach" ? (
                        <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_.6fr]">
                          <div>
                            <h3 className="text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                              {
                                slide.title
                              }
                            </h3>

                            {slide.body ? (
                              <div className="mt-8">
                                {slide.body.includes(
                                  " — "
                                ) ? (
                                  <div className="grid gap-4 sm:grid-cols-2">
                                    {slide.body
                                      .split(
                                        " — "
                                      )
                                      .map(
                                        (
                                          part,
                                          partIndex
                                        ) => (
                                          <div
                                            key={
                                              part +
                                              String(
                                                partIndex
                                              )
                                            }
                                            className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center text-2xl font-black leading-10 text-slate-900 sm:text-3xl"
                                          >
                                            {
                                              part
                                            }
                                          </div>
                                        )
                                      )}
                                  </div>
                                ) : (
                                  <p className="text-2xl font-bold leading-[1.9] text-slate-700 sm:text-3xl">
                                    {
                                      slide.body
                                    }
                                  </p>
                                )}
                              </div>
                            ) : null}
                          </div>

                          <div className="hidden lg:flex">
                            <div className="flex aspect-square w-full items-center justify-center rounded-[3rem] bg-gradient-to-br from-emerald-950 to-emerald-700 text-8xl shadow-xl">
                              {teachingEmoji(
                                index
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                            {
                              slide.question
                            }
                          </h3>

                          <div className="mt-8 grid gap-4 sm:grid-cols-2">
                            {slide.options.map(
                              (
                                option
                              ) => {
                                const chosen =
                                  selected ===
                                  option.id;

                                return (
                                  <button
                                    key={
                                      option.id
                                    }
                                    type="button"
                                    onClick={() => {
                                      setAnswers(
                                        (
                                          previous
                                        ) => ({
                                          ...previous,
                                          [slide.key]:
                                            option.id,
                                        })
                                      );

                                      setChecked(
                                        (
                                          previous
                                        ) => ({
                                          ...previous,
                                          [slide.key]:
                                            false,
                                        })
                                      );
                                    }}
                                    className={[
                                      "rounded-2xl border-2 px-5 py-5 text-xl font-black transition sm:text-2xl",
                                      chosen
                                        ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                                        : "border-slate-200 bg-white text-slate-800 hover:border-amber-400",
                                    ].join(
                                      " "
                                    )}
                                  >
                                    {
                                      option.text
                                    }
                                  </button>
                                );
                              }
                            )}
                          </div>

                          <div className="mt-7 flex flex-wrap items-center gap-4">
                            <button
                              type="button"
                              disabled={
                                !selected
                              }
                              onClick={() => {
                                setChecked(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    [slide.key]:
                                      true,
                                  })
                                );
                              }}
                              className="rounded-xl bg-emerald-950 px-6 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              تحقق من الإجابة
                            </button>

                            {hasChecked ? (
                              <div
                                className={[
                                  "rounded-xl px-5 py-3 font-black",
                                  isCorrect
                                    ? "bg-emerald-100 text-emerald-900"
                                    : "bg-rose-100 text-rose-900",
                                ].join(
                                  " "
                                )}
                              >
                                {isCorrect
                                  ? "أحسنت! إجابة صحيحة ✓"
                                  : "حاول مرة أخرى"}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>

        <button
          type="button"
          aria-label="الشريحة السابقة"
          onClick={
            goPrevious
          }
          disabled={
            current === 0
          }
          className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-950 text-2xl font-black text-white shadow-lg transition hover:scale-105 disabled:opacity-20 sm:right-6"
        >
          ›
        </button>

        <button
          type="button"
          aria-label="الشريحة التالية"
          onClick={goNext}
          disabled={
            current ===
            deck.length - 1
          }
          className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-950 text-2xl font-black text-white shadow-lg transition hover:scale-105 disabled:opacity-20 sm:left-6"
        >
          ‹
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-amber-100 bg-white px-4 py-4">
        {deck.map(
          (
            slide,
            index
          ) => (
            <button
              key={
                "dot-" +
                slide.key
              }
              type="button"
              aria-label={
                "الانتقال إلى الشريحة " +
                String(
                  index + 1
                )
              }
              onClick={() =>
                setCurrent(
                  index
                )
              }
              className={[
                "h-3 rounded-full transition-all",
                index ===
                current
                  ? "w-9 bg-emerald-900"
                  : slide.kind ===
                      "quiz"
                    ? "w-3 bg-amber-400"
                    : "w-3 bg-slate-300",
              ].join(
                " "
              )}
            />
          )
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-[#fffaf0] px-5 py-4 text-sm font-bold text-slate-600 sm:px-7">
        <span>
          اسحب يمينًا أو يسارًا
        </span>

        <span>
          {progress}% من العرض
        </span>
      </div>
    </section>
  );
}