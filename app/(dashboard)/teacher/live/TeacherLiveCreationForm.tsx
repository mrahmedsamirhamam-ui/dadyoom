"use client";
import { useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; title?: string; name?: string };
function noopSubscribe() { return () => {}; }

function SubmitButton({ pending }: { pending: boolean }) {
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return (
    <button type="submit" disabled={!hydrated || pending}
      data-teacher-live-js-ready={hydrated ? "yes" : "no"}
      className="dadyoom-arabic-button rounded-2xl px-5 py-3 font-black text-white disabled:opacity-60">
      {!hydrated ? "جارٍ تجهيز النموذج…" : pending ? "جارٍ الحفظ…" : "أنشئ الحصة"}
    </button>
  );
}

export default function TeacherLiveCreationForm({ courses, classes }: { courses: Item[]; classes: Item[] }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    if (!fields.get("courseId") && !fields.get("classId")) {
      setResult({ ok: false, message: "اختر كورسًا أو فصلًا واحدًا على الأقل." });
      return;
    }
    setPending(true);
    setResult(null);
    try {
      const response = await fetch("/api/teacher/live", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        body: fields,
        headers: { "X-Dadyoom-Teacher-Live-Request": "1" },
      });
      const type = response.headers.get("content-type") ?? "";
      const body = type.includes("application/json")
        ? await response.json().catch(() => null) as { ok?: boolean; message?: string } | null
        : null;
      const ok = response.ok && body?.ok === true;
      setResult({ ok, message: body?.message ??
        (response.status >= 500
          ? "خطأ بالخادم HTTP " + response.status + "، لم يؤكد حفظ الحصة."
          : "تعذر إنشاء الحصة HTTP " + response.status) });
      if (ok) form.reset();
    } catch {
      setResult({ ok: false, message: "تعذر الاتصال بالخادم؛ لم يتم تأكيد الحفظ." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <input name="title" required placeholder="عنوان الحصة" className="w-full rounded-2xl border p-3"/>
      <textarea name="description" placeholder="وصف مختصر" className="min-h-24 w-full rounded-2xl border p-3"/>
      <p className="rounded-xl bg-teal-50 p-3 text-sm font-bold text-teal-900">
        المواعيد بتوقيت البحرين (UTC+3).
      </p>
      <label className="block font-bold">تبدأ
        <input type="datetime-local" name="startsAt" required className="mt-2 w-full rounded-2xl border p-3"/>
      </label>
      <label className="block font-bold">تنتهي
        <input type="datetime-local" name="endsAt" className="mt-2 w-full rounded-2xl border p-3"/>
      </label>
      <select name="courseId" className="w-full rounded-2xl border p-3" defaultValue="">
        <option value="">اربط بكورس (اختياري عند اختيار فصل)</option>
        {courses.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
      <select name="classId" className="w-full rounded-2xl border p-3" defaultValue="">
        <option value="">أو اربط بفصل (اختياري عند اختيار كورس)</option>
        {classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <p className="text-xs font-bold text-[#685d4d]">اختر كورسًا أو فصلًا لربط الحصة به.</p>
      <SubmitButton pending={pending}/>
      {result ? (
        <div role={result.ok ? "status" : "alert"}
          data-teacher-live-result={result.ok ? "success" : "error"}
          className="rounded-xl border p-3 text-sm font-bold">
          {result.message}
          {result.ok ? (
            <button type="button" onClick={() => router.refresh()} className="mr-3 underline">
              تحديث قائمة الحصص
            </button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
