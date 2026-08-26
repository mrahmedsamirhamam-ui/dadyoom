
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { LessonMediaActivity } from "@/features/teacher/queries/getLessonMediaActivities";

type Props = { lessonId: string; activities: LessonMediaActivity[] };

function MediaForm({ lessonId, activity }: { lessonId: string; activity?: LessonMediaActivity }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/teacher/lesson-media", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) throw new Error(data.error || "تعذر حفظ الوسائط.");

      setMessage(activity ? "تم حفظ وسائط النشاط." : "تم إنشاء نشاط الوسائط بنجاح.");
      if (!activity) event.currentTarget.reset();
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "تعذر حفظ الوسائط.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <input type="hidden" name="lesson_id" value={lessonId} />
      {activity ? <input type="hidden" name="activity_id" value={activity.id} /> : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-teal-700">{activity ? `النشاط ${activity.activityOrder}` : "نشاط وسائط جديد"}</p>
          <h3 className="mt-1 text-lg font-black text-slate-900">{activity?.title ?? "أضف نشاطًا بصريًا أو صوتيًا"}</h3>
        </div>
        {activity ? <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">{activity.activityType}</span> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-bold">عنوان النشاط</span>
          <input name="title" required={!activity} defaultValue={activity?.title ?? ""} maxLength={200} className="w-full rounded-xl border bg-white p-3" />
        </label>

        {!activity ? (
          <label className="block">
            <span className="mb-1 block text-sm font-bold">نوع النشاط</span>
            <select name="activity_type" defaultValue="reading" className="w-full rounded-xl border bg-white p-3">
              <option value="reading">قراءة / عرض</option>
              <option value="listening">استماع</option>
              <option value="speaking">تحدث</option>
              <option value="writing">كتابة</option>
            </select>
          </label>
        ) : null}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-bold">تعليمات النشاط</span>
        <textarea name="instructions" rows={2} defaultValue={activity?.instructions ?? ""} className="w-full rounded-xl border bg-white p-3" />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block rounded-xl bg-white p-4 ring-1 ring-slate-200">
          <span className="block font-black">صورة النشاط</span>
          {activity?.imageUrl ? <a href={activity.imageUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate text-sm font-bold text-teal-700">عرض الصورة الحالية</a> : <span className="mt-1 block text-sm text-slate-500">JPG / PNG / WEBP / GIF حتى 5MB</span>}
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-3 block w-full text-sm" />
          {activity?.imageUrl ? <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" name="remove_image" /> إزالة الصورة الحالية</label> : null}
        </label>

        <label className="block rounded-xl bg-white p-4 ring-1 ring-slate-200">
          <span className="block font-black">ملف صوتي</span>
          {activity?.audioUrl ? <a href={activity.audioUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate text-sm font-bold text-teal-700">تشغيل الملف الحالي</a> : <span className="mt-1 block text-sm text-slate-500">MP3 / WAV / OGG / WEBM / M4A حتى 10MB</span>}
          <input name="audio" type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4" className="mt-3 block w-full text-sm" />
          {activity?.audioUrl ? <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" name="remove_audio" /> إزالة الصوت الحالي</label> : null}
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-bold">النص المرتبط بالصوت</span>
        <textarea name="audio_text" rows={2} defaultValue={activity?.audioText ?? ""} placeholder="النص الذي يستمع إليه الطالب" className="w-full rounded-xl border bg-white p-3" />
      </label>

      <label className="block max-w-40">
        <span className="mb-1 block text-sm font-bold">النقاط</span>
        <input name="points" type="number" min={1} max={100} defaultValue={activity?.points ?? 5} className="w-full rounded-xl border bg-white p-3" />
      </label>

      {error ? <div role="alert" className="rounded-xl bg-rose-50 p-3 font-bold text-rose-700">{error}</div> : null}
      {message ? <div className="rounded-xl bg-emerald-50 p-3 font-bold text-emerald-700">{message}</div> : null}

      <button type="submit" disabled={busy} className="rounded-xl bg-teal-700 px-5 py-3 font-black text-white disabled:opacity-50">
        {busy ? "جارٍ الحفظ..." : activity ? "حفظ الوسائط" : "إنشاء النشاط"}
      </button>
    </form>
  );
}

export default function LessonMediaEditor({ lessonId, activities }: Props) {
  return (
    <section className="space-y-5 rounded-2xl border bg-white p-6">
      <div>
        <h2 className="text-2xl font-black">الوسائط والأنشطة</h2>
        <p className="mt-2 leading-7 text-slate-500">
          أضف صورًا أو ملفات صوتية موثوقة للأنشطة. الصور التي يرفعها المعلم هنا فقط تُفعّل تلقائيًا في صفحة الطالب، حتى لا تظهر صور آلية غير مراجعة.
        </p>
      </div>

      <details className="rounded-2xl border border-dashed border-teal-300 bg-teal-50/50 p-5">
        <summary className="cursor-pointer font-black text-teal-800">+ إضافة نشاط وسائط</summary>
        <div className="mt-4"><MediaForm lessonId={lessonId} /></div>
      </details>

      {activities.length > 0 ? (
        <div className="space-y-5">
          {activities.map((activity) => <MediaForm key={activity.id} lessonId={lessonId} activity={activity} />)}
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50 p-5 text-slate-600">
          لا توجد أنشطة بعد. استخدم «إضافة نشاط وسائط» لإنشاء أول نشاط للدرس.
        </div>
      )}
    </section>
  );
}
