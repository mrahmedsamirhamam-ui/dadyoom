"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ASSISTANT_MODES, type AssistantMode } from "@/lib/ai/assistant-modes";
import { askDadyoomHybrid, type HybridAIResult } from "@/lib/mobile/hybrid-ai";

type Turn = {
  id: number;
  role: "user" | "assistant";
  content: string;
  engine?: HybridAIResult["engine"];
};

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<AssistantMode>("explain");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [nextId, setNextId] = useState(1);
  const [lessonId, setLessonId] = useState<string | null>(null);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("lessonId");
    const valid = raw && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/iu.test(raw);
    setLessonId(valid ? raw : null);
  }, []);

  const selectedMode = ASSISTANT_MODES.find((item) => item.id === mode) ?? ASSISTANT_MODES[0];

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion || isSending) return;

    setIsSending(true);
    setError("");

    try {
      // Only bounded prior on-page turns are sent; this is a teaching style,
      // not a school role or permission requested by the browser.
      const result = await askDadyoomHybrid(cleanQuestion, {
        mode,
        ...(lessonId ? { lessonId } : {}),
        history: turns.slice(-8).map((item) => ({
          role: item.role,
          content: item.content.slice(0, 2500),
        })),
      });

      setTurns((current) => [
        ...current,
        { id: nextId, role: "user", content: cleanQuestion },
        { id: nextId + 1, role: "assistant", content: result.text, engine: result.engine },
      ]);
      setNextId((id) => id + 2);
      setQuestion("");
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

  function clearVisibleConversation() {
    if (isSending) return;
    setTurns([]);
    setQuestion("");
    setError("");
    setNextId(1);
  }

  return (
    <main
      dir="rtl"
      className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-teal-50 via-white to-white px-4 py-8 sm:px-6"
    >
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-teal-100 bg-white shadow-xl shadow-teal-950/5">
        <header className="bg-gradient-to-l from-[#123f39] to-[#1f665c] p-7 text-white sm:p-9">
          <p className="text-sm font-black text-teal-100">
            ضاديوم المساعد الذكي · ضاد
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            اسأل ضاد، وتعلّم بطريقتك
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-8 text-[#e9f4ed]">
            شرح مبسط، تدريب فهم، مساعدة على الكتابة، ومواقف تربوية تدعم التعلم.
            ضاد رفيق للتعلم ولا يحل محل المعلم.
          </p>
        </header>

        <div className="p-5 sm:p-8">
          {lessonId ? (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d2e6d8] bg-[#f0f8f2] p-4 text-sm leading-7 text-[#23473b]">
              <p>أنت تسأل عن درس محدد. سيحاول ضاد قراءة المحتوى المنشور المسموح لحسابك فقط قبل الإجابة.</p>
              <Link href={`/lessons/${lessonId}`} className="font-black underline underline-offset-4">العودة إلى الدرس</Link>
            </div>
          ) : null}
          <fieldset disabled={isSending}>
            <legend className="text-lg font-black text-[#123f39]">
              كيف تريد أن يساعدك ضاد؟
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ASSISTANT_MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={mode === item.id}
                  onClick={() => { setMode(item.id); setError(""); }}
                  className={[
                    "touch-manipulation rounded-2xl border p-3.5 text-right transition focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#2b7c6e] motion-reduce:transition-none",
                    mode === item.id
                      ? "border-[#123f39] bg-[#e2f3ec] text-[#123f39] ring-2 ring-[#c4e2d6]"
                      : "border-[#e4d6bc] bg-[#fffaf2] text-[#63594a] hover:border-[#91b7a8]",
                  ].join(" ")}
                >
                  <span className="block font-black">{item.label}</span>
                  <span className="mt-1 block text-sm leading-6">{item.description}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-7 text-[#5b675e]">
              مثال يمكنك تعديله قبل الإرسال:
            </p>
            <button
              type="button"
              disabled={isSending}
              className="rounded-full border border-[#b5d1c5] bg-[#e8f5ee] px-4 py-2 text-sm font-black text-[#123f39] hover:bg-[#d9eae1] disabled:opacity-50"
              onClick={() => setQuestion(selectedMode.example)}
            >
              استخدم سؤالًا مقترحًا
            </button>
          </div>

          {turns.length > 0 ? (
            <section aria-label="الحوار الحالي" className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-black text-[#123f39]">حوارك مع ضاد</h2>
                <button
                  type="button"
                  disabled={isSending}
                  className="rounded-full border border-[#d8c7a6] px-4 py-2 text-sm font-bold text-[#745a37] hover:bg-[#fff4e3] disabled:opacity-50"
                  onClick={clearVisibleConversation}
                >
                  مسح الحوار المعروض
                </button>
              </div>
              <ol className="space-y-4">
                {turns.map((turn) => (
                  <li
                    key={turn.id}
                    className={[
                      "max-w-[95%] rounded-2xl border p-4 sm:max-w-[88%]",
                      turn.role === "user"
                        ? "mr-auto border-[#d9e6ef] bg-[#f1f7fb]"
                        : "ml-auto border-[#d5e8dd] bg-[#eef8f4]",
                    ].join(" ")}
                  >
                    <p className="text-xs font-black text-[#315b52]">
                      {turn.role === "user" ? "سؤالك" : "ضاد"}
                    </p>
                    <p dir="auto" className="mt-2 whitespace-pre-wrap break-words text-base leading-8 text-[#263f3a]">
                      {turn.content}
                    </p>
                    {turn.role === "assistant" && turn.engine === "local" ? (
                      <p className="mt-2 text-xs text-[#617166]">إجابة من الوضع المحلي على الجهاز؛ قد لا يتوفر فيه محتوى الدرس المنشور للتحقق، فراجعه عند الاتصال.</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <form onSubmit={ask} className="mt-6">
            <label htmlFor="dad-question" className="font-black text-[#123f39]">
              {turns.length ? "اكتب سؤال المتابعة" : "سؤالك"}
            </label>
            <textarea
              id="dad-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={3000}
              placeholder={selectedMode.example}
              className="mt-3 min-h-32 w-full rounded-2xl border border-[#d8c7a6] p-4 text-base outline-none focus:border-[#123f39] focus-visible:ring-2 focus-visible:ring-[#a1cbbc]"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#6b675e]">{question.length} / 3000 حرف</p>
              <button
                type="submit"
                disabled={isSending || !question.trim()}
                className="touch-manipulation rounded-2xl bg-[#123f39] px-7 py-3.5 font-black text-white transition hover:bg-[#1c5c51] active:scale-[0.98] disabled:opacity-50 motion-reduce:transition-none"
              >
                {isSending ? "ضاد يجهز الرد…" : "أرسل إلى ضاد"}
              </button>
            </div>
          </form>

          <div role="status" aria-live="polite">
            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold leading-7 text-rose-800">
                {error}
              </div>
            ) : null}
          </div>
          <aside className="mt-7 rounded-2xl border border-[#e3d4b5] bg-[#fff8e9] p-4 text-sm leading-8 text-[#665a43]">
            <strong>الخصوصية والأمانة التعليمية:</strong> تجنّب إدخال أسماء الأطفال وبياناتهم الصحية أو الأسرية أو المالية.
            تُرسَل الأسئلة إلى خدمة الذكاء الاصطناعي القائمة لإنتاج الرد.
            زر مسح الحوار يزيل المحادثة من هذه الصفحة فقط، وليس من سجلات أي مزوّد خارجي.
            ولا تُعدّ إجابات ضاد درجات أو تشخيصًا نفسيًا أو اعتمادًا لمحتوى رسمي.
          </aside>
        </div>
      </section>
    </main>
  );
}
