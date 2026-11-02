"use client";

import { useState } from "react";
import type { ColoringActivity } from "@/lib/coloring/activities";

type Props = { activity: ColoringActivity; choices: string[] };

export default function ColoringActivityClient({ activity, choices }: Props) {
  const [selected, setSelected] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [reflection, setReflection] = useState("");
  const correct = submitted && selected === activity.word;
  const isPageFromFirstBook = activity.volume === 1;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#d2dfd6] bg-white p-6 sm:p-8">
        <h2 className="text-xl font-black text-[#174f47]">1. اقرأ وتأمل</h2>
        <p className="mt-3 rounded-2xl bg-[#f4f8f1] p-5 text-center text-3xl font-black leading-relaxed text-[#174f47] sm:text-5xl">{activity.word}</p>
        <p className="mt-4 text-base leading-8">{activity.instruction}</p>
        <p className="mt-2 text-sm leading-7 text-[#6b6253]">نفذ التلوين على صفحتك الورقية أولًا، ثم واصل التدريب الرقمي. لا توجد صور رسمية للكتاب الوزاري هنا.</p>
      </section>

      <fieldset className="space-y-4 rounded-3xl border border-[#d2dfd6] bg-white p-6 sm:p-8">
        <legend className="px-2 text-xl font-black text-[#174f47]">2. تعرّف على الكلمة</legend>
        <p className="leading-8">{isPageFromFirstBook ? "اختر الكلمة المكتوبة في أعلى النشاط." : "اختر العبارة المطابقة لموضوع الصفحة."}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {choices.map((word) => (
            <label key={word} className={`flex min-h-14 cursor-pointer items-center gap-2 rounded-xl border p-3 focus-within:outline-2 focus-within:outline-[#174f47] ${selected === word ? "border-[#174f47] bg-[#e5f3eb]" : "border-[#ddd4c1]"}`}>
              <input type="radio" name="coloring-word-choice" checked={selected === word} onChange={() => { setSelected(word); setSubmitted(false); }} className="accent-[#174f47]" />
              <span className="font-semibold">{word}</span>
            </label>
          ))}
        </div>
        <button type="button" disabled={!selected || submitted} onClick={() => setSubmitted(true)} className="rounded-xl bg-[#174f47] px-6 py-3 font-black text-white disabled:opacity-50">تحقق من إجابتي</button>
        <div aria-live="polite">
          {submitted && <p role="status" className={`rounded-xl p-3 leading-8 ${correct ? "bg-[#e5f6e7] text-[#21552e]" : "bg-[#fff1dd] text-[#744919]"}`}>
            {correct ? "إجابة صحيحة! أعد قراءة العبارة بصوت واضح." : "حاول مرة أخرى. قارن بين الخيارات والكلمة في أعلى الصفحة."}
          </p>}
        </div>
      </fieldset>

      <section className="rounded-3xl border border-[#d2dfd6] bg-white p-6 sm:p-8">
        <h2 className="text-xl font-black text-[#174f47]">3. تحدث ثم اكتب</h2>
        <p className="mt-3 text-base leading-8">{activity.question}</p>
        <label htmlFor="coloring-reflection" className="mt-4 block text-sm font-bold">اكتب إجابتك أو أخبر بها شخصًا بالغًا</label>
        <textarea id="coloring-reflection" dir="rtl" rows={3} maxLength={500} value={reflection} onChange={e => setReflection(e.target.value)}
          className="mt-2 w-full rounded-xl border border-[#bdd1c2] bg-[#fffef9] p-4 leading-8 focus-visible:outline-2 focus-visible:outline-[#174f47]" placeholder="إجابتي..." />
        <p className="mt-2 text-xs leading-7 text-[#716451]">إجابة التعبير الحر لا تُصحَّح آليًا. النص يبقى في الصفحة على جهازك فقط، ولا يُرسل للخادم أو يُخزَّن في حساب الطفل.</p>
      </section>
    </div>
  );
}
