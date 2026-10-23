"use client";

import { useState } from "react";
import {
  buildCrossCurricularDraft,
  DEFAULT_FOCUS,
  FOCUS_LABELS,
  type ArabicSkill,
  type StudioFocus,
} from "@/lib/teacher-studio/cross-curricular";

const SKILLS: { value: ArabicSkill; label: string }[] = [
  { value: "grammar", label: "النحو والصرف" },
  { value: "reading", label: "القراءة والفهم" },
  { value: "writing", label: "الكتابة والتعبير" },
  { value: "speaking", label: "التحدث والاستماع" },
];

const FOCUSES: StudioFocus[] = [
  "sustainability",
  "localCitizenship",
  "globalCitizenship",
  "islamicStudies",
];

export default function CrossCurricularStudio() {
  const [lessonTitle, setLessonTitle] = useState("بناء الفعل الماضي");
  const [learningOutcome, setLearningOutcome] = useState(
    "أن يميز المتعلم حالات بناء الفعل الماضي ويوظفها في جمل صحيحة."
  );
  const [grade, setGrade] = useState(6);
  const [country, setCountry] = useState("البحرين");
  const [skill, setSkill] = useState<ArabicSkill>("grammar");
  const [focus, setFocus] = useState({ ...DEFAULT_FOCUS });
  const [draft, setDraft] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [message, setMessage] = useState("");

  function invalidate() {
    setDraft(null);
    setApproved(false);
    setMessage("");
  }

  async function copyDraft() {
    if (!draft || !approved) return;
    try {
      await navigator.clipboard.writeText(draft);
      setMessage("نُسخت المسودة المعتمدة. يمكنك لصقها في محرر الدرس ومراجعتها قبل النشر.");
    } catch {
      setMessage("تعذر النسخ التلقائي. يمكنك تحديد النص في المربع ونسخه يدويًا.");
    }
  }

  return (
    <div dir="rtl" className="space-y-6">
      <section className="rounded-3xl border border-[#d9c8a7] bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-black text-[#123f39]">إعداد النشاط التكاملي</h2>
        <p className="mt-2 leading-7 text-slate-600">
          أنشئ اقتراحًا تربويًا قابلًا للتحرير داخل لوحة المعلم دون خدمات مدفوعة
          أو تعديل الدروس والدرجات تلقائيًا.
        </p>

        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            try {
              setDraft(buildCrossCurricularDraft({
                lessonTitle, learningOutcome, grade, country, skill, focus,
              }));
              setApproved(false);
              setMessage("");
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "تعذر إعداد المسودة.");
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="studio-lesson" className="mb-2 block font-bold text-slate-800">
                عنوان درس اللغة العربية
              </label>
              <input
                id="studio-lesson" required maxLength={160} value={lessonTitle}
                onChange={(event) => { setLessonTitle(event.target.value); invalidate(); }}
                className="w-full rounded-xl border border-slate-300 p-3 focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="studio-skill" className="mb-2 block font-bold text-slate-800">
                المهارة اللغوية
              </label>
              <select
                id="studio-skill" value={skill}
                onChange={(event) => { setSkill(event.target.value as ArabicSkill); invalidate(); }}
                className="w-full rounded-xl border border-slate-300 bg-white p-3"
              >
                {SKILLS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="studio-grade" className="mb-2 block font-bold text-slate-800">الصف الدراسي</label>
              <select
                id="studio-grade" value={grade}
                onChange={(event) => { setGrade(Number(event.target.value)); invalidate(); }}
                className="w-full rounded-xl border border-slate-300 bg-white p-3"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
                  <option key={item} value={item}>الصف {item}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="studio-country" className="mb-2 block font-bold text-slate-800">
                بلد المنهج والسياق المحلي
              </label>
              <input
                id="studio-country" required maxLength={70} value={country}
                onChange={(event) => { setCountry(event.target.value); invalidate(); }}
                className="w-full rounded-xl border border-slate-300 p-3 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="studio-outcome" className="mb-2 block font-bold text-slate-800">
              الهدف اللغوي للدرس
            </label>
            <textarea
              id="studio-outcome" required maxLength={500} rows={2} value={learningOutcome}
              onChange={(event) => { setLearningOutcome(event.target.value); invalidate(); }}
              className="w-full rounded-xl border border-slate-300 p-3 leading-7 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <fieldset className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <legend className="px-2 font-black text-emerald-900">مجالات الربط الاختيارية</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {FOCUSES.map((key) => (
                <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3 font-bold text-slate-800">
                  <input
                    type="checkbox" checked={focus[key]}
                    onChange={(event) => {
                      setFocus((previous) => ({ ...previous, [key]: event.target.checked }));
                      invalidate();
                    }}
                    className="h-5 w-5 accent-emerald-700"
                  />
                  <span>{FOCUS_LABELS[key]}</span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-sm leading-6 text-emerald-950">
              الربط بالإسلاميات اختياري، ويستلزم التحقق من الشواهد والمصادر
              ومناسبتها للصف والمنهج قبل استخدامها.
            </p>
          </fieldset>

          <button
            type="submit"
            className="rounded-xl bg-[#123f39] px-6 py-3 font-black text-white transition hover:bg-[#195d53] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            إعداد المسودة التربوية
          </button>
        </form>
      </section>

      {draft !== null ? (
        <section className="rounded-3xl border border-[#d9c8a7] bg-white p-5 shadow-sm sm:p-7" aria-live="polite">
          <h2 className="text-xl font-black text-[#123f39]">المسودة القابلة للمراجعة</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            هذه مسودة نموذجية وليست نصًا وزاريًا ولا نتيجة توليد ذكاء اصطناعي.
            عدّلها لتطابق درسك قبل اعتمادها.
          </p>
          <label htmlFor="studio-draft" className="mt-4 block font-bold text-slate-800">
            نص النشاط (يمكنك تحريره)
          </label>
          <textarea
            id="studio-draft" rows={22} value={draft}
            onChange={(event) => { setDraft(event.target.value); setApproved(false); setMessage(""); }}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm leading-8 focus:border-emerald-600 focus:outline-none"
            spellCheck
          />
          <label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-slate-800">
            <input
              type="checkbox" checked={approved}
              onChange={(event) => setApproved(event.target.checked)}
              className="mt-1 h-5 w-5 accent-emerald-700"
            />
            <span>راجعت اللغة والمحتوى، وتحققت من الحقائق والشواهد، وأوافق على استخدام المسودة في درسي.</span>
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button" disabled={!approved || !draft.trim()} onClick={copyDraft}
              className="rounded-xl bg-emerald-700 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              نسخ المسودة بعد الاعتماد
            </button>
            <a href="/teacher" className="rounded-xl border border-slate-300 px-5 py-3 font-black text-slate-800">
              الانتقال إلى إدارة الدروس
            </a>
          </div>
        </section>
      ) : null}
      {message ? <p role="status" className="rounded-xl bg-slate-100 p-3 text-sm font-bold text-slate-900">{message}</p> : null}
    </div>
  );
}
