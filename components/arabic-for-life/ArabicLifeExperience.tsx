"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ARABIC_LIFE_UNITS,
  type ArabicLifeQuestion,
  type ArabicLifeUnit,
} from "@/lib/arabic-for-life/units";

function PracticeQuestion({
  question,
  onAttempt,
}: {
  question: ArabicLifeQuestion;
  onAttempt: (questionId: string) => void;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const correct = checked && choice === question.correctIndex;

  return (
    <fieldset className="space-y-3 rounded-2xl border border-[#e4d6bb] bg-white p-5">
      <legend className="px-2 text-base font-black text-[#174f47]">{question.prompt}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {question.choices.map((option, index) => (
          <label key={option} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm leading-7 focus-within:ring-2 focus-within:ring-[#174f47] ${choice === index ? "border-[#174f47] bg-[#e7f3ed]" : "border-[#e5d8bf] bg-[#fffdf8]"}`}>
            <input
              type="radio"
              name={question.id}
              value={index}
              checked={choice === index}
              onChange={() => { setChoice(index); setChecked(false); }}
              className="accent-[#174f47]"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={choice === null || checked}
          onClick={() => { setChecked(true); onAttempt(question.id); }}
          className="rounded-xl bg-[#174f47] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          تحقق من الإجابة
        </button>
        <button
          type="button"
          aria-expanded={showHint}
          onClick={() => setShowHint((current) => !current)}
          className="rounded-xl border border-[#c6b68d] px-4 py-2.5 text-sm font-bold text-[#72551c]"
        >
          {showHint ? "إخفاء التلميح" : "أحتاج تلميحًا"}
        </button>
      </div>
      {showHint && <p className="rounded-lg bg-[#fff4d9] p-3 text-sm leading-7 text-[#614919]">{question.hint}</p>}
      <div aria-live="polite" aria-atomic="true">
        {checked && (
          <p role="status" className={`rounded-lg p-3 text-sm font-bold leading-7 ${correct ? "bg-[#e8f5e8] text-[#20512b]" : "bg-[#fff1e3] text-[#7c3b1e]"}`}>
            {correct ? "إجابة صحيحة! " : "حاول مجددًا. "}
            {correct ? question.explanation : "اقرأ التلميح أو راجع الحوار، ثم اختر إجابة أخرى."}
          </p>
        )}
      </div>
    </fieldset>
  );
}

function UnitPractice({
  unit,
  onAttempt,
  attempted,
}: {
  unit: ArabicLifeUnit;
  onAttempt: (id: string) => void;
  attempted: Record<string, boolean>;
}) {
  const [draft, setDraft] = useState("");
  const count = unit.questions.filter((question) => attempted[question.id]).length;

  return (
    <div className="space-y-7" aria-labelledby="unit-title">
      <header className="rounded-3xl border border-[#dcd2b7] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs font-black text-[#6b5d45]">
          <span className="rounded-full bg-[#e7f3ed] px-3 py-1.5">{unit.indicativeLevel} استرشادي</span>
          <span>{unit.durationMinutes} دقيقة مقترحة</span>
          <span>· {unit.context}</span>
        </div>
        <h2 id="unit-title" className="mt-3 font-arabic-display text-2xl font-black text-[#174f47]">{unit.title}</h2>
        <p className="mt-3 leading-8"><strong>الهدف:</strong> {unit.outcome}</p>
      </header>

      <section aria-labelledby="dialogue-heading" className="rounded-3xl border border-[#dcd2b7] bg-white p-5 sm:p-7">
        <h3 id="dialogue-heading" className="font-arabic-display text-xl font-black text-[#174f47]">1. اقرأ الحوار ومثّله</h3>
        <p className="mt-2 text-sm leading-7 text-[#6b5d45]">اقرأ الحوار بصوتك أو مع زميل. النص بديل متاح حتى من دون صوت أو ميكروفون.</p>
        <ol className="mt-5 space-y-3">
          {unit.dialogue.map((line, index) => (
            <li key={`${index}-${line.speaker}`} className={`max-w-2xl rounded-2xl p-4 ${index % 2 ? "mr-auto bg-[#f8f0dd]" : "ml-auto bg-[#e7f3ed]"}`}>
              <span className="block text-xs font-black text-[#705a2c]">{line.speaker}</span>
              <p className="mt-1 text-base leading-8">{line.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="words-heading" className="rounded-3xl border border-[#dcd2b7] bg-white p-5 sm:p-7">
        <h3 id="words-heading" className="font-arabic-display text-xl font-black text-[#174f47]">2. كلمات في سياقها</h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          {unit.vocabulary.map((word) => (
            <div key={word.term} className="rounded-xl bg-[#f8f5ec] p-4">
              <dt className="font-black text-[#174f47]">{word.term}</dt>
              <dd className="mt-2 text-sm leading-7">{word.meaning}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="quiz-heading" className="space-y-4">
        <div>
          <h3 id="quiz-heading" className="font-arabic-display text-xl font-black text-[#174f47]">3. اختبر فهمك</h3>
          <p className="mt-1 text-sm text-[#6b5d45]" aria-live="polite">جربت {count} من {unit.questions.length} أسئلة. هذا تدريب غير معتمد ولا يسجل درجة مدرسية.</p>
        </div>
        {unit.questions.map((question) => (
          <PracticeQuestion key={question.id} question={question} onAttempt={onAttempt} />
        ))}
      </section>

      <section aria-labelledby="speaking-heading" className="rounded-3xl border border-[#dcd2b7] bg-white p-5 sm:p-7">
        <h3 id="speaking-heading" className="font-arabic-display text-xl font-black text-[#174f47]">4. تحدث بالعربية</h3>
        <p className="mt-3 rounded-xl bg-[#e7f3ed] p-4 leading-8"><strong>مع دعم:</strong> {unit.guidedRoleplay}</p>
        <p className="mt-3 rounded-xl bg-[#f8f0dd] p-4 leading-8"><strong>تحدٍ إضافي:</strong> {unit.independentRoleplay}</p>
        <p className="mt-3 text-sm leading-7 text-[#6b5d45]">يمكن للمعلم أو زميل التحقق من وضوح التحدث. لا يسجل هذا النشاط صوتًا ولا يدّعي قياس النطق آليًا.</p>
      </section>

      <section aria-labelledby="writing-heading" className="rounded-3xl border border-[#dcd2b7] bg-white p-5 sm:p-7">
        <h3 id="writing-heading" className="font-arabic-display text-xl font-black text-[#174f47]">5. اكتب من واقعك</h3>
        <p className="mt-2 leading-8">{unit.writingTask}</p>
        <label htmlFor="arabic-life-writing" className="mt-4 block text-sm font-bold text-[#174f47]">مساحة للتدريب الحر (من دون تصحيح تلقائي)</label>
        <textarea
          id="arabic-life-writing"
          dir="rtl"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="اكتب جملك هنا..."
          className="mt-2 w-full rounded-xl border border-[#bbd1c2] bg-[#fffef9] p-4 leading-8 focus-visible:outline-2 focus-visible:outline-[#174f47]"
        />
        <p className="mt-2 text-xs leading-6 text-[#6b5d45]">تبقى المسودة في هذه الصفحة فقط؛ لا تُرسل إلى خادم ضاديوم ولا تُحفظ في حسابك. راجعها مع المعلم أو أحد الوالدين.</p>
      </section>
    </div>
  );
}

export default function ArabicLifeExperience() {
  const [activeId, setActiveId] = useState(ARABIC_LIFE_UNITS[0].id);
  const [attempted, setAttempted] = useState<Record<string, boolean>>({});
  const activeUnit = ARABIC_LIFE_UNITS.find((unit) => unit.id === activeId) ?? ARABIC_LIFE_UNITS[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <section className="rounded-[2rem] bg-gradient-to-l from-[#123f39] to-[#237367] p-7 text-white sm:p-10">
        <p className="font-bold text-[#f5cf7a]">مسار إثرائي مجاني أصلي من ضاديوم</p>
        <h1 className="mt-3 font-arabic-display text-3xl font-black leading-snug sm:text-5xl">العربية للحياة — Arabic for Life</h1>
        <p className="mt-4 max-w-3xl text-lg leading-9 text-[#edf6f1]">تعلّم الفصحى المعاصرة عبر مواقف يومية: اقرأ الحوار، افهم معناه، تدرّب على التحدث، واكتب ردّك بطريقتك.</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#e9ede7]">هذه وحدات تجريبية مناسبة مبدئيًا لمستوى المبتدئين؛ تسميات A1 وA1–A2 استرشادية فقط وليست اعتمادًا من CEFR أو ACTFL، ولا تحل محل المناهج الوزارية.</p>
      </section>

      <section aria-labelledby="choose-unit" className="space-y-4">
        <h2 id="choose-unit" className="font-arabic-display text-xl font-black text-[#174f47]">اختر موقفًا وابدأ التعلّم</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {ARABIC_LIFE_UNITS.map((unit, index) => (
            <button
              key={unit.id}
              type="button"
              aria-pressed={unit.id === activeId}
              onClick={() => setActiveId(unit.id)}
              className={`min-h-32 rounded-2xl border p-5 text-right focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174f47] ${unit.id === activeId ? "border-[#174f47] bg-[#e3f1e9] shadow-md" : "border-[#ded2b8] bg-white hover:bg-[#faf6e9]"}`}
            >
              <span className="block text-xs font-bold text-[#756445]">الوحدة {index + 1} · {unit.indicativeLevel}</span>
              <span className="mt-2 block font-arabic-display text-lg font-black text-[#174f47]">{unit.title}</span>
              <span className="mt-1 block text-sm text-[#5c675f]">{unit.context}</span>
            </button>
          ))}
        </div>
      </section>

      <UnitPractice
        key={activeUnit.id}
        unit={activeUnit}
        attempted={attempted}
        onAttempt={(id) => setAttempted((previous) => previous[id] ? previous : { ...previous, [id]: true })}
      />

      <aside className="rounded-2xl border border-[#d9c8a2] bg-[#fff7e3] p-5 text-sm leading-8 text-[#6b5430]">
        <strong>حدود التجربة:</strong> أسئلة الفهم هنا موجهة للتعلم الذاتي، ولا تمنح شهادة أو درجة إتقان رسمية. الاستماع والنطق يحتاجان ملفات صوتية عربية محكّمة وتقييمًا متخصصًا قبل إضافتهما بوصفهما مهارتين مقاستين. لا توجد متابعة مستمرة للتقدم في هذه النسخة.
      </aside>
      <nav aria-label="خطوات التعلم الأخرى" className="flex flex-wrap gap-3">
        <Link href="/level-check" className="rounded-xl border border-[#c9b88e] px-5 py-3 font-bold text-[#174f47] hover:bg-white">اختبار بداية استرشادي</Link>
        <Link href="/courses/rooms/non-native" className="rounded-xl border border-[#c9b88e] px-5 py-3 font-bold text-[#174f47] hover:bg-white">مسار العربية لغير الناطقين بها</Link>
        <Link href="/courses" className="rounded-xl border border-[#c9b88e] px-5 py-3 font-bold text-[#174f47] hover:bg-white">المناهج المدرسية</Link>
      </nav>
    </div>
  );
}
