
"use client";

import { FormEvent, useState } from "react";

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

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: cleanQuestion,
          page: window.location.pathname,
        }),
      });

      const data = (await response.json()) as { answer?: string };
      const reply = data.answer?.trim();

      if (!response.ok || !reply) {
        throw new Error(reply || "تعذر الحصول على إجابة الآن.");
      }

      setAnswer(reply);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر التواصل مع ضاد الآن. حاول مرة أخرى بعد قليل."
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-teal-50 via-white to-white px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-teal-100 bg-white shadow-xl shadow-teal-950/5">
        <div className="bg-gradient-to-l from-teal-700 to-emerald-600 p-7 text-white sm:p-9">
          <p className="text-sm font-black text-teal-100">ضاد · رفيق العربية الذكي</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">اسأل، افهم، ثم جرّب بنفسك</h1>
          <p className="mt-3 max-w-2xl leading-8 text-teal-50">
            يمكنك تجربة ضاد مباشرة. وعند تسجيل الدخول يحفظ ضاد سياق محادثتك ليساعدك بصورة أكثر استمرارية.
          </p>
        </div>

        <form onSubmit={ask} className="space-y-4 p-6 sm:p-8">
          <label htmlFor="dad-question" className="block text-lg font-black text-slate-900">سؤالك</label>
          <textarea
            id="dad-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={3000}
            required
            rows={6}
            placeholder="مثال: ما الفرق بين المبتدأ والخبر؟"
            className="w-full rounded-2xl border border-slate-300 bg-white p-4 text-lg leading-8 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">الفصحى جسر يجمع اللهجات؛ اكتب بطريقتك وسيساعدك ضاد بلغة عربية واضحة.</p>
            <button
              type="submit"
              disabled={isSending || !question.trim()}
              className="rounded-2xl bg-teal-700 px-7 py-3 font-black text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? "يفكر ضاد..." : "إرسال"}
            </button>
          </div>
        </form>

        <div aria-live="polite" className="border-t border-slate-100 p-6 sm:p-8">
          <h2 className="text-xl font-black text-slate-900">إجابة ضاد</h2>
          {error ? (
            <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-700">{error}</div>
          ) : answer ? (
            <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-lg leading-9 text-slate-800">{answer}</div>
          ) : (
            <p className="mt-4 text-slate-500">اكتب سؤالك، وستظهر الإجابة هنا.</p>
          )}
        </div>
      </section>
    </main>
  );
}
