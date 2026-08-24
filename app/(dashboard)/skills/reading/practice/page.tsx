"use client";

import Link from "next/link";

import { saveSkillProgress } from "@/features/skills-progress/saveSkillProgress";
import {
  useMemo,
  useState,
} from "react";

type Question = {
  type:
    | "mainIdea"
    | "detail"
    | "vocabulary"
    | "inference";
  question: string;
  options: string[];
  correct: string;
  explanation: string;
};

type ReadingText = {
  title: string;
  level: string;
  text: string;
  questions: Question[];
};

const texts: ReadingText[] = [
  {
    title:
      "رحلة إلى المكتبة",
    level:
      "مستوى 1",
    text:
      "ذهب سامر مع والده إلى المكتبة العامة في صباح يوم الجمعة. كانت المكتبة هادئة ومنظمة، وفيها كتب كثيرة عن العلوم والتاريخ والقصص. اختار سامر كتابًا عن الحيوانات، ثم جلس في ركن القراءة وبدأ يتصفح صفحاته. أعجبه الكتاب كثيرًا، فقرر أن يستعيره ليكمل قراءته في المنزل. شجعه والده على القراءة، وقال له إن الكتاب صديق يساعد الإنسان على التعلم واكتشاف أشياء جديدة.",
    questions: [
      {
        type:
          "mainIdea",
        question:
          "ما الفكرة الرئيسية للنص؟",
        options: [
          "سامر يحب اللعب في الحديقة.",
          "زيارة سامر للمكتبة وتشجيعه على القراءة.",
          "سامر يبحث عن صديق جديد.",
        ],
        correct:
          "زيارة سامر للمكتبة وتشجيعه على القراءة.",
        explanation:
          "النص كله يدور حول زيارة سامر للمكتبة واختياره كتابًا وتشجيع والده له على القراءة.",
      },
      {
        type:
          "detail",
        question:
          "ما نوع الكتاب الذي اختاره سامر؟",
        options: [
          "كتاب عن الحيوانات.",
          "كتاب عن الرياضة.",
          "كتاب عن السفر.",
        ],
        correct:
          "كتاب عن الحيوانات.",
        explanation:
          "ذكر النص بوضوح أن سامر اختار كتابًا عن الحيوانات.",
      },
      {
        type:
          "vocabulary",
        question:
          "ما معنى كلمة «يتصفح» في السياق؟",
        options: [
          "ينظر في صفحات الكتاب ويقرأ بعضها.",
          "يغلق الكتاب بسرعة.",
          "يكتب في الكتاب.",
        ],
        correct:
          "ينظر في صفحات الكتاب ويقرأ بعضها.",
        explanation:
          "السياق يوضح أن سامر جلس في ركن القراءة وبدأ ينظر في صفحات الكتاب.",
      },
      {
        type:
          "inference",
        question:
          "ماذا نستنتج من قول الأب: «الكتاب صديق»؟",
        options: [
          "أن الكتاب يتحدث مثل الإنسان.",
          "أن القراءة مفيدة وتساعد الإنسان على التعلم.",
          "أن كل الكتب لها أسماء أشخاص.",
        ],
        correct:
          "أن القراءة مفيدة وتساعد الإنسان على التعلم.",
        explanation:
          "المقصود تشبيه الكتاب بالصديق لأنه ينفع الإنسان ويعلمه أشياء جديدة.",
      },
    ],
  },
  {
    title:
      "الماء سر الحياة",
    level:
      "مستوى 2",
    text:
      "الماء نعمة عظيمة لا يستطيع الإنسان أو الحيوان أو النبات الاستغناء عنها. نستخدم الماء في الشرب والطهي والنظافة والزراعة، ولذلك يجب أن نحافظ عليه. بعض الناس يتركون الصنبور مفتوحًا دون حاجة، وهذا يؤدي إلى إهدار كميات كبيرة من الماء. يمكن لكل واحد منا أن يساهم في المحافظة على هذه النعمة بإغلاق الصنبور جيدًا، وعدم استخدام كمية أكبر من الحاجة، وإبلاغ الكبار عند وجود تسرب للماء.",
    questions: [
      {
        type:
          "mainIdea",
        question:
          "ما الفكرة الرئيسية للنص؟",
        options: [
          "أهمية الماء وضرورة المحافظة عليه.",
          "طرق زراعة النباتات.",
          "أهمية الطهي في المنزل.",
        ],
        correct:
          "أهمية الماء وضرورة المحافظة عليه.",
        explanation:
          "النص يوضح أهمية الماء ثم يقدم طرقًا للحفاظ عليه.",
      },
      {
        type:
          "detail",
        question:
          "أي سلوك يؤدي إلى إهدار الماء؟",
        options: [
          "إغلاق الصنبور جيدًا.",
          "ترك الصنبور مفتوحًا دون حاجة.",
          "الإبلاغ عن تسرب الماء.",
        ],
        correct:
          "ترك الصنبور مفتوحًا دون حاجة.",
        explanation:
          "النص ذكر ذلك صراحة باعتباره سلوكًا يسبب إهدار الماء.",
      },
      {
        type:
          "vocabulary",
        question:
          "ما معنى كلمة «إهدار» في النص؟",
        options: [
          "استخدام الشيء بطريقة نافعة.",
          "ضياع الشيء أو استخدامه دون فائدة.",
          "حفظ الشيء لوقت آخر.",
        ],
        correct:
          "ضياع الشيء أو استخدامه دون فائدة.",
        explanation:
          "السياق يتحدث عن ترك الصنبور مفتوحًا بلا حاجة، أي ضياع الماء.",
      },
      {
        type:
          "inference",
        question:
          "ما السلوك الذي يدل على تحمل المسؤولية؟",
        options: [
          "تجاهل تسرب الماء.",
          "إبلاغ الكبار عند وجود تسرب.",
          "استخدام أكبر كمية ممكنة من الماء.",
        ],
        correct:
          "إبلاغ الكبار عند وجود تسرب.",
        explanation:
          "لأنه يساعد على منع ضياع الماء ومعالجة المشكلة.",
      },
    ],
  },
];

