"use client";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createSchoolMeetingWithResult, initialSchoolMeetingActionState } from "@/features/live/actions";
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}
    className="w-full rounded-xl bg-violet-700 px-5 py-3 font-black text-white disabled:opacity-60">
    {pending ? "جارٍ حفظ الاجتماع..." : "إنشاء غرفة الاجتماع"}
  </button>;
}
export default function SchoolMeetingCreationForm() {
  const [state, submit] = useActionState(createSchoolMeetingWithResult, initialSchoolMeetingActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    router.refresh();
  }, [state.ok, router]);
  return (
          <form
            action={submit}
            ref={formRef}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-black text-slate-900">
              اجتماع جديد
            </h2>

            <p className="mt-3 text-sm font-bold text-violet-800">المواعيد بتوقيت البحرين (UTC+3).</p>
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

              <SubmitButton />
              {state.message ? (
                <p role={state.ok ? "status" : "alert"} data-school-meeting-result={state.ok ? "success" : "error"} className="rounded-xl border p-3 text-sm font-bold">{state.message}</p>
              ) : null}
            </div>
          </form>
  );
}
