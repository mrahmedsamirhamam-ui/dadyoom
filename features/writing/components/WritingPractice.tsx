"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  saveSkillProgress,
} from "@/features/skills-progress/saveSkillProgress";

type Difficulty =
  | "starter"
  | "foundation"
  | "guided"
  | "standard"
  | "challenge";

type WritingPrompt = {
  title: string;
  prompt: string;
  tips: string[];
  minWords: number;
  targetWords: number;
};

type WritingEvaluation = {
  overallScore: number;
  spellingScore: number;
  grammarScore: number;
  coherenceScore: number;
  styleScore: number;
  strengths: string[];
  improvements: string[];
  correctedText: string;
  improvedText: string;
  feedback: string;
};

const allowed =
  new Set<Difficulty>([
    "starter",
    "foundation",
    "guided",
    "standard",
    "challenge",
  ]);

function readDifficulty():
  Difficulty {
  if (
    typeof window ===
      "undefined"
  ) {
    return "starter";
  }

  const value =
    new URLSearchParams(
      window.location.search
    ).get(
      "difficulty"
    );

  return (
    value &&
    allowed.has(
      value as Difficulty
    )
  )
    ? value as Difficulty
    : "starter";
}

function ScoreBox({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-sm font-black text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-emerald-700">
        {score}%
      </p>
    </div>
  );
}

