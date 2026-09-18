"use client";

import { FormEvent, useState } from "react";

import { askDadyoomHybrid } from "@/lib/mobile/hybrid-ai";

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanQuestion = question.trim();
    if (!cleanQuestion || isSending) return;

    setIsSending(true);
    setError("");
    setAnswer("");

    try {
      const result = await askDadyoomHybrid(cleanQuestion);
      setAnswer(result.text);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "تعذر تشغيل ضاد الآن. حاول مرة أخرى."
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-teal-50 via-white to-white px-4 py-8 sm:px-6"
    >
      <section className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-teal-100 bg-white shadow-xl shadow-teal-950/5">
        <div className="bg-gradient-to-l from-[#123f39] to-[#1f665c] p-7 text-white sm:p-9">
          <p className="text-sm font-black text-teal-100">
            ضاد · رفيق العربية
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            اسأل ضاد
          </h1>
        </div>

        <form onSubmit={ask} className="p-5 sm:p-8">
          <label
            htmlFor="dad-question"
            className="font-black text-[#123f39]"
          >
            سؤالك
          </label>

          <textarea
            id="dad-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="اكتب سؤالك هنا..."
            className="mt-3 min-h-36 w-full rounded-2xl border border-[#d8c7a6] p-4 text-base outline-none focus:border-[#123f39]"
          />

          <button
            type="submit"
            disabled={isSending || !question.trim()}
            className="touch-manipulation mt-4 w-full rounded-2xl bg-[#123f39] px-6 py-4 font-black text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            {isSending ? "ضاد يفكر…" : "اسأل ضاد"}
          </button>

          {error ? (
            <div className="mt-4 rounded-2xl bg-rose-50 p-4 font-bold leading-7 text-rose-800">
              {error}
            </div>
          ) : null}

          {answer ? (
            <article className="mt-5 whitespace-pre-wrap rounded-2xl bg-[#eef8f4] p-5 leading-8 text-[#263f3a]">
              {answer}
            </article>
          ) : null}
        </form>
      </section>
    </main>
  );
}
