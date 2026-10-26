"use client";

import { useState } from "react";
import Link from "next/link";

import {
  LEVEL_QUESTIONS,
  evaluateLevelCheck,
  getGuidedLearningPlan,
  type LevelSummary,
} from "@/lib/level-check/assessment";

export default function FreeLevelCheck() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<LevelSummary | null>(null);

  const question = LEVEL_QUESTIONS[index];
  const answered = LEVEL_QUESTIONS.filter((item) => Number.isInteger(answers[item.id])).length;
  const progress = Math.round((answered / LEVEL_QUESTIONS.length) * 100);

  function restart() {
    setIndex(0);
    setAnswers({});
    setSummary(null);
  }

  function next() {
    if (!Number.isInteger(answers[question.id])) return;
    if (index < LEVEL_QUESTIONS.length - 1) {
      setIndex((current) => current + 1);
      return;
    }
    if (answered === LEVEL_QUESTIONS.length) {
      setSummary(evaluateLevelCheck(answers));
    }
  }

  if (summary) {
    const learningPlan = getGuidedLearningPlan(summary.focus.skill);
    return (
      <section aria-labelledby="result-heading" className="space-y-6">
        <div className="rounded-[2rem] border border-[#d5c190] bg-white p-6 shadow-sm sm:p-9">
          <p className="text-sm font-black text-[#836023]">النتيجة الاسترشادية</p>
          <h2 id="result-heading" tabIndex={-1} className="mt-2 text-3xl font-black text-[#123f39]">
            {summary.bandLabel}
          </h2>
          <p className="mt-4 text-lg leading-9 text-[#574d43]">
            أجبت إجابة صحيحة عن {summary.correct} من {summary.total} أسئلة ({summary.percent}%). هذه
            مؤشرات أولية لتوجيه التدريب، وليست تحديدًا رسميًا للصف أو المستوى.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {summary.breakdown.map((item) => (
              <div key={item.skill} className="rounded-2xl border border-[#e5d9bd] bg-[#fffaf0] p-4">
                <div className="flex items-center justify-between gap-2 text-sm font-black text-[#163d37]">
                  <span>{item.label}</span>
                  <span>{item.correct} / {item.total}</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#e4dac4]" role="meter" aria-label={item.label} aria-valuenow={item.percent} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-[#188075]" style={{ width: item.percent + "%" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-2xl bg-[#e9f5ef] p-5">
            <h3 className="text-xl font-black text-[#174f47]">خطة تعلم قصيرة: {summary.focus.label}</h3>
            <p className="mt-2 leading-8 text-[#3d5a53]">
              هذه المهارة هي الأقل أداءً في عينة الأسئلة الصغيرة. اتبع الخطوات التالية بالترتيب،
              واختر الصف والمنهج المناسبين لك بنفسك؛ الخطة استرشادية ولا تُحفظ تلقائيًا.
            </p>
            <ol className="mt-4 space-y-3" aria-label="خطوات التدريب المقترحة">
              {learningPlan.map((step, stepIndex) => (
                <li key={step.id} className="flex items-start gap-3 rounded-xl border border-[#c4dcd2] bg-white p-4">
                  <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#174f47] font-black text-white">
                    {stepIndex + 1}
                  </span>
                  <div className="min-w-0">
                    <Link href={step.href} className="font-black text-[#174f47] underline underline-offset-4 hover:text-[#103f39]">
                      {step.title}
                    </Link>
                    <p className="mt-1 text-sm leading-7 text-[#3d5a53]">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-4">
              <Link href="/signup" className="inline-flex rounded-xl border border-[#b3c8b6] bg-white px-5 py-3 font-black text-[#174f47] hover:bg-[#f6faf7]">
                أنشئ حسابًا لاستكشاف أدوات المتابعة
              </Link>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-[#746b60]">
            لا يقيس هذا النشاط الاستماع أو التحدث أو الطلاقة الجهرية، ولا تحفظ نتائجه في حساب الطالب أو لوحة ولي الأمر.
            التقييم المدرسي المعتمد يتطلب اختبارات إضافية ومراجعة معلم.
          </p>
          <button type="button" onClick={restart} className="mt-5 min-h-12 rounded-xl border border-[#c7b58b] px-5 py-3 font-bold text-[#6e5526] hover:bg-[#fff6e4]">
            أعد النشاط من البداية
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="أسئلة تحديد المستوى الاسترشادي" className="rounded-[2rem] border border-[#dfcfad] bg-white p-5 shadow-sm sm:p-9">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-[#e8f4ec] px-4 py-2 text-sm font-black text-[#174f47]">
          {question.skill === "reading" ? "📖 فهم المقروء" : question.skill === "vocabulary" ? "🧠 المفردات" : question.skill === "grammar" ? "✍️ التراكيب النحوية" : "🔤 الإملاء"}
        </span>
        <span className="text-sm font-black text-[#6d6154]">السؤال {index + 1} من {LEVEL_QUESTIONS.length}</span>
      </div>
      <div className="mb-8 h-2.5 overflow-hidden rounded-full bg-[#eee7da]" role="progressbar" aria-label="التقدم في النشاط" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-[#188075] transition-all" style={{ width: progress + "%" }} />
      </div>

      {question.passage ? (
        <div className="mb-6 rounded-2xl border-r-4 border-[#cda856] bg-[#fff8e8] p-5">
          <p className="text-xs font-black text-[#9a7028]">اقرأ النص ثم أجب</p>
          <p className="mt-3 text-lg leading-10 text-[#3b3731]">{question.passage}</p>
        </div>
      ) : null}

      <fieldset>
        <legend className="mb-5 text-xl font-black leading-9 text-[#123f39] sm:text-2xl">{question.prompt}</legend>
        <div className="space-y-3">
          {question.options.map((option, choiceIndex) => {
            const isChecked = answers[question.id] === choiceIndex;
            return (
              <label key={choiceIndex} className={"flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border p-4 text-base font-bold leading-7 transition focus-within:ring-2 focus-within:ring-[#174f47] " + (isChecked ? "border-[#188075] bg-[#e6f4ef] text-[#123f39]" : "border-[#e2d8c8] bg-[#fffdf9] text-[#3e3833] hover:border-[#c8a562]")}>
                <input
                  type="radio"
                  className="h-5 w-5 shrink-0 accent-[#174f47]"
                  name={question.id}
                  value={choiceIndex}
                  checked={isChecked}
                  onChange={() => setAnswers((old) => ({ ...old, [question.id]: choiceIndex }))}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0} className="min-h-12 rounded-xl border border-[#d7c9ad] px-5 py-3 font-black text-[#675841] disabled:cursor-not-allowed disabled:opacity-40">
          السؤال السابق
        </button>
        <button type="button" onClick={next} disabled={!Number.isInteger(answers[question.id]) || (index === LEVEL_QUESTIONS.length - 1 && answered !== LEVEL_QUESTIONS.length)} className="min-h-12 rounded-xl bg-[#174f47] px-7 py-3 font-black text-white hover:bg-[#103f39] disabled:cursor-not-allowed disabled:opacity-40">
          {index === LEVEL_QUESTIONS.length - 1 ? "اعرض نتيجتي" : "السؤال التالي"}
        </button>
      </div>
      <p className="mt-5 text-center text-xs leading-6 text-[#73695d]">
        اختر إجابة واحدة ثم تابع. يمكنك الرجوع وتغيير إجاباتك قبل عرض النتيجة.
      </p>
    </section>
  );
}
