"use client";

import { useState } from "react";
import {
  checkMaslowAnswer,
  findMaslowLevel,
  MASLOW_LEVELS,
  MASLOW_SITUATIONS,
  type NeedId,
} from "@/lib/maslow-lab/content";

const frame = "rounded-[2rem] border border-[#dfcfad] bg-white p-5 shadow-sm sm:p-8";

export default function MaslowLabClient() {
  const [selectedId, setSelectedId] = useState<NeedId>("physiological");
  const [situationIndex, setSituationIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<NeedId | null>(null);
  const [showTeacher, setShowTeacher] = useState(false);

  const active = findMaslowLevel(selectedId);
  const situation = MASLOW_SITUATIONS[situationIndex];
  const checked = selectedAnswer ? checkMaslowAnswer(situation.id, selectedAnswer) : null;
  const correctNeed = findMaslowLevel(situation.correctId);

  function nextSituation() {
    setSelectedAnswer(null);
    setSituationIndex((index) => (index + 1) % MASLOW_SITUATIONS.length);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <section className="relative overflow-hidden rounded-[2.5rem] bg-[#123f39] p-7 text-white shadow-lg sm:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-15 dad-arabesque" />
        <div className="relative">
          <p className="text-sm font-bold text-[#f9d991]">ضاديوم · تعلّم العربية والحياة</p>
          <h1 className="mt-3 font-arabic-display text-3xl font-black leading-tight sm:text-5xl">
            هرم ماسلو: ماذا يحتاج الإنسان كي ينمو ويتعلّم؟
          </h1>
          <p className="mt-4 max-w-3xl font-arabic-reading text-lg leading-9 text-[#e5efeb]">
            اختر جزءًا من الهرم لتتعرف إلى معناه، ثم طبّق ما تعلمته على مواقف مدرسية واكتب جملًا عربية من أفكارك.
          </p>
        </div>
      </section>

      <section className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={frame}>
          <div className="mb-4">
            <h2 className="font-arabic-display text-2xl font-black text-[#123f39]">
              تعرّف إلى الاحتياجات الخمسة
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#655f55]">
              الألوان للتوضيح فقط. اضغط على أي مستوى؛ ترتيب الهرم تمثيل تعليمي وليس حكمًا بأن كل الناس يمرون بالمستويات بالترتيب نفسه.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2.5" aria-label="مستويات هرم ماسلو من الأعلى إلى القاعدة">
            {MASLOW_LEVELS.map((need) => (
              <button
                key={need.id}
                type="button"
                aria-pressed={selectedId === need.id}
                onClick={() => setSelectedId(need.id)}
                className={[
                  "flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 text-center text-base font-black shadow-sm transition focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#123f39] motion-reduce:transition-none",
                  need.colorClass,
                  need.widthClass,
                  selectedId === need.id ? "ring-4 ring-[#174f47]/25" : "hover:brightness-95",
                ].join(" ")}
              >
                <span aria-hidden="true" className="text-2xl">{need.icon}</span>
                <span>{need.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-5 rounded-xl bg-[#f4eee2] p-3 text-xs leading-6 text-[#5e5547]">
            تنبيه: الاحتياجات قد تتزامن وتتأثر بالثقافة والظروف الفردية، فلا نستخدم الهرم لتصنيف الطلاب أو تشخيص أحوالهم.
          </p>
        </div>

        <section className={frame} aria-labelledby="active-need-title" aria-live="polite">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="text-4xl">{active.icon}</span>
            <h2 id="active-need-title" className="font-arabic-display text-2xl font-black text-[#123f39]">{active.label}</h2>
          </div>
          <p className="text-lg leading-9 text-[#514b42]">{active.summary}</p>
          <h3 className="mt-5 text-base font-black text-[#174f47]">أمثلة</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {active.examples.map((word) => (
              <li key={word} className="rounded-full bg-[#eaf3ed] px-4 py-2 text-sm font-bold text-[#18584c]">{word}</li>
            ))}
          </ul>
          <h3 className="mt-6 text-base font-black text-[#174f47]">في موقف تعليمي</h3>
          <p className="mt-2 rounded-2xl bg-[#fff5e0] p-4 leading-8 text-[#5d5039]">{active.learningContext}</p>
          <h3 className="mt-6 text-base font-black text-[#174f47]">تحدّي التعبير الكتابي ✍️</h3>
          <p className="mt-2 leading-8 text-[#514b42]">{active.writingPrompt}</p>
          <button
            type="button"
            className="mt-5 rounded-2xl border border-[#94b8a9] bg-[#eaf5f0] px-5 py-3 text-sm font-black text-[#123f39] focus-visible:outline-4 focus-visible:outline-[#a0c6b6]"
            aria-expanded={showTeacher}
            aria-controls="teacher-help"
            onClick={() => setShowTeacher((value) => !value)}
          >
            {showTeacher ? "إخفاء إرشاد المعلم" : "إظهار إرشاد المعلم"}
          </button>
          {showTeacher ? (
            <div id="teacher-help" className="mt-4 rounded-2xl border border-[#d4c29e] bg-[#fffaf0] p-4 text-sm leading-8">
              {active.teacherAction}
            </div>
          ) : null}
        </section>
      </section>

      <section className={frame}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-arabic-display text-2xl font-black text-[#123f39]">جرّب فهم المواقف</h2>
            <p className="mt-2 text-sm leading-7 text-[#655f55]">أمثلة افتراضية للتعلّم، وليس اختبارًا نفسيًا أو درجة مدرسية.</p>
          </div>
          <span className="rounded-full bg-[#e7f2ed] px-4 py-2 text-sm font-bold text-[#174f47]">
            موقف {situationIndex + 1} من {MASLOW_SITUATIONS.length}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-[#dfcfad] bg-[#fff7e7] p-5">
          <p className="text-lg font-bold leading-9 text-[#484237]" aria-live="polite">{situation.text}</p>
          <p className="mt-2 text-sm text-[#615847]">ما الاحتياج الأقرب إلى هذا الموقف؟</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="خيارات المستوى المناسب">
          {MASLOW_LEVELS.map((need) => (
            <button
              key={need.id}
              type="button"
              disabled={selectedAnswer !== null}
              aria-pressed={selectedAnswer === need.id}
              onClick={() => setSelectedAnswer(need.id)}
              className={[
                "rounded-xl border-2 px-4 py-3 text-right text-sm font-black transition focus-visible:outline-4 focus-visible:outline-[#123f39] disabled:cursor-default motion-reduce:transition-none",
                selectedAnswer === need.id ? "border-[#123f39] bg-[#d9ece4] text-[#123f39]" : "border-[#ded4c0] bg-[#fffdf7] text-[#514a40] enabled:hover:border-[#4c8c78]",
              ].join(" ")}
            >
              {need.icon} {need.label}
            </button>
          ))}
        </div>
        {selectedAnswer !== null && checked ? (
          <div role="status" aria-live="polite" className="mt-5 rounded-2xl border border-[#bfcebd] bg-[#f0f6ed] p-5 text-[#233b31]">
            <p className="font-black">{checked.correct ? "أحسنت، اختيار مناسب!" : `الأقرب في هذا المثال: ${correctNeed.label}`}</p>
            <p className="mt-2 leading-8">{checked.explanation}</p>
            <button
              type="button"
              onClick={nextSituation}
              className="mt-4 rounded-xl bg-[#123f39] px-5 py-3 text-sm font-black text-white focus-visible:outline-4 focus-visible:outline-[#c0dcd2]"
            >
              {situationIndex === MASLOW_SITUATIONS.length - 1 ? "ابدأ مواقف جديدة" : "الموقف التالي"}
            </button>
          </div>
        ) : null}
      </section>

      <aside className="rounded-[2rem] border border-[#dfc694] bg-[#fff5df] p-5 leading-8 text-[#5b4f3b] sm:p-7">
        <h2 className="text-lg font-black">تذكر</h2>
        <p className="mt-2">
          نموذج ماسلو أداة للمناقشة والفهم، لا قاعدة علمية صارمة لترتيب كل احتياجات البشر.
          لا تشارك تفاصيل خاصة عن صحتك أو أسرتك أو ظروفك في هذا النشاط. إذا لم تشعر بالأمان في المدرسة، فتحدث إلى معلم أو مسؤول موثوق.
        </p>
        <p className="mt-3 text-sm font-bold">اللغة العربية أسهل في ضاديوم.</p>
      </aside>
    </div>
  );
}
