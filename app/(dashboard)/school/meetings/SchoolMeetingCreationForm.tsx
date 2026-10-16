"use client";

import { useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

type MeetingResult = { ok: boolean; message: string };

function noopSubscribe() {
  return () => {};
}

function SubmitButton({ pending }: { pending: boolean }) {
  // SSR is non-interactive; enable the button only after hydration.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return (
    <button
      type="submit"
      disabled={!hydrated || pending}
      data-school-meeting-js-ready={hydrated ? "yes" : "no"}
      className="w-full rounded-xl bg-violet-700 px-5 py-3 font-black text-white disabled:opacity-60"
    >
      {!hydrated
        ? "جارٍ تجهيز نموذج الاجتماع..."
        : pending
          ? "جارٍ حفظ الاجتماع..."
          : "إنشاء غرفة الاجتماع"}
    </button>
  );
}

export default function SchoolMeetingCreationForm() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<MeetingResult | null>(null);
  const router = useRouter();

  async function submitMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = event.currentTarget;
    const fields = new FormData(form);
    setPending(true);
    setResult(null);

    try {
      // An explicit same-origin request avoids relying on Vinext's
      // useActionState transport, which yielded no server receipt in E2E.
      const response = await fetch("/api/school/meetings", {
        method: "POST",
        body: fields,
        credentials: "same-origin",
        cache: "no-store",
        headers: { "X-Dadyoom-Meeting-Request": "1" },
      });
      const body = (await response.json()) as Partial<MeetingResult>;
      const succeeded = response.ok && body.ok === true;
      setResult({
        ok: succeeded,
        message: typeof body.message === "string"
          ? body.message
          : "تعذر حفظ الاجتماع الآن، حاول مرة أخرى.",
      });
      if (succeeded) {
        form.reset();
        // Leave the server receipt visible. A refresh can replace the form
        // before QA or the user has seen the result.
      }
    } catch {
      setResult({
        ok: false,
        message: "تعذر الاتصال بالخادم. حاول مرة أخرى.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submitMeeting}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-black text-slate-900">اجتماع جديد</h2>
      <p className="mt-3 text-sm font-bold text-violet-800">
        المواعيد بتوقيت البحرين (UTC+3).
      </p>
      <div className="mt-5 space-y-4">
        <input
          name="title"
          required
          placeholder="مثال: اجتماع قسم اللغة العربية"
          className="w-full rounded-xl border border-slate-300 p-3"
        />
        <textarea
          name="description"
          rows={3}
          placeholder="موضوع الاجتماع أو جدول الأعمال"
          className="w-full rounded-xl border border-slate-300 p-3"
        />
        <label className="block text-sm font-bold text-slate-700">
          يبدأ
          <input
            type="datetime-local"
            name="startsAt"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 p-3"
          />
        </label>
        <label className="block text-sm font-bold text-slate-700">
          ينتهي
          <input
            type="datetime-local"
            name="endsAt"
            className="mt-2 w-full rounded-xl border border-slate-300 p-3"
          />
        </label>
        <SubmitButton pending={pending} />
        {result ? (
          <div
            role={result.ok ? "status" : "alert"}
            data-school-meeting-result={result.ok ? "success" : "error"}
            className="rounded-xl border p-3 text-sm font-bold"
          >
            {result.message}
            {result.ok ? (
              <button
                type="button"
                onClick={() => router.refresh()}
                className="mr-3 underline"
              >
                تحديث قائمة الاجتماعات
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}
