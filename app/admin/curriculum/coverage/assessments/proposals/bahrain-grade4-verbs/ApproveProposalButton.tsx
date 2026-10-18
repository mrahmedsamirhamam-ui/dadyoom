"use client";

import { useState } from "react";
import Link from "next/link";
import type { GamePack } from "@/lib/games/lesson-game-pack";

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

  async function approve() {
    if (!checkedAnswers || !acknowledgedSource || saving || published) return;
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
          pack,
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
