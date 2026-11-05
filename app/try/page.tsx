"use client";

import Link from "next/link";
import { useState } from "react";
import { assessGuestAnswer, guestQuestions } from "@/lib/growth/guest-trial";

export default function GuestLessonPage() {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const finished = index >= guestQuestions.length;
  const current = guestQuestions[Math.min(index, guestQuestions.length - 1)];
  const correct = choice !== null && assessGuestAnswer(current, choice);

  function next() {
    if (!checked) return;
    if (correct) setCorrectCount((count) => count + 1);
    setIndex((value) => value + 1);
    setChoice(null);
    setChecked(false);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7faf8] px-4 py-8 text-[#173f35] sm:py-14">
      <div className="mx-auto max-w-xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="font-black text-[#174f47] underline-offset-4 hover:underline">
            ضاديوم — بيت العربية الرقمي
          </Link>
          <Link href="/login" className="rounded-xl border border-[#bfd7cb] px-4 py-2 text-sm font-bold">
            لديّ حساب
          </Link>
        </header>
        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#dfdac7] bg-white shadow-xl">
          <div className="bg-[#123f39] p-6 text-white sm:p-8">
            <p className="text-sm font-bold text-[#f5cf7a]">تجربة ضاديوم المفتوحة — دون تسجيل</p>
            <h1 className="mt-3 text-3xl font-black">
              {finished ? "أحسنت! أنهيت تجربتك" : "خطوة صغيرة في العربية"}
            </h1>
            <p className="mt-3 text-sm leading-7 text-white/90">
              {finished
                ? "لقد جربت درسًا قصيرًا. تستطيع الآن اختيار مسارك واستكمال التعلم."
                : "سؤالان متدرجان وشرح واضح عند الخطأ. هذا نموذج تعليمي أصلي، وليس درسًا وزاريًا معتمدًا."}
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
              <div className="h-full bg-[#f5cf7a] transition-all" style={{ width: `${(Math.min(index, guestQuestions.length) / guestQuestions.length) * 100}%` }} />
            </div>
          </div>
          {finished ? (
            <section aria-live="polite" className="p-6 sm:p-8">
              <div className="text-5xl" aria-hidden="true">🏅</div>
              <h2 className="mt-3 text-2xl font-black">إنجاز تجريبي</h2>
              <p className="mt-3 leading-8">أجبت إجابة صحيحة من المحاولة الأولى عن {correctCount} من {guestQuestions.length} سؤالين. المهم أنك تعلمت شيئًا جديدًا.</p>
              <p className="mt-3 text-sm leading-7 text-[#52685b]">
                لا نحفظ بياناتك الشخصية أو نتائج هذه التجربة. أنشئ حسابًا إذا أردت حفظ تقدم دروسك القادمة.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link href="/signup" className="min-h-12 rounded-xl bg-[#174f47] px-5 py-3 text-center font-black text-white">
                  احفظ تقدمك القادم
                </Link>
                <Link href="/courses" className="min-h-12 rounded-xl border border-[#bed6c8] px-5 py-3 text-center font-black">
                  استكشف الدروس
                </Link>
              </div>
            </section>
          ) : (
            <section className="p-6 sm:p-8" aria-labelledby="question-title">
              <p className="text-sm font-bold text-[#907022]">سؤال {index + 1} من {guestQuestions.length}</p>
              <h2 id="question-title" className="mt-3 text-xl font-black leading-9">{current.prompt}</h2>
              <div className="mt-5 grid gap-3" role="group" aria-label="اختر إجابة السؤال">
                {current.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={checked}
                    aria-pressed={choice === option}
                    onClick={() => setChoice(option)}
                    className={`min-h-14 rounded-xl border px-4 py-3 text-right font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174f47] disabled:cursor-default ${choice === option
                      ? "border-[#174f47] bg-[#e7f4ec]"
                      : "border-[#d8e4da] bg-white hover:bg-[#f3faf5]"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {checked ? (
                <div aria-live="polite" className="mt-5 rounded-xl bg-[#f6f1e7] p-4">
                  <p className="font-black">{correct ? "أحسنت، إجابة صحيحة!" : "محاولة جيدة. إليك شرح ضاد المبسط:"}</p>
                  <p className="mt-2 text-sm leading-7">{current.explanation}</p>
                </div>
              ) : null}
              <button
                type="button"
                disabled={!choice}
                onClick={checked ? next : () => setChecked(true)}
                className="mt-6 min-h-12 w-full rounded-xl bg-[#174f47] px-5 py-3 font-black text-white disabled:opacity-50"
              >
                {checked ? (index + 1 === guestQuestions.length ? "أرني إنجازي" : "السؤال التالي") : "تحقق من إجابتي"}
              </button>
            </section>
          )}
        </div>
        <p className="mt-5 text-center text-xs leading-6 text-[#5f7467]">
          تجربة تعليمية قصيرة بلا تتبع إعلاني أو طلب بيانات طفل
        </p>
      </div>
    </main>
  );
}
