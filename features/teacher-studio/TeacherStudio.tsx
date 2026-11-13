"use client";
import { useState } from "react";
import {
  generateStudioDraft, studioDraftAsText,
  type StudioDraft, type StudioInput
} from "./generate";

const initial: StudioInput = {
  title: "", grade: "", country: "البحرين", sourceText: "",
  objectiveOne: "", objectiveTwo: "", durationMinutes: 55
};

export default function TeacherStudio() {
  const [input, setInput] = useState<StudioInput>(initial);
  const [draft, setDraft] = useState<StudioDraft | null>(null);
  const [error, setError] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [editedText, setEditedText] = useState("");

  function change<K extends keyof StudioInput>(name: K, value: StudioInput[K]) {
    setInput((previous) => ({ ...previous, [name]: value }));
    setDraft(null);
    setReviewed(false);
    setEditedText("");
    setError("");
  }

  function build() {
    try {
      const nextDraft = generateStudioDraft(input);
      setDraft(nextDraft);
      setEditedText(studioDraftAsText(input, nextDraft));
      setReviewed(false);
      setError("");
    } catch (caught) {
      setDraft(null);
      setError(caught instanceof Error ? caught.message : "تعذر إعداد المسودة.");
    }
  }

  function download() {
    if (!draft || !reviewed) return;
    const blob = new Blob(["\uFEFF" + editedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dadyoom-teacher-studio-draft.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7faf8] px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl bg-[#123f39] p-7 text-white">
          <p className="text-sm font-bold text-[#f5cf7a]">ضاديوم — بيت العربية الرقمي</p>
          <h1 className="mt-2 text-3xl font-black">استوديو المعلم | نموذج أولي</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-50">
            أنشئ مسودة منظمة من نص تدخله بنفسك. لا يُرسل النص إلى نموذج ذكاء اصطناعي أو واجهة API
            ولا يُحفظ في قاعدة البيانات. استخراج النص من الصور، وإنشاء Word وPDF وPowerPoint
            ليست جزءًا من هذا النموذج الأولي.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">1. أدخل بيانات الدرس</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextField label="عنوان الدرس" value={input.title} onChange={(text) => change("title", text)} placeholder="مثال: الأفعال الخمسة" />
            <TextField label="الصف" value={input.grade} onChange={(text) => change("grade", text)} placeholder="مثال: السابع" />
            <TextField label="الدولة" value={input.country} onChange={(text) => change("country", text)} />
            <label className="space-y-2 text-sm font-bold">
              <span className="block">مدة الحصة بالدقائق (30–90)</span>
              <input className="w-full rounded-xl border border-slate-300 p-3" type="number" min={30} max={90}
                value={input.durationMinutes}
                onChange={(event) => change("durationMinutes", Number(event.target.value))} />
            </label>
            <TextField label="الهدف الأول (غير مركب)" value={input.objectiveOne} onChange={(text) => change("objectiveOne", text)} />
            <TextField label="الهدف الثاني (غير مركب)" value={input.objectiveTwo} onChange={(text) => change("objectiveTwo", text)} />
          </div>
          <label className="mt-5 block space-y-2 text-sm font-bold">
            <span className="block">نص الدرس — لا تُدخل أي بيانات شخصية أو بيانات طلاب</span>
            <textarea dir="rtl" maxLength={5000} value={input.sourceText}
              onChange={(event) => change("sourceText", event.target.value)}
              className="min-h-40 w-full rounded-xl border border-slate-300 p-4 leading-7"
              placeholder="الصق نصًا تملك حق استخدامه. لم يتحقق النظام من المصدر أو الحقوق." />
          </label>
          {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <button type="button" onClick={build}
            className="mt-5 rounded-xl bg-[#123f39] px-6 py-3 font-black text-white hover:bg-[#206c5f]">
            إعداد مسودة التحضير
          </button>
        </section>

        {draft && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black">2. المسودة — للمراجعة وليست معتمدة</h2>
              <span className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">المصدر غير متحقق</span>
            </div>
            <h3 className="mt-5 font-black">{draft.heading}</h3>
            <div className="mt-4 space-y-3">
              {draft.stages.map((stage) => (
                <article key={stage.label} className="rounded-xl border border-slate-200 p-4">
                  <h4 className="font-black">{stage.label} — {stage.minutes} دقيقة</h4>
                  <p className="mt-2 text-sm leading-7">{stage.activity}</p>
                  <p className="mt-1 text-xs text-slate-600">دليل التعلم: {stage.evidence}</p>
                </article>
              ))}
            </div>
            <h3 className="mt-6 font-black">أسئلة تقويم أولية</h3>
            <ol className="mt-2 list-inside list-decimal space-y-2 text-sm leading-7">
              {draft.assessments.map((question) => <li key={question}>{question}</li>)}
            </ol>
            <h3 className="mt-6 font-black">أنشطة متمايزة</h3>
            <ul className="mt-2 list-inside list-disc space-y-2 text-sm leading-7">
              {draft.differentiation.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <h3 className="mt-6 font-black">قائمة المراجعة المطلوبة</h3>
            <ul className="mt-2 list-inside list-disc space-y-2 text-sm leading-7 text-amber-900">
              {draft.reviewChecklist.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <label className="mt-6 block space-y-2 text-sm font-bold">
              <span className="block">3. راجع وعدّل نص التحضير قبل تنزيله</span>
              <textarea rows={13} maxLength={15000} value={editedText}
                onChange={(event) => { setEditedText(event.target.value); setReviewed(false); }}
                className="w-full rounded-xl border border-slate-300 p-4 text-sm leading-7" />
            </label>
            <label className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm">
              <input type="checkbox" className="mt-1" checked={reviewed}
                onChange={(event) => setReviewed(event.target.checked)} />
              <span>راجعت النص والهدفين والأسئلة والمصدر، وسأعتمد المحتوى بنفسي قبل استخدامه.</span>
            </label>
            <button type="button" disabled={!reviewed || !editedText.trim()} onClick={download}
              className="mt-4 rounded-xl bg-[#123f39] px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
              تنزيل نص المسودة (TXT)
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
function TextField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string;
}) {
  return (
    <label className="space-y-2 text-sm font-bold">
      <span className="block">{label}</span>
      <input className="w-full rounded-xl border border-slate-300 p-3"
        maxLength={180} value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder} />
    </label>
  );
}
