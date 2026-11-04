"use client";

import { useMemo, useState } from "react";

import {
  buildFeedbackDraft,
  FEEDBACK_SKILLS,
  type FeedbackSkillId,
  type Stage,
} from "@/features/teacher-feedback/feedback-plan";

type Props = {
  context?: "public" | "student";
};

export default function TeacherFeedbackPanel({ context = "public" }: Props) {
  const [skill, setSkill] = useState<FeedbackSkillId>("reading-comprehension");
  const [stage, setStage] = useState<Stage>("4-6");
  const [evidence, setEvidence] = useState("");
  const [correct, setCorrect] = useState("");
  const [total, setTotal] = useState("");
  const [days, setDays] = useState(14);
  const [reviewed, setReviewed] = useState(false);
  const [notice, setNotice] = useState("");

  const draft = useMemo(
    () => buildFeedbackDraft({
      skill,
      stage,
      evidence,
      correct: correct === "" ? null : Number(correct),
      total: total === "" ? null : Number(total),
      reviewDays: days,
    }),
    [skill, stage, evidence, correct, total, days]
  );

  function resetApproval() {
    setReviewed(false);
    setNotice("");
  }

  async function copyDraft() {
    if (!draft.ready || !reviewed) {
      return;
    }
    try {
      await navigator.clipboard.writeText(draft.exportText);
      setNotice("نُسخت المسودة المعتمدة من المعلم إلى الحافظة. لم تُحفظ في ضاديوم.");
    } catch {
      setNotice("تعذّر النسخ التلقائي؛ حدّد النص الظاهر وانسخه يدويًا.");
    }
  }

  return (
    <section dir="rtl" aria-labelledby="feedback-title" className="rounded-3xl border border-emerald-200 bg-[#fffdf7] p-5 shadow-sm sm:p-7">
      <p className="text-sm font-black text-emerald-800">ضاديوم — بيت العربية الرقمي</p>
      <h2 id="feedback-title" className="mt-2 text-2xl font-black text-slate-900">
        من الملاحظة إلى خطوة تحسن قابلة للقياس
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-700">
        {context === "student"
          ? "مسودة تربوية بجوار ملف الطالب. لا تستنتج الأداة مستوى مهارة بعينها من متوسط الدرجة العام؛ أدخل دليل المهارة الذي لاحظته بنفسك."
          : "مورد ضاديوم المفتوح للمعلم داخل المنصة وخارجها. أدخل دليلًا من نشاطك الفعلي ثم راجع المخرجات قبل اعتمادها."}
      </p>
      <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">
        لا تكتب أسماء الطلاب أو أرقامهم أو معلوماتهم الحساسة هنا. لا تُرسل المدخلات إلى خادم أو تُحفظ في قاعدة البيانات، والنسخ اختياري.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-bold text-slate-800">
          <span>المهارة المرصودة</span>
          <select value={skill} onChange={(event) => { setSkill(event.target.value as FeedbackSkillId); resetApproval(); }} className="w-full rounded-xl border border-slate-300 bg-white p-3">
            {FEEDBACK_SKILLS.map((item) => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-bold text-slate-800">
          <span>الصفوف (لضبط مستوى الدعم)</span>
          <select value={stage} onChange={(event) => { setStage(event.target.value as Stage); resetApproval(); }} className="w-full rounded-xl border border-slate-300 bg-white p-3">
            <option value="1-3">الأول–الثالث</option>
            <option value="4-6">الرابع–السادس</option>
            <option value="7-9">السابع–التاسع</option>
            <option value="10-12">العاشر–الثاني عشر</option>
          </select>
        </label>
        <label className="space-y-2 text-sm font-bold text-slate-800 sm:col-span-2">
          <span>شاهد الأداء الحقيقي (دون اسم الطالب)</span>
          <textarea
            value={evidence}
            onChange={(event) => { setEvidence(event.target.value.slice(0, 600)); resetApproval(); }}
            maxLength={600}
            rows={3}
            placeholder="مثال: حدد الفكرة الرئيسة للنص، لكنه لم يستدل بجملة منه عند الإجابة عن السؤال الثاني."
            className="w-full rounded-xl border border-slate-300 bg-white p-3 font-normal"
          />
        </label>
        <label className="space-y-2 text-sm font-bold text-slate-800">
          <span>عدد الإجابات الصحيحة (اختياري)</span>
          <input inputMode="numeric" type="number" min={0} max={100} value={correct} onChange={(event) => { setCorrect(event.target.value); resetApproval(); }} className="w-full rounded-xl border border-slate-300 bg-white p-3" />
        </label>
        <label className="space-y-2 text-sm font-bold text-slate-800">
          <span>إجمالي فرص الأداء (اختياري)</span>
          <input inputMode="numeric" type="number" min={1} max={100} value={total} onChange={(event) => { setTotal(event.target.value); resetApproval(); }} className="w-full rounded-xl border border-slate-300 bg-white p-3" />
        </label>
        <label className="space-y-2 text-sm font-bold text-slate-800 sm:col-span-2">
          <span>موعد إعادة القياس بالأيام (1–30)</span>
          <input type="number" min={1} max={30} value={days} onChange={(event) => { setDays(Number(event.target.value)); resetApproval(); }} className="w-full rounded-xl border border-slate-300 bg-white p-3" />
        </label>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-[#d8d2b9] bg-white p-5" aria-live="polite">
        <h3 className="text-lg font-black text-emerald-900">مسودة الملاحظة والتدخل</h3>
        {!draft.ready && (
          <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">{draft.issue}</p>
        )}
        <p className="text-sm leading-8 text-slate-800">{draft.observation}</p>
        {draft.ready && (
          <>
            <p className="text-sm leading-8 text-slate-800">{draft.intervention}</p>
            <p className="text-sm leading-8 text-slate-800">{draft.measurement}</p>
            <p className="text-sm leading-8 text-slate-800"><strong>رسالة للأسرة:</strong> {draft.familyMessage}</p>
          </>
        )}
      </div>

      <label className="mt-5 flex items-start gap-3 text-sm leading-7 text-slate-800">
        <input type="checkbox" disabled={!draft.ready} checked={reviewed} onChange={(event) => { setReviewed(event.target.checked); setNotice(""); }} className="mt-2 h-4 w-4 accent-emerald-700" />
        <span>راجعتُ الشاهد وصحة العبارة وملاءمة خطة الدعم، وأتحمل مسؤولية اعتمادها تربويًا.</span>
      </label>
      <button
        type="button"
        onClick={copyDraft}
        disabled={!draft.ready || !reviewed}
        className="mt-4 rounded-xl bg-emerald-800 px-6 py-3 font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        نسخ الملاحظة والخطة بعد اعتماد المعلم
      </button>
      {notice && <p role="status" className="mt-3 text-sm font-semibold text-emerald-900">{notice}</p>}
      <p className="mt-4 text-xs leading-6 text-slate-600">
        المخرجات مسودات تكوينية؛ لا تغيّر درجات الطالب أو حالة إكمال دروسه، ولا تعتبر تشخيصًا طبيًا أو شهادة مطابقة لمنهج رسمي.
      </p>
    </section>
  );
}