export default function WritingPractice() {
  const [
    difficulty,
    setDifficulty,
  ] =
    useState<Difficulty>(
      "starter"
    );

  const [
    difficultyLabel,
    setDifficultyLabel,
  ] =
    useState(
      "استكشافي"
    );

  const [
    writingPrompt,
    setWritingPrompt,
  ] =
    useState<
      WritingPrompt | null
    >(null);

  const [
    text,
    setText,
  ] =
    useState("");

  const [
    loadingPrompt,
    setLoadingPrompt,
  ] =
    useState(true);

  const [
    evaluating,
    setEvaluating,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    evaluation,
    setEvaluation,
  ] =
    useState<
      WritingEvaluation | null
    >(null);

  const [
    saved,
    setSaved,
  ] =
    useState(false);

  const [
    generation,
    setGeneration,
  ] =
    useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDifficulty(
      readDifficulty()
    );
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPrompt() {
      setLoadingPrompt(true);
      setError("");
      setEvaluation(null);
      setSaved(false);
      setText("");

      try {
        const response =
          await fetch(
            "/api/skills/writing/adaptive",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  difficulty,
                }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.ok
        ) {
          throw new Error(
            data.error ||
            "تعذر إنشاء موضوع الكتابة."
          );
        }

        if (active) {
          setWritingPrompt(
            data.writingPrompt
          );

          setDifficultyLabel(
            data.difficultyLabel
          );
        }
      }
      catch (requestError) {
        if (active) {
          setError(
            requestError
              instanceof Error
              ? requestError.message
              : "تعذر تحميل التدريب."
          );
        }
      }
      finally {
        if (active) {
          setLoadingPrompt(false);
        }
      }
    }

    void loadPrompt();

    return () => {
      active = false;
    };
  }, [
    difficulty,
    generation,
  ]);

  const wordCount =
    useMemo(
      () => {
        const cleaned =
          text.trim();

        return cleaned
          ? cleaned
              .split(/\s+/u)
              .filter(Boolean)
              .length
          : 0;
      },
      [text]
    );

  async function evaluateWriting() {
    if (
      !writingPrompt
    ) {
      return;
    }

    if (
      wordCount <
      writingPrompt.minWords
    ) {
      setError(
        `اكتب على الأقل ${writingPrompt.minWords} كلمة قبل التقييم.`
      );

      return;
    }

    setEvaluating(true);
    setError("");
    setEvaluation(null);
    setSaved(false);

    try {
      const response =
        await fetch(
          "/api/skills/writing/evaluate",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                text:
                  text.trim(),

                prompt:
                  writingPrompt.prompt,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.error ||
          "تعذر تقييم الكتابة."
        );
      }

      setEvaluation(
        data.evaluation
      );

      const result =
        await saveSkillProgress(
          "writing",
          data.evaluation
            .overallScore
        );

      setSaved(
        Boolean(result)
      );
    }
    catch (requestError) {
      setError(
        requestError
          instanceof Error
          ? requestError.message
          : "تعذر تقييم الكتابة."
      );
    }
    finally {
      setEvaluating(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/skills/adaptive"
          className="font-black text-emerald-700 hover:underline"
        >
          ← العودة إلى التدريب التكيفي
        </Link>

        <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">
          المستوى: {difficultyLabel}
        </span>
      </div>

      <section className="mt-5 rounded-3xl bg-gradient-to-l from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-xl">
        <p className="text-sm font-black text-emerald-100">
          ضاديوم • الكتابة التكيفية
        </p>

        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
          ✍️ اكتب، راجع، وتحسّن
        </h1>

        <p className="mt-4 max-w-3xl leading-8 text-emerald-50">
          موضوع الكتابة يتغير حسب مستواك، ثم يراجع ضاد كتابتك ويحدد ما أتقنته وما يحتاج إلى تحسين.
        </p>
      </section>

      {loadingPrompt ? (
        <section className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-4xl">
            ✍️
          </div>

          <p className="mt-4 font-black text-slate-700">
            ضاد يختار موضوعًا مناسبًا لك...
          </p>
        </section>
      ) : error &&
        !writingPrompt ? (
        <section className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 font-bold text-rose-700">
          {error}
        </section>
      ) : writingPrompt ? (
        <>
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black text-emerald-700">
              موضوعك
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              {writingPrompt.title}
            </h2>

            <p className="mt-4 text-lg font-bold leading-9 text-slate-700">
              {writingPrompt.prompt}
            </p>

            <div className="mt-5 rounded-2xl bg-amber-50 p-5">
              <p className="font-black text-amber-900">
                💡 قبل أن تبدأ
              </p>

              <ul className="mt-3 space-y-2 leading-7 text-amber-900">
                {writingPrompt.tips.map(
                  (
                    tip,
                    index
                  ) => (
                    <li
                      key={`${tip}-${index}`}
                    >
                      • {tip}
                    </li>
                  )
                )}
              </ul>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-sm font-black">
              <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">
                الحد الأدنى: {writingPrompt.minWords} كلمة
              </span>

              <span className="rounded-full bg-emerald-100 px-4 py-2 text-emerald-800">
                الهدف: نحو {writingPrompt.targetWords} كلمة
              </span>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <textarea
              value={text}
              onChange={
                event => {
                  setText(
                    event.target.value
                  );

                  setEvaluation(
                    null
                  );

                  setSaved(
                    false
                  );
                }
              }
              placeholder="ابدأ الكتابة هنا..."
              className="min-h-72 w-full resize-y rounded-2xl border border-slate-300 bg-slate-50 p-5 text-lg leading-9 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />

            <div className="mt-3 flex flex-wrap justify-between gap-3 text-sm font-bold text-slate-500">
              <span>
                الكلمات: {wordCount}
              </span>

              <span>
                المطلوب على الأقل: {writingPrompt.minWords}
              </span>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="button"
              disabled={
                evaluating ||
                wordCount <
                  writingPrompt.minWords
              }
              onClick={
                evaluateWriting
              }
              className="mt-5 rounded-2xl bg-emerald-600 px-7 py-4 text-lg font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {evaluating
                ? "ضاد يراجع كتابتك..."
                : "✨ قيّم كتابتي"}
            </button>
          </section>

          {evaluation ? (
            <section className="mt-7 space-y-6">
              <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-7 text-center">
                <p className="text-sm font-black text-emerald-700">
                  تقييم ضاد
                </p>

                <p className="mt-2 text-6xl font-black text-emerald-800">
                  {evaluation.overallScore}%
                </p>

                <p className="mx-auto mt-4 max-w-3xl text-lg font-bold leading-8 text-emerald-950">
                  {evaluation.feedback}
                </p>
              </article>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ScoreBox
                  label="الإملاء"
                  score={
                    evaluation.spellingScore
                  }
                />

                <ScoreBox
                  label="النحو"
                  score={
                    evaluation.grammarScore
                  }
                />

                <ScoreBox
                  label="ترابط الأفكار"
                  score={
                    evaluation.coherenceScore
                  }
                />

                <ScoreBox
                  label="الأسلوب"
                  score={
                    evaluation.styleScore
                  }
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <article className="rounded-3xl border border-emerald-200 bg-white p-6">
                  <h3 className="text-xl font-black text-emerald-800">
                    🌟 نقاط قوتك
                  </h3>

                  <ul className="mt-4 space-y-3 leading-7 text-slate-700">
                    {evaluation.strengths.map(
                      (
                        item,
                        index
                      ) => (
                        <li
                          key={`${item}-${index}`}
                        >
                          ✓ {item}
                        </li>
                      )
                    )}
                  </ul>
                </article>

                <article className="rounded-3xl border border-amber-200 bg-white p-6">
                  <h3 className="text-xl font-black text-amber-800">
                    🎯 كيف تتحسن؟
                  </h3>

                  <ul className="mt-4 space-y-3 leading-7 text-slate-700">
                    {evaluation.improvements.map(
                      (
                        item,
                        index
                      ) => (
                        <li
                          key={`${item}-${index}`}
                        >
                          • {item}
                        </li>
                      )
                    )}
                  </ul>
                </article>
              </div>

              <article className="rounded-3xl border border-sky-200 bg-sky-50 p-6">
                <h3 className="text-xl font-black text-sky-900">
                  📝 النص بعد التصحيح
                </h3>

                <p className="mt-4 whitespace-pre-wrap text-lg leading-9 text-slate-800">
                  {evaluation.correctedText}
                </p>
              </article>

              <article className="rounded-3xl border border-violet-200 bg-violet-50 p-6">
                <h3 className="text-xl font-black text-violet-900">
                  ✨ نموذج أقوى لنفس فكرتك
                </h3>

                <p className="mt-4 whitespace-pre-wrap text-lg leading-9 text-slate-800">
                  {evaluation.improvedText}
                </p>
              </article>

              <div className="rounded-3xl bg-slate-950 p-6 text-white">
                <p className="font-black">
                  {saved
                    ? "✓ تم حفظ نتيجتك، وسيستخدمها ضاد في تحديد التدريب القادم."
                    : "ظهرت النتيجة، وسيحاول ضاد حفظ تقدمك إذا كنت مسجلًا."}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setGeneration(
                        value =>
                          value + 1
                      )
                    }
                    className="rounded-2xl bg-white px-6 py-3 font-black text-slate-900"
                  >
                    موضوع جديد بنفس المستوى
                  </button>

                  <Link
                    href="/skills/adaptive"
                    className="rounded-2xl border border-slate-600 px-6 py-3 font-black text-white"
                  >
                    ماذا أتدرب بعد ذلك؟
                  </Link>
                </div>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
