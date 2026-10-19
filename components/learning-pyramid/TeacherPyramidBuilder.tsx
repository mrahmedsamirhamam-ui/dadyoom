"use client";

import Link from "next/link";
import { useState } from "react";
import ArabicMasteryPyramid from "@/components/learning-pyramid/ArabicMasteryPyramid";
import { LEVELS, PYRAMID_PACKS, type ChoiceTask, type CreativeTask, type PyramidPack, type PyramidStep } from "@/lib/learning-pyramid/packs";

const sample = (): PyramidPack => ({
  ...(JSON.parse(JSON.stringify(PYRAMID_PACKS[0])) as PyramidPack),
  slug: "teacher-draft",
  title: "هرمي التعليمي",
  stage: "نشاط من إعداد المعلم",
  goal: "تعلّم مفهوم لغوي عبر ست مهام متدرجة",
});

export default function TeacherPyramidBuilder() {
  const [pack, setPack] = useState<PyramidPack>(sample);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");

  function updatePack(key: "title" | "stage" | "goal" | "intro", value: string) {
    setPack((previous) => ({ ...previous, [key]: value }));
  }

  function updateStep(index: number, change: (step: PyramidStep) => PyramidStep) {
    setPack((previous) => ({
      ...previous,
      steps: previous.steps.map((step, i) => i === index ? change(step) : step) as unknown as PyramidPack["steps"],
    }));
  }

  function updateQuestion(index: number, field: "question" | "hint" | "explanation", value: string) {
    updateStep(index, (step) => {
      if (step.task.kind !== "choice") return step;
      return { ...step, task: { ...step.task, [field]: value } };
    });
  }

  function updateOption(index: number, optionIndex: number, value: string) {
    updateStep(index, (step) => {
      if (step.task.kind !== "choice") return step;
      const options = step.task.options.map((option, i) => i === optionIndex ? value : option) as ChoiceTask["options"];
      return { ...step, task: { ...step.task, options } };
    });
  }

  function updateCorrect(index: number, answer: number) {
    if (answer < 0 || answer > 2) return;
    updateStep(index, (step) => {
      if (step.task.kind !== "choice") return step;
      return { ...step, task: { ...step.task, correctIndex: answer as 0 | 1 | 2 } };
    });
  }

  function updateCreative(key: "question" | "example" | "teacherNote", value: string) {
    updateStep(5, (step) => {
      if (step.task.kind !== "creative") return step;
      return { ...step, task: { ...step.task, [key]: value } };
    });
  }

  function updateCriterion(index: number, value: string) {
    updateStep(5, (step) => {
      if (step.task.kind !== "creative") return step;
      return {
        ...step,
        task: { ...step.task, criteria: step.task.criteria.map((criterion, i) => i === index ? value : criterion) as CreativeTask["criteria"] },
      };
    });
  }

  function validate(): boolean {
    const required = [pack.title, pack.stage, pack.goal, pack.intro];
    for (const step of pack.steps) {
      required.push(step.title, step.purpose, step.task.question);
      if (step.task.kind === "choice") {
        required.push(...step.task.options, step.task.hint, step.task.explanation);
      } else {
        required.push(step.task.example, step.task.teacherNote, ...step.task.criteria);
      }
    }
    const valid = required.every((field) => field.trim().length >= 3 && field.length <= 500);
    if (!valid) {
      setError("أكمل جميع النصوص بما لا يقل عن 3 أحرف ولا يزيد على 500 حرف للحقل، ثم راجع الإجابات.");
      return false;
    }
    setError("");
    return true;
  }

  function exportDraft() {
    if (!validate()) return;
    const blob = new Blob([JSON.stringify({ version: 1, type: "dadyoom-learning-pyramid", pack }, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dadyoom-pyramid-teacher-draft.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const inputClass = "mt-2 w-full rounded-xl border border-[#ddceb2] bg-white px-4 py-3 text-base text-[#233d37] outline-none focus:border-[#174f47] focus:ring-2 focus:ring-[#174f47]/20";

  if (preview) {
    return (
      <div dir="rtl" className="bg-[#fffaf0]">
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 border-b border-[#d6c7a4] bg-[#fff5db] p-3 text-sm">
          <strong>معاينة مسودة المعلم (لا تُحفظ درجات أو بيانات)</strong>
          <button type="button" onClick={() => setPreview(false)} className="rounded-lg bg-[#174f47] px-4 py-2 font-black text-white">العودة إلى التحرير</button>
        </div>
        <ArabicMasteryPyramid customPack={pack} />
      </div>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] text-[#263c34]">
      <header className="bg-[#123f39] px-4 py-10 text-center text-white">
        <p className="text-sm font-bold text-[#f6d48a]">مختبر ضاديوم التفاعلي • استوديو المعلم التجريبي</p>
        <h1 className="mt-3 font-arabic-display text-3xl font-black sm:text-4xl">صمّم هرمًا خاصًا بدرسك</h1>
        <p className="mx-auto mt-4 max-w-3xl font-arabic-reading leading-8 text-[#deeee7]">عدّل أسئلة المستويات الستة وإجاباتها، ثم اعرض الهرم كطالب. يمكن حفظ المسودة ملفًا على جهازك. النشر في مناهج ضاديوم يتطلب اعتماد المعلم والمراجعة التربوية.</p>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex flex-wrap gap-3">
          <Link href="/interactive-lab" className="rounded-xl border border-[#d5c5a6] px-4 py-2.5 text-sm font-bold">← المختبر</Link>
          <button type="button" onClick={() => { if (validate()) setPreview(true); }} className="rounded-xl bg-[#174f47] px-5 py-2.5 text-sm font-black text-white">معاينة الهرم</button>
          <button type="button" onClick={exportDraft} className="rounded-xl border border-[#7ca28d] bg-white px-5 py-2.5 text-sm font-black text-[#174f47]">حفظ مسودة JSON</button>
          <button type="button" onClick={() => { setPack(sample()); setError(""); }} className="rounded-xl border border-[#d5c5a6] px-4 py-2.5 text-sm font-bold">استعادة نموذج الحال</button>
        </div>
        {error && <p role="alert" className="mb-5 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</p>}
        <section className="rounded-2xl border border-[#e2d3b6] bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black">بيانات الدرس</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { key: "title", title: "عنوان الهرم" },
              { key: "stage", title: "المجال اللغوي / الصف" },
              { key: "goal", title: "الهدف التعليمي" },
              { key: "intro", title: "الموقف أو المثال التمهيدي" },
            ].map(({ key, title }) => (
              <label key={key} className="text-sm font-black">{title}
                <input maxLength={500} value={pack[key as "title" | "stage" | "goal" | "intro"]}
                  onChange={(event) => updatePack(key as "title" | "stage" | "goal" | "intro", event.target.value)}
                  className={inputClass} />
              </label>
            ))}
          </div>
        </section>

        <div className="mt-5 space-y-5">
          {pack.steps.slice(0, 5).map((step, index) => {
            if (step.task.kind !== "choice") return null;
            const task = step.task;
            return (
              <section key={step.level} className="rounded-2xl border border-[#e1d3b7] bg-white p-5 sm:p-7">
                <h2 className="text-xl font-black text-[#174f47]">{LEVELS[index].icon} {index + 1}. {LEVELS[index].title}</h2>
                <label className="mt-4 block text-sm font-bold">عنوان مهمة المستوى
                  <input maxLength={500} value={step.title} onChange={(event) => updateStep(index, (current) => ({ ...current, title: event.target.value }))} className={inputClass} />
                </label>
                <label className="mt-4 block text-sm font-bold">الهدف السلوكي
                  <input maxLength={500} value={step.purpose} onChange={(event) => updateStep(index, (current) => ({ ...current, purpose: event.target.value }))} className={inputClass} />
                </label>
                <label className="mt-4 block text-sm font-bold">السؤال
                  <textarea rows={2} maxLength={500} value={task.question} onChange={(event) => updateQuestion(index, "question", event.target.value)} className={inputClass} />
                </label>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {task.options.map((option, i) => (
                    <label key={i} className="text-sm font-bold">الخيار {i + 1}
                      <input value={option} maxLength={500} onChange={(event) => updateOption(index, i, event.target.value)} className={inputClass} />
                    </label>
                  ))}
                </div>
                <label className="mt-4 block text-sm font-bold">الإجابة الصحيحة
                  <select value={task.correctIndex} onChange={(event) => updateCorrect(index, Number(event.target.value))} className={inputClass}>
                    {[0, 1, 2].map((option) => <option key={option} value={option}>الخيار {option + 1}</option>)}
                  </select>
                </label>
                <label className="mt-4 block text-sm font-bold">تلميح عند الخطأ
                  <input maxLength={500} value={task.hint} onChange={(event) => updateQuestion(index, "hint", event.target.value)} className={inputClass} />
                </label>
                <label className="mt-4 block text-sm font-bold">شرح الإجابة الصحيحة
                  <textarea rows={2} maxLength={500} value={task.explanation} onChange={(event) => updateQuestion(index, "explanation", event.target.value)} className={inputClass} />
                </label>
              </section>
            );
          })}

          {pack.steps[5].task.kind === "creative" && (
            <section className="rounded-2xl border border-[#e1d3b7] bg-white p-5 sm:p-7">
              <h2 className="text-xl font-black text-[#174f47]">⭐ 6. أبدع</h2>
              <label className="mt-4 block text-sm font-bold">عنوان المهمة الإبداعية
                <input maxLength={500} value={pack.steps[5].title} onChange={(event) => updateStep(5, (current) => ({ ...current, title: event.target.value }))} className={inputClass} />
              </label>
              <label className="mt-4 block text-sm font-bold">هدف المهمة الإبداعية
                <input maxLength={500} value={pack.steps[5].purpose} onChange={(event) => updateStep(5, (current) => ({ ...current, purpose: event.target.value }))} className={inputClass} />
              </label>
              {(() => {
                const task = pack.steps[5].task as CreativeTask;
                return (
                  <>
                    <label className="mt-4 block text-sm font-bold">التكليف الكتابي
                      <textarea maxLength={500} value={task.question} onChange={(event) => updateCreative("question", event.target.value)} rows={2} className={inputClass} />
                    </label>
                    <label className="mt-4 block text-sm font-bold">مثال توضيحي
                      <input maxLength={500} value={task.example} onChange={(event) => updateCreative("example", event.target.value)} className={inputClass} />
                    </label>
                    <p className="mt-4 text-sm font-black">بنود قائمة التحقق الذاتي</p>
                    <div className="mt-2 grid gap-3">
                      {task.criteria.map((criterion, i) => (
                        <label key={i} className="text-sm font-bold">البند {i + 1}
                          <input maxLength={500} value={criterion} onChange={(event) => updateCriterion(i, event.target.value)} className={inputClass} />
                        </label>
                      ))}
                    </div>
                    <label className="mt-4 block text-sm font-bold">توجيه مراجعة المعلم
                      <textarea rows={2} maxLength={500} value={task.teacherNote} onChange={(event) => updateCreative("teacherNote", event.target.value)} className={inputClass} />
                    </label>
                  </>
                );
              })()}
            </section>
          )}
        </div>
        <p className="mt-7 rounded-xl bg-[#f6ecd5] p-4 text-sm leading-7 text-[#806543]">النسخة الحالية أداة إعداد وتجربة محلية: لا تحفظ المسودة في Supabase ولا تنشرها للطلاب أو تمنح شهادات. راجع القواعد اللغوية ومطابقة الدرس الرسمي وحقوق المحتوى قبل اعتماد النشاط.</p>
      </div>
    </main>
  );
}