const typeLabels: Record<
  Question["type"],
  string
> = {
  mainIdea:
    "الفكرة الرئيسية",
  detail:
    "التفاصيل",
  vocabulary:
    "المفردات في السياق",
  inference:
    "الاستنتاج",
};

export default function ReadingPracticePage() {
  const [
    textIndex,
    setTextIndex,
  ] =
    useState(0);

  const [
    answers,
    setAnswers,
  ] =
    useState<
      Record<number, string>
    >({});

  const [
    checked,
    setChecked,
  ] =
    useState(false);

  const reading =
    texts[textIndex];

  const score =
    useMemo(
      () =>
        reading.questions
          .reduce(
            (
              total,
              question,
              index
            ) =>
              total +
              (
                answers[index] ===
                question.correct
                  ? 1
                  : 0
              ),
            0
          ),
      [
        answers,
        reading.questions,
      ]
    );

  const percentage =
    Math.round(
      (
        score /
        reading.questions
          .length
      ) * 100
    );

  function reset() {
    setAnswers({});
    setChecked(false);
  }

  function nextText() {
    setTextIndex(
      index =>
        (
          index + 1
        ) %
        texts.length
    );

    reset();
  }

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"
    >
      <Link
        href="/skills/reading"
        className="font-black text-emerald-700 hover:underline"
      >
        ← العودة إلى مهارة القراءة
      </Link>

      <section className="mt-5 rounded-3xl bg-gradient-to-l from-emerald-500 to-teal-700 p-7 text-white shadow-xl sm:p-9">
        <p className="text-sm font-black text-emerald-100">
          ضاديوم • مختبر القراءة
        </p>

        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
          📖 اقرأ، افهم، واستنتج
        </h1>

        <p className="mt-4 max-w-3xl leading-8 text-emerald-50">
          اقرأ النص بهدوء، ثم أجب عن أسئلة الفهم والمفردات والاستنتاج.
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-700">
              {reading.level}
            </span>

            <h2 className="mt-3 text-3xl font-black text-slate-950">
              {reading.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={nextText}
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 font-black text-emerald-800"
          >
            نص آخر
          </button>
        </div>

        <article className="mt-6 rounded-2xl bg-slate-50 p-6 text-xl font-bold leading-[2.2] text-slate-800">
          {reading.text}
        </article>
      </section>

      <section className="mt-6 space-y-5">
        {reading.questions.map(
          (
            question,
            index
          ) => {
            const selected =
              answers[index];

            const isCorrect =
              selected ===
              question.correct;

            return (
              <article
                key={`${textIndex}-${index}`}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700">
                    {index + 1}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                    {typeLabels[
                      question.type
                    ]}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-black leading-8 text-slate-900">
                  {question.question}
                </h3>

                <div className="mt-4 grid gap-3">
                  {question.options.map(
                    option => {
                      const selectedThis =
                        selected ===
                        option;

                      const correctThis =
                        checked &&
                        option ===
                          question.correct;

                      const wrongThis =
                        checked &&
                        selectedThis &&
                        !correctThis;

                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={checked}
                          onClick={() =>
                            setAnswers(
                              previous => ({
                                ...previous,
                                [index]:
                                  option,
                              })
                            )
                          }
                          className={[
                            "rounded-2xl border p-4 text-right font-bold transition",
                            selectedThis
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-200 bg-slate-50 hover:border-emerald-300",
                            correctThis
                              ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                              : "",
                            wrongThis
                              ? "border-rose-500 bg-rose-50 text-rose-900"
                              : "",
                          ].join(" ")}
                        >
                          {option}
                        </button>
                      );
                    }
                  )}
                </div>

                {checked ? (
                  <div
                    className={[
                      "mt-5 rounded-2xl p-4",
                      isCorrect
                        ? "bg-emerald-50 text-emerald-900"
                        : "bg-amber-50 text-amber-900",
                    ].join(" ")}
                  >
                    <p className="font-black">
                      {isCorrect
                        ? "✓ إجابة صحيحة"
                        : `✗ الإجابة الصحيحة: ${question.correct}`}
                    </p>

                    <p className="mt-2 leading-7">
                      {question.explanation}
                    </p>
                  </div>
                ) : null}
              </article>
            );
          }
        )}
      </section>

      <section className="mt-6 rounded-3xl bg-slate-950 p-6 text-white">
        {!checked ? (
          <button
            type="button"
            disabled={
              Object.keys(
                answers
              ).length !==
              reading.questions
                .length
            }
            onClick={async () => {
              setChecked(true);

              await saveSkillProgress(
                "reading",
                percentage
              );
            }}
            className="rounded-2xl bg-emerald-500 px-7 py-3 font-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            تحقق من الإجابات
          </button>
        ) : (
          <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
            <div>
              <p className="text-sm font-black text-slate-400">
                نتيجتك
              </p>

              <p className="mt-2 text-5xl font-black">
                {percentage}%
              </p>

              <p className="mt-2 font-bold text-slate-300">
                {score} من{" "}
                {reading.questions.length}
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black">
                {percentage ===
                100
                  ? "ممتاز جدًا 🌟"
                  : percentage >=
                      75
                    ? "أحسنت 👏"
                    : "استمر في التدريب 📖"}
              </h2>

              <p className="mt-3 leading-8 text-slate-300">
                {percentage ===
                100
                  ? "فهمت النص والفكرة والمفردات والاستنتاج بصورة ممتازة."
                  : "راجع التفسيرات ثم أعد المحاولة لتحسين فهمك للنص."}
              </p>

              <button
                type="button"
                onClick={reset}
                className="mt-5 rounded-2xl bg-white px-6 py-3 font-black text-slate-900"
              >
                أعد المحاولة
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
