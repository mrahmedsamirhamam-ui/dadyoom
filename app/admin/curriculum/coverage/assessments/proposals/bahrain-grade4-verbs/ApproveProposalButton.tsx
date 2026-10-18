"use client";

import { useState } from "react";
import Link from "next/link";
import type { GamePack, GameItem, GameMode } from "@/lib/games/lesson-game-pack";
import { GAME_MODES } from "@/lib/games/lesson-game-pack";
import { validateReviewedProposal } from "@/lib/games/proposal-review";

type Result = { ok?: boolean; error?: string };

export default function ApproveProposalButton({
  lessonId, pack,
}: {
  lessonId: string;
  pack: GamePack;
}) {
  const [checkedAnswers, setCheckedAnswers] = useState(false);
  const [acknowledgedSource, setAcknowledgedSource] = useState(false);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [message, setMessage] = useState("");
  // The source JSON is immutable. Corrections stay in this local draft until
  // an authorized reviewer explicitly publishes it to the existing API.
  const [draftPack, setDraftPack] = useState<GamePack>(() => structuredClone(pack));
  const [hasEdits, setHasEdits] = useState(false);

  function revise(mode: GameMode, index: number, patch: Partial<GameItem>) {
    if (saving || published) return;
    setDraftPack(current => ({
      ...current,
      [mode]: current[mode].map((item, i) =>
        i === index ? { ...item, ...patch } : item),
    }));
    // Any correction invalidates a previously given blanket approval.
    setCheckedAnswers(false);
    setHasEdits(true);
    setMessage("");
  }

  async function approve() {
    if (!checkedAnswers || !acknowledgedSource || saving || published) return;
    const checkedPack = validateReviewedProposal(draftPack);
    if (!checkedPack) {
      setMessage("توجد أسئلة ناقصة أو متكررة، أو إجابات غير موجودة في الخيارات، أو تفسيرات قصيرة. صحّحها قبل الاعتماد.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      // Only an explicit click after both teacher-review confirmations sends
      // a request. The API separately requires authenticated admin role.
      const response = await fetch("/api/lessons/games", {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "x-dadyoom-approved-game-pack": "1",
        },
        body: JSON.stringify({
          lessonId,
          pack: checkedPack,
          approved: true,
          aiAssisted: true,
        }),
      });
      const result = await response.json().catch(() => ({})) as Result;
      if (!response.ok || result.ok !== true) {
        throw new Error(result.error ?? "تعذر حفظ الحزمة. لم يتم اعتمادها.");
      }
      setPublished(true);
      setMessage("تم اعتماد حزمة ألعاب هذا الدرس بعد مراجعتك، ونُشرت للطلاب وفق صلاحيات النظام.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر الاتصال بخدمة اعتماد الألعاب.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-amber-400 bg-white p-6">
      <h2 className="text-xl font-black text-[#123f39]">قرار المراجعة والنشر</h2>
      <p className="mt-2 text-sm leading-7">
        حدد المربعين فقط بعد تدقيق كل الأسئلة وإجاباتها وتفسيراتها.
        لا يتم اعتماد أي شيء تلقائيًا عند فتح الصفحة.
        يتطلب النشر صلاحية مدير المنصة، ولا يثبت مطابقة الكتاب الوزاري.
      </p>
      <details className="mt-5 rounded-2xl border border-[#d6c9b0] bg-[#fffaf0] p-4">
        <summary className="cursor-pointer text-base font-black text-[#123f39]">
          صحّح نص الأسئلة والخيارات والإجابات والتفسيرات قبل الاعتماد
        </summary>
        <p className="mt-2 text-sm leading-7 text-[#665e53]">
          التعديلات هنا لا تكتب في قاعدة البيانات إلا عند الاعتماد الصريح.
          يجب أن تظل الأسئلة الخمسة والعشرون مختلفة، وإجابة كل سؤال ضمن خياراته.
          عند تعديل أي شيء يجب تأكيد المراجعة من جديد.
        </p>
        <div className="mt-4 space-y-5">
          {GAME_MODES.map(mode => (
            <div key={mode} className="rounded-xl border bg-white p-3">
              <h3 className="mb-3 font-black text-[#123f39]">{mode} — خمسة أسئلة</h3>
              <div className="space-y-4">
                {draftPack[mode].map((question, index) => (
                  <fieldset key={index} className="rounded-xl border p-3" disabled={saving || published}>
                    <legend className="px-2 text-sm font-black">السؤال {index + 1}</legend>
                    <label className="block text-sm font-bold">
                      نص السؤال
                      <textarea value={question.prompt} rows={2}
                        onChange={event => revise(mode,index,{prompt:event.target.value})}
                        className="mt-1 w-full rounded-lg border p-2" />
                    </label>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      {question.options.map((option, choiceIndex) => (
                        <label key={choiceIndex} className="text-sm font-bold">
                          الخيار {choiceIndex + 1}
                          <input value={option}
                            onChange={event => {
                              const options = question.options.map((entry,i) =>
                                i === choiceIndex ? event.target.value : entry);
                              // If the correct choice is changed, retain its identity.
                              const answer = question.answer === option
                                ? event.target.value : question.answer;
                              revise(mode,index,{options,answer});
                            }}
                            className="mt-1 w-full rounded-lg border p-2" />
                        </label>
                      ))}
                    </div>
                    <label className="mt-3 block text-sm font-bold">
                      الإجابة الصحيحة
                      <select value={question.answer}
                        onChange={event => revise(mode,index,{answer:event.target.value})}
                        className="mt-1 w-full rounded-lg border bg-white p-2">
                        {!question.options.includes(question.answer) ? (
                          <option value={question.answer}>إجابة غير صالحة — اختر من الخيارات</option>
                        ) : null}
                        {question.options.map((option,i) =>
                          <option key={i} value={option}>{option || "خيار فارغ"}</option>)}
                      </select>
                    </label>
                    <label className="mt-3 block text-sm font-bold">
                      تفسير الإجابة
                      <textarea value={question.explanation ?? ""} rows={2}
                        onChange={event => revise(mode,index,{explanation:event.target.value})}
                        className="mt-1 w-full rounded-lg border p-2" />
                    </label>
                  </fieldset>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
      {hasEdits ? (
        <p role="status" className="mt-3 text-sm font-bold text-amber-900">
          توجد تعديلات محلية على الحزمة. راجع كل الإجابات وأكّد المربعين مجددًا قبل النشر.
        </p>
      ) : null}
      <label className="mt-4 flex items-start gap-3 rounded-xl border p-3 text-sm font-bold leading-7">
        <input
          type="checkbox"
          checked={checkedAnswers}
          onChange={event => setCheckedAnswers(event.target.checked)}
          disabled={saving || published}
          className="mt-2 size-5"
        />
        راجعت الأسئلة الخمسة والعشرين وإجاباتها وشرح كل إجابة وأتحمل مسؤولية الموافقة التربوية.
      </label>
      <label className="mt-3 flex items-start gap-3 rounded-xl border p-3 text-sm font-bold leading-7">
        <input
          type="checkbox"
          checked={acknowledgedSource}
          onChange={event => setAcknowledgedSource(event.target.checked)}
          disabled={saving || published}
          className="mt-2 size-5"
        />
        أعلم أنها تمارين ضاديوم الأصلية بمساعدة الذكاء الاصطناعي، وليست أسئلة معتمدة من كتاب وزارة التربية.
      </label>
      <button
        type="button"
        disabled={!checkedAnswers || !acknowledgedSource || saving || published}
        onClick={() => { void approve(); }}
        className="mt-5 min-h-12 rounded-xl bg-[#174f47] px-6 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        {published ? "تم اعتماد هذه الحزمة" : saving ? "جارٍ حفظ الاعتماد…" : "اعتمد 25 سؤالًا وانشرها للطلاب"}
      </button>
      {message ? (
        <p role="status" className="mt-4 rounded-xl bg-[#eff7ed] p-4 text-sm font-bold">{message}</p>
      ) : null}
      {published ? (
        <Link href={`/lessons/${lessonId}/games`} prefetch={false}
          className="mt-3 inline-flex font-black text-[#174f47] underline">
          تحقّق من الألعاب المنشورة ←
        </Link>
      ) : null}
    </section>
  );
}
