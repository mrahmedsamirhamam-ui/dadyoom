"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { assessGuestAnswer, guestLesson, guestQuestions } from "@/lib/growth/guest-trial";

export default function GuestLessonPage() {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [checkPassed, setCheckPassed] = useState<boolean | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const finished = index >= guestQuestions.length;
  const current = guestQuestions[Math.min(index, guestQuestions.length - 1)];
  const correct = choice !== null && assessGuestAnswer(current, choice);

  useEffect(() => {
    if (started) headingRef.current?.focus();
  }, [started, index]);

  function next() {
    if (!checked || !choice || finished) return;
    if (correct) setCorrectCount((count) => count + 1);
    if (current.phase === "check") setCheckPassed(correct);
    setIndex((value) => value + 1);
    setChoice(null);
    setChecked(false);
  }

  function restart() {
    setStarted(false);
    setIndex(0);
    setChoice(null);
    setChecked(false);
    setCorrectCount(0);
    setCheckPassed(null);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7faf8] px-4 pb-[calc(11rem+env(safe-area-inset-bottom,0px))] pt-8 text-[#173f35] sm:pt-14">
      <div className="mx-auto max-w-xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="min-h-11 font-black text-[#174f47] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">
            ضاديوم — بيت العربية الرقمي
          </Link>
          <Link href="/login" className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-[#bfd7cb] px-4 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2">
            لديّ حساب
          </Link>
        </header>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#dfdac7] bg-white shadow-xl">
          <div className="bg-[#123f39] p-6 text-white sm:p-8">
            <p className="text-sm font-bold text-[#f5cf7a]">تجربة ضاديوم المفتوحة — دون تسجيل</p>
            <h1 className="mt-3 text-3xl font-black">تعلّم كيف تميّز الفعل</h1>
            <p className="mt-3 text-base leading-8 text-white/90">
              شرح قصير، ثم تطبيقان موجّهان وسؤال جديد للتحقق. تدريب أصلي، وليس درسًا وزاريًا معتمدًا.
            </p>
            <div
              role="progressbar"
              aria-label="تقدم التجربة"
              aria-valuemin={0}
              aria-valuemax={guestQuestions.length}
              aria-valuenow={Math.min(index, guestQuestions.length)}
              className="mt-5 h-2 overflow-hidden rounded-full bg-white/20"
            >
              <div className="h-full bg-[#f5cf7a] transition-all" style={{ width: `${(Math.min(index, guestQuestions.length) / guestQuestions.length) * 100}%` }} />
            </div>
          </div>

          {!started ? (
            <section className="p-6 sm:p-8" aria-labelledby="guest-intro-title">
              <h2 id="guest-intro-title" className="text-2xl font-black leading-10">قبل أن نبدأ</h2>
              <dl className="mt-5 space-y-4 text-base leading-8">
                <div>
                  <dt className="font-black text-[#123f39]">هدفي اليوم</dt>
                  <dd>{guestLesson.objective}</dd>
                </div>
                <div>
                  <dt className="font-black text-[#123f39]">ما أحتاج معرفته</dt>
                  <dd>{guestLesson.prerequisite}</dd>
                </div>
                <div>
                  <dt className="font-black text-[#123f39]">أفهم الفكرة</dt>
                  <dd>{guestLesson.explanation}</dd>
                </div>
                <div className="rounded-2xl bg-[#f6f1e7] p-4">
                  <dt className="font-black text-[#123f39]">مثال محلول</dt>
                  <dd>{guestLesson.workedExample}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="mt-7 min-h-12 w-full rounded-xl bg-[#174d44] px-5 py-3 font-black text-white hover:bg-[#103f39] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174d44]"
              >
                ابدأ التطبيق
              </button>
            </section>
          ) : finished ? (
            <section className="p-6 sm:p-8" aria-labelledby="guest-finish-title">
              <h2 id="guest-finish-title" ref={headingRef} tabIndex={-1} className="text-2xl font-black leading-10 focus:outline-none">
                أنهيت التجربة القصيرة
              </h2>
              <p className="mt-3 leading-8">
                الإجابات الصحيحة في هذه المحاولة: {correctCount} من أصل {guestQuestions.length} أسئلة.
              </p>
              <p className="mt-3 rounded-2xl bg-[#f6f1e7] p-4 leading-8">
                {checkPassed
                  ? "نجحت في سؤال التحقق الجديد. هذه إشارة أولية للفهم، وليست حكمًا نهائيًا بإتقان المهارة."
                  : "سؤال التحقق الجديد يحتاج مراجعة. يمكنك قراءة المثال مرة أخرى ثم إعادة التدريب دون ضغط."}
              </p>
              <p className="mt-4 leading-8">{guestLesson.review}</p>
              <p className="mt-3 text-sm leading-7 text-[#52685b]">
                لا تحفظ هذه التجربة اسمك أو إجاباتك أو درجتك. لإنجاز دروس متتابعة وحفظ التقدم القادم، يمكنك إنشاء حساب.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={restart}
                  className="min-h-12 rounded-xl border border-[#bfd7cb] bg-white px-5 py-3 text-center font-black focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  راجع المثال وأعد التدريب
                </button>
                <Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#174d44] px-5 py-3 text-center font-black text-white focus-visible:outline-2 focus-visible:outline-offset-2">
                  أنشئ حسابًا لحفظ تقدمك القادم
                </Link>
              </div>
            </section>
          ) : (
            <section className="p-6 sm:p-8" aria-labelledby="guest-question-title">
              <p className="text-sm font-bold text-[#72551c]">
                {current.phase === "check" ? "تحقق جديد بعد التطبيق" : "تطبيق موجّه"} — سؤال {index + 1} من {guestQuestions.length}
              </p>
              <h2 id="guest-question-title" ref={headingRef} tabIndex={-1} className="mt-3 text-xl font-black leading-9 focus:outline-none">
                {current.prompt}
              </h2>
              <div className="mt-5 grid gap-3" role="group" aria-label="اختر إجابة السؤال">
                {current.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={checked}
                    aria-pressed={choice === option}
                    onClick={() => setChoice(option)}
                    className={`min-h-14 rounded-xl border px-4 py-3 text-right text-base font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174d44] disabled:cursor-default ${choice === option
                      ? "border-[#174d44] bg-[#e7f4ec]"
                      : "border-[#d8e4da] bg-white hover:bg-[#f3faf5]"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {checked ? (
                <div role="status" aria-live="polite" className="mt-5 rounded-xl bg-[#f6f1e7] p-4">
                  <p className="font-black">{correct ? "إجابة صحيحة!" : "هذه الإجابة تحتاج مراجعة."}</p>
                  {!correct ? <p className="mt-2 font-bold">الإجابة الصحيحة: {current.answer}</p> : null}
                  <p className="mt-2 text-base leading-8">{current.explanation}</p>
                </div>
              ) : null}
              <button
                type="button"
                disabled={!choice}
                onClick={checked ? next : () => setChecked(true)}
                className="mt-6 min-h-12 w-full rounded-xl bg-[#174d44] px-5 py-3 text-base font-black text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174d44] disabled:opacity-50"
              >
                {checked ? (index + 1 === guestQuestions.length ? "اعرض ملخص التجربة" : "السؤال التالي") : "تحقق من إجابتي"}
              </button>
            </section>
          )}
        </div>
        <p className="mt-5 text-center text-sm leading-7 text-[#52685b]">
          تجربة تعليمية عامة دون طلب بيانات طفل أو تسجيل نتائج شخصية
        </p>
      </div>
    </main>
  );
}
