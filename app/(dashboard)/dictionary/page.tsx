"use client";

import {
  useState,
} from "react";

import ListenButton from "@/features/lesson-activities/components/ListenButton";

type DictionaryWord = {
  word: string;
  type: string;
  meaning: string;
};

type ContextAnalysis = {
  word: string;
  normalizedWord: string;
  type: string;
  meaningInContext: string;
  simpleMeaning: string;
  synonyms: string[];
  antonyms: string[];
  root: string | null;
  pattern: string | null;
  example: string;
  explanation: string;
};

type DictionaryResult = {
  sentence: string;
  targetWord: string | null;
  analysis: ContextAnalysis | null;
  words: DictionaryWord[];
};

type DictionaryResponse = {
  success: boolean;
  result?: DictionaryResult;
  error?: string;
};

export default function DictionaryPage() {
  const [
    text,
    setText,
  ] =
    useState("");

  const [
    targetWord,
    setTargetWord,
  ] =
    useState("");

  const [
    result,
    setResult,
  ] =
    useState<
      DictionaryResult | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  async function analyze() {
    const cleanedText =
      text.trim();

    if (!cleanedText) {
      setError(
        "اكتب كلمة أو جملة أولًا."
      );

      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response =
        await fetch(
          "/api/dictionary",
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
                  cleanedText,

                targetWord:
                  targetWord
                    .trim(),
              }),
          }
        );

      const data =
        await response
          .json() as
          DictionaryResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.result
      ) {
        throw new Error(
          data.error ||
          "تعذر تحليل النص."
        );
      }

      setResult(
        data.result
      );

    } catch (requestError) {
      setError(
        requestError
          instanceof Error
          ? requestError
              .message
          : "حدث خطأ غير متوقع."
      );

    } finally {
      setLoading(false);
    }
  }

  const analysis =
    result?.analysis ??
    null;

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"
    >
      <section className="overflow-hidden rounded-3xl bg-gradient-to-l from-violet-700 via-indigo-700 to-sky-700 p-6 text-white shadow-xl sm:p-9">
        <p className="text-sm font-black text-violet-100">
          ضاديوم • بيت العربية الرقمي
        </p>

        <h1 className="mt-3 text-3xl font-black sm:text-4xl">
          قاموس ضاديوم السياقي
        </h1>

        <p className="mt-4 max-w-3xl leading-8 text-violet-50">
          لا تبحث عن معنى الكلمة وحدها؛
          ضعها داخل جملة ليشرح لك ضاديوم
          معناها في السياق، ونوعها،
          ومرادفاتها وأضدادها، مع مثال جديد.
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <label className="block text-lg font-black text-slate-900">
          اكتب الجملة أو النص
        </label>

        <textarea
          value={text}
          onChange={
            (event) =>
              setText(
                event.target.value
              )
          }
          placeholder="مثال: أشرقت الشمس فامتلأ المكان نورًا."
          rows={5}
          className="mt-3 w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 p-4 text-lg leading-8 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
        />

        <label className="mt-5 block font-black text-slate-900">
          الكلمة التي تريد فهمها
          <span className="mr-2 text-sm font-normal text-slate-500">
            (اختياري)
          </span>
        </label>

        <input
          value={targetWord}
          onChange={
            (event) =>
              setTargetWord(
                event.target.value
              )
          }
          placeholder="مثال: أشرقت"
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-lg outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 sm:max-w-md"
        />

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={analyze}
            className="rounded-2xl bg-violet-600 px-7 py-3 font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "ضاديوم يفهم السياق..."
              : "حلّل المعنى"}
          </button>

          <button
            type="button"
            onClick={() => {
              setText(
                "أشرقت الشمس فامتلأ المكان نورًا."
              );

              setTargetWord(
                "أشرقت"
              );

              setResult(
                null
              );

              setError("");
            }}
            className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 hover:bg-slate-50"
          >
            جرّب مثالًا
          </button>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-700"
          >
            {error}
          </div>
        ) : null}
      </section>

      {analysis ? (
        <section className="mt-6 grid gap-5 lg:grid-cols-3">
          <article className="rounded-3xl border border-violet-200 bg-violet-50 p-6 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-violet-600">
                  الكلمة في السياق
                </p>

                <h2 className="mt-2 text-4xl font-black text-slate-950">
                  {analysis.word}
                </h2>

                <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-sm font-black text-violet-700 ring-1 ring-violet-200">
                  {analysis.type}
                </span>
              </div>

              <ListenButton
                text={analysis.word}
                mood="normal"
              />
            </div>

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-slate-500">
                معناها هنا
              </p>

              <p className="mt-2 text-xl font-black leading-9 text-slate-900">
                {analysis.meaningInContext ||
                  analysis.simpleMeaning}
              </p>
            </div>

            {analysis.explanation ? (
              <div className="mt-4 rounded-2xl border border-violet-200 p-5">
                <p className="text-sm font-black text-violet-700">
                  لماذا هذا المعنى؟
                </p>

                <p className="mt-2 leading-8 text-slate-700">
                  {analysis.explanation}
                </p>
              </div>
            ) : null}

            {analysis.example ? (
              <div className="mt-4 rounded-2xl bg-sky-50 p-5">
                <p className="text-sm font-black text-sky-700">
                  مثال جديد
                </p>

                <p className="mt-2 text-lg font-bold leading-8 text-slate-800">
                  {analysis.example}
                </p>

                <ListenButton
                  text={analysis.example}
                  mood="normal"
                />
              </div>
            ) : null}
          </article>

          <aside className="space-y-5">
            <article className="rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="font-black text-slate-900">
                بطاقة الكلمة
              </h3>

              <dl className="mt-4 space-y-4">
                {analysis.root ? (
                  <div>
                    <dt className="text-sm font-bold text-slate-500">
                      الجذر
                    </dt>

                    <dd className="mt-1 text-lg font-black text-slate-900">
                      {analysis.root}
                    </dd>
                  </div>
                ) : null}

                {analysis.pattern ? (
                  <div>
                    <dt className="text-sm font-bold text-slate-500">
                      الوزن
                    </dt>

                    <dd className="mt-1 font-black text-slate-900">
                      {analysis.pattern}
                    </dd>
                  </div>
                ) : null}

                {analysis.normalizedWord ? (
                  <div>
                    <dt className="text-sm font-bold text-slate-500">
                      الصورة الأساسية
                    </dt>

                    <dd className="mt-1 font-black text-slate-900">
                      {analysis.normalizedWord}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </article>

            {analysis.synonyms.length > 0 ? (
              <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <h3 className="font-black text-emerald-900">
                  مرادفات
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {analysis.synonyms.map(
                    (
                      synonym,
                      index
                    ) => (
                      <span
                        key={`${synonym}-${index}`}
                        className="rounded-full bg-white px-3 py-2 font-bold text-emerald-800"
                      >
                        {synonym}
                      </span>
                    )
                  )}
                </div>
              </article>
            ) : null}

            {analysis.antonyms.length > 0 ? (
              <article className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="font-black text-amber-900">
                  أضداد
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {analysis.antonyms.map(
                    (
                      antonym,
                      index
                    ) => (
                      <span
                        key={`${antonym}-${index}`}
                        className="rounded-full bg-white px-3 py-2 font-bold text-amber-800"
                      >
                        {antonym}
                      </span>
                    )
                  )}
                </div>
              </article>
            ) : null}
          </aside>
        </section>
      ) : null}

      {result &&
      result.words.length > 0 ? (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-black text-indigo-600">
              مفردات النص
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              استكشف كلمات الجملة
            </h2>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.words.map(
              (
                item,
                index
              ) => (
                <button
                  type="button"
                  key={`${item.word}-${index}`}
                  onClick={() => {
                    setTargetWord(
                      item.word
                    );

                    setResult(
                      null
                    );

                    setTimeout(
                      () => {
                        window.scrollTo({
                          top: 0,
                          behavior:
                            "smooth",
                        });
                      },
                      0
                    );
                  }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-right transition hover:border-violet-300 hover:bg-violet-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xl font-black text-slate-900">
                      {item.word}
                    </span>

                    <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-500">
                      {item.type}
                    </span>
                  </div>

                  <p className="mt-2 leading-7 text-slate-600">
                    {item.meaning}
                  </p>
                </button>
              )
            )}
          </div>
        </section>
      ) : null}

      {result ? (
        <section className="mt-6 rounded-3xl bg-slate-900 p-5 text-white">
          <p className="text-sm font-bold text-slate-400">
            السياق الذي تم تحليله
          </p>

          <p className="mt-2 text-lg font-bold leading-8">
            {result.sentence}
          </p>
        </section>
      ) : null}
    </main>
  );
}
