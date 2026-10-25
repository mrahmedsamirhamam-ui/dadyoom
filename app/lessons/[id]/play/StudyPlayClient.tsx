"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { submitStudyPlay } from "@/features/study-play/actions/submitStudyPlay";

export type PlayQuestion = {
  id: string;
  question: string;
  questionOrder: number;
  options: { id: string; text: string }[];
};

type Mode = "review" | "challenge";
type Grade = Awaited<ReturnType<typeof submitStudyPlay>>;

export default function StudyPlayClient({
  lessonId,
  lessonTitle,
  questions,
}: {
  lessonId: string;
  lessonTitle: string;
  questions: PlayQuestion[];
}) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (mode !== "challenge" || grade !== null || isPending) return;
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [mode, grade, isPending]);

  const ordered = mode === "challenge" ? [...questions].reverse() : questions;
  const current = ordered[index];
  const answered = questions.filter((question) => Boolean(answers[question.id])).length;
  const completed = answered === questions.length;

  function restart(nextMode: Mode) {
    setMode(nextMode);
    setAnswers({});
    setGrade(null);
    setIndex(0);
    setSeconds(0);
    setError(null);
  }

  function finish() {
    if (!mode || !completed || isPending || grade) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await submitStudyPlay(
          lessonId,
          mode,
          questions.map((question) => ({
            questionId: question.id,
            optionId: answers[question.id],
          })),
        );
        setGrade(result);
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "تعذر تصحيح النشاط. أعد المحاولة.",
        );
      }
    });
  }

  return (
    <div className="space-y-5">
      <header className="rounded-3xl bg-[#173f38] p-6 text-white shadow-lg">
        <p className="text-sm font-black text-[#f1d68f]">ضاديوم | ذاكر والعب</p>
        <h1 className="mt-2 text-3xl font-black leading-relaxed">{lessonTitle}</h1>
        <p className="mt-2 text-sm leading-7 text-emerald-50">
          أسئلة فعلية من درسِك، وتصحيح محفوظ من الخادم. لا تكرار وهمي للأسئلة ولا إجابات مكشوفة.
        </p>
        <Link
          href={"/lessons/" + lessonId}
          className="mt-4 inline-flex rounded-xl border border-white/40 px-4 py-2 font-bold text-white"
        >
          العودة إلى الدرس
        </Link>
      </header>

      {mode === null ? (
        <section className="grid gap-4 md:grid-cols-2" aria-label="اختر طريقة المراجعة">
          <button
            type="button"
            onClick={() => restart("review")}
            className="rounded-3xl border border-[#d7c6a1] bg-white p-7 text-right shadow-sm focus-visible:outline-4 focus-visible:outline-emerald-600"
          >
            <span className="text-4xl" aria-hidden="true">📚</span>
            <h2 className="mt-3 text-2xl font-black text-[#173f38]">مراجعة ذكية</h2>
            <p className="mt-2 leading-7 text-slate-700">
              راجع كل سؤال بهدوء وتقدم خطوة بخطوة حتى تنهي الاختبار.
            </p>
          </button>
          <button
            type="button"
            onClick={() => restart("challenge")}
            className="rounded-3xl border border-[#d7c6a1] bg-white p-7 text-right shadow-sm focus-visible:outline-4 focus-visible:outline-emerald-600"
          >
            <span className="text-4xl" aria-hidden="true">🏁</span>
            <h2 className="mt-3 text-2xl font-black text-[#173f38]">تحدي السرعة</h2>
            <p className="mt-2 leading-7 text-slate-700">
              الأسئلة بترتيب مختلف مع مؤقت لقياس وقتك، دون أن يؤثر الزمن على التصحيح.
            </p>
          </button>
        </section>
      ) : grade ? (
        <section className="rounded-3xl border border-[#d7c6a1] bg-white p-7 text-center shadow-sm" aria-live="polite">
          <span className="text-5xl" aria-hidden="true">{grade.passed ? "🏆" : "💪"}</span>
          <h2 className="mt-4 text-3xl font-black text-[#173f38]">
            {grade.passed ? "أحسنت! أتممت التحدي" : "أكملت المحاولة، واصل التقدم"}
          </h2>
          <p className="mt-3 text-xl font-bold text-[#173f38]">
            نتيجتك {grade.score}% — {grade.correctAnswers} من {grade.totalQuestions} إجابة صحيحة
          </p>
          <p className="mt-2 text-slate-700">
            تم حفظ نتيجتك. درجة النجاح 70%.
            {grade.earnedXp > 0
              ? ` أُضيفت ${grade.earnedXp} نقطة خبرة.`
              : " مكافآت الخبرة متوقفة مؤقتًا لحين تفعيل ضوابط منع التكرار في قاعدة البيانات."}
          </p>
          {mode === "challenge" ? (
            <p className="mt-2 text-sm text-slate-600">مدة التحدي: {Math.floor(seconds / 60)} دقيقة و{seconds % 60} ثانية</p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => restart(mode)}
              className="rounded-xl bg-[#173f38] px-5 py-3 font-bold text-white"
            >
              أعد المحاولة
            </button>
            <Link
              href={"/assessment/" + lessonId}
              className="rounded-xl border border-[#173f38] px-5 py-3 font-bold text-[#173f38]"
            >
              تقييم الدرس
            </Link>
            <Link
              href="/student"
              className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
            >
              لوحة الطالب
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-3xl border border-[#d7c6a1] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-black text-[#173f38]">
                {mode === "review" ? "مراجعة ذكية" : "تحدي السرعة"}
              </p>
              <p className="text-sm font-bold text-slate-700">
                {answered}/{questions.length} مكتمل
                {mode === "challenge" ? " • " + Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0") : ""}
              </p>
            </div>
            <div
              role="progressbar"
              aria-label="تقدم الإجابات"
              aria-valuemin={0}
              aria-valuemax={questions.length}
              aria-valuenow={answered}
              className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200"
            >
              <div
                className="h-full rounded-full bg-emerald-700 transition-all"
                style={{ width: (answered / questions.length) * 100 + "%" }}
              />
            </div>
          </section>
          <section className="rounded-3xl border border-[#d7c6a1] bg-white p-6 shadow-sm">
            <p className="text-sm font-black text-amber-700">السؤال {index + 1} من {questions.length}</p>
            <h2 className="mt-3 text-xl font-black leading-9 text-[#173f38]">{current.question}</h2>
            <div className="mt-5 space-y-3">
              {current.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={answers[current.id] === option.id}
                  disabled={isPending}
                  onClick={() => setAnswers((previous) => ({
                    ...previous,
                    [current.id]: option.id,
                  }))}
                  className={
                    "w-full rounded-2xl border px-5 py-4 text-right font-bold transition-colors focus-visible:outline-4 focus-visible:outline-emerald-700 " +
                    (answers[current.id] === option.id
                      ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-amber-50")
                  }
                >
                  <span className="ml-2" aria-hidden="true">
                    {answers[current.id] === option.id ? "✓" : "○"}
                  </span>
                  {option.text}
                </button>
              ))}
            </div>
            <nav aria-label="التنقل بين الأسئلة" className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={index === 0 || isPending}
                onClick={() => setIndex((previous) => previous - 1)}
                className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-[#173f38] disabled:opacity-40"
              >
                السابق
              </button>
              {index < ordered.length - 1 ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIndex((previous) => previous + 1)}
                  className="rounded-xl bg-[#173f38] px-5 py-3 font-bold text-white disabled:opacity-40"
                >
                  التالي
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!completed || isPending}
                  onClick={finish}
                  className="rounded-xl bg-[#173f38] px-5 py-3 font-bold text-white disabled:opacity-40"
                >
                  {isPending ? "جارٍ التصحيح..." : "صحّح واحفظ"}
                </button>
              )}
            </nav>
          </section>
          {completed && index < ordered.length - 1 ? (
            <button
              type="button"
              onClick={finish}
              disabled={isPending}
              className="w-full rounded-xl bg-emerald-700 px-5 py-4 text-lg font-black text-white disabled:opacity-40"
            >
              {isPending ? "جارٍ التصحيح..." : "إنهاء وتصحيح جميع الإجابات"}
            </button>
          ) : null}
          {error ? (
            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">
              {error}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
