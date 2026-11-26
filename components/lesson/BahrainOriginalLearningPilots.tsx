"use client";

import Link from "next/link";
import { useState } from "react";
import { originalBahrainPilots } from "@/lib/lesson-learning/original-bahrain-pilots";

export default function BahrainOriginalLearningPilots() {
  const [active, setActive] = useState(0);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [firstTryCorrect, setFirstTryCorrect] = useState<Record<string, boolean>>({});
  const [writing, setWriting] = useState("");
  const lesson = originalBahrainPilots[active];
  const completed = index >= lesson.questions.length;
  const question = completed ? null : lesson.questions[index];
  const correct = question && selected === question.correctIndex;
  const score = lesson.questions.filter((q) => firstTryCorrect[q.id]).length;

  function changeLesson(next: number) {
    setActive(next);
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setFirstTryCorrect({});
    setWriting("");
  }

  function verify() {
    if (!question || selected === null || checked) return;
    setFirstTryCorrect((old) => ({
      ...old,
      [question.id]: Object.hasOwn(old, question.id) ? old[question.id] : selected === question.correctIndex,
    }));
    setChecked(true);
  }

  function nextQuestion() {
    setIndex((i) => i + 1);
    setSelected(null);
    setChecked(false);
  }

  return (
    <div dir="rtl" className="mx-auto max-w-5xl space-y-6 px-4 py-9 text-[#173f38]">
      <div className="rounded-3xl bg-[#123f39] p-6 text-white sm:p-9">
        <p className="text-sm font-bold text-[#ead39d]">مختبر ضاديوم التعليمي • تجربة محدودة</p>
        <h1 className="mt-3 text-3xl font-black leading-relaxed">اكتشف بنفسك، جرّب، ثم افهم لماذا</h1>
        <p className="mt-3 max-w-3xl text-base leading-8">
          ثلاث تجارب أصلية لدعم اللغة العربية بالصف السادس في البحرين. لا ننقل نصوص الكتب،
          ولا نعدّ هذه الأسئلة امتحانًا رسميًا أو إثباتًا لإتقان المنهج.
        </p>
      </div>
      <nav aria-label="اختر تجربة تعلم" className="grid gap-3 md:grid-cols-3">
        {originalBahrainPilots.map((option, optionIndex) => (
          <button key={option.id} type="button" aria-pressed={active === optionIndex}
            onClick={() => changeLesson(optionIndex)}
            className={"min-h-24 rounded-2xl border-2 p-4 text-right font-bold leading-7 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#d6a457] " +
              (active === optionIndex ? "border-[#176c60] bg-[#e0f1ea]" : "border-[#ded4bf] bg-white hover:border-[#7fb5a5]")}>
            <span className="block text-xs text-[#4b7268]">{option.domain}</span>
            {option.title}
          </button>
        ))}
      </nav>
      <section aria-label="تجربة التعلم" className="space-y-6 rounded-3xl border border-[#dfd0ad] bg-[#fffdf7] p-5 sm:p-8">
        <div className="space-y-3">
          <p className="text-sm font-bold text-[#805a25]">{lesson.grade} • {lesson.domain}</p>
          <h2 className="text-2xl font-black">{lesson.title}</h2>
          <p className="leading-8">{lesson.introduction}</p>
          <p className="text-sm leading-7 text-[#466e60]">{lesson.sourceNote}</p>
          <div className="rounded-2xl border border-[#b4d6c9] bg-white p-4">
            <p className="font-bold">سأستطيع بعد التعلم:</p>
            <ul className="mr-6 mt-2 list-disc space-y-1 leading-7">
              {lesson.objectives.map((goal) => <li key={goal}>{goal}</li>)}
            </ul>
          </div>
        </div>
        {question ? (
          <div className="space-y-4 rounded-2xl bg-[#eff7f0] p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 text-sm font-bold">
              <span>المهمة {index + 1} من {lesson.questions.length} — {question.skill}</span>
              <span>تجربة تدريبية</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white" role="progressbar"
              aria-label="تقدم المهام" aria-valuemin={0} aria-valuemax={lesson.questions.length}
              aria-valuenow={index}>
              <div className="h-full rounded-full bg-[#18806e]" style={{ width: (index / lesson.questions.length) * 100 + "%" }} />
            </div>
            <h3 className="text-xl font-black leading-9">{question.prompt}</h3>
            <div role="group" aria-label="اختر إجابة واحدة" className="space-y-3">
              {question.choices.map((choice, choiceIndex) => (
                <button key={choice} type="button" disabled={checked} aria-pressed={selected === choiceIndex}
                  onClick={() => setSelected(choiceIndex)}
                  className={"block min-h-12 w-full rounded-xl border-2 p-3 text-right font-semibold leading-7 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#d6a457] " +
                    (selected === choiceIndex ? "border-[#187767] bg-white" : "border-[#d5e4d8] bg-[#fbfefb]")}>
                  {choice}
                </button>
              ))}
            </div>
            {!checked ? (
              <button type="button" onClick={verify} disabled={selected === null}
                className="min-h-12 rounded-xl bg-[#126657] px-6 py-3 font-bold text-white disabled:opacity-50">
                تحقق من اختياري
              </button>
            ) : (
              <div role="status" className="space-y-3 rounded-xl border border-[#b4d5c2] bg-white p-4 leading-8">
                <p className="font-black">{correct ? "أحسنت! وصلت إلى الفكرة." : "هذه محاولة مفيدة. إليك مفتاح التفكير:"}</p>
                <p>{correct ? question.why : question.hint}</p>
                {!correct ? <p className="text-sm">الإجابة المناسبة: {question.choices[question.correctIndex]} — {question.why}</p> : null}
                <button type="button" onClick={nextQuestion} className="min-h-11 rounded-lg bg-[#123f39] px-5 py-2 font-bold text-white">
                  {index + 1 === lesson.questions.length ? "اختتم التجربة" : "انتقل إلى المهمة التالية"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl bg-[#e8f3ec] p-5">
            <h3 className="text-xl font-black">اكتملت التجربة!</h3>
            <p className="leading-8">أجبت إجابة صحيحة من المحاولة الأولى في {score} من {lesson.questions.length} مهام.</p>
            <p className="leading-7">هذه نتيجة تدريب محلي، وليست درجة محفوظة في حسابك أو حكمًا بإتقان المنهج.</p>
            <button type="button" onClick={() => changeLesson(active)}
              className="min-h-11 rounded-xl bg-[#123f39] px-5 py-3 font-bold text-white">أجرّب مرة أخرى</button>
          </div>
        )}
        <div className="space-y-3 rounded-2xl border border-[#e0c993] bg-white p-5">
          <label htmlFor="pilot-reflection" className="block font-black">تحدي الكتابة والتفكير</label>
          <p className="leading-8">{lesson.creativePrompt}</p>
          <textarea id="pilot-reflection" dir="rtl" rows={4} maxLength={1500} value={writing}
            onChange={(event) => setWriting(event.target.value)}
            className="w-full rounded-xl border border-[#97bcb1] p-3 leading-8 focus-visible:outline-2 focus-visible:outline-[#126657]"
            placeholder="اكتب رأيك أو جملتك، وناقشها مع المعلم أو قارنها بالقواعد." />
          <p className="text-xs leading-6 text-[#526e64]">
            تدريب كتابي مفتوح، لا يُصحح آليًا. لا تُرسل الكتابة للخادم ولا تُحفظ عند تحديث الصفحة.
          </p>
        </div>
      </section>
      <p className="text-sm leading-7 text-[#456d61]">
        مصادر المنهج الرسمية مراجع للتخطيط، وهذه الأنشطة من تأليف ضاديوم وغير معتمدة من وزارة التربية والتعليم.
        <Link href="/courses?country=BH&grade=6" className="mr-2 font-bold underline">العودة إلى فهرس دروس الصف السادس</Link>
      </p>
    </div>
  );
}
