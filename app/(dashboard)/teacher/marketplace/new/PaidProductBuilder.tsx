"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createPaidProduct } from "./actions";

export default function PaidProductBuilder() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  return (
    <form
      className="space-y-5 rounded-[2rem] border bg-white p-5 sm:p-7"
      onSubmit={async (event) => {
        event.preventDefault();

        if (busy) return;

        setBusy(true);
        setStatus("");

        const result = await createPaidProduct(
          new FormData(event.currentTarget),
        );

        setStatus(result.message);
        setBusy(false);

        if (result.ok) {
          router.refresh();
        }
      }}
    >
      <div>
        <h2 className="text-2xl font-black text-[#123f39]">
          أنشئ درسًا أو كورسًا مدفوعًا
        </h2>

        <p className="mt-2 text-sm leading-7 text-slate-600">
          السعر يحدده المعلم. عند كل عملية بيع يحصل المعلم على 85%، وتُخصم 15% لضاديوم تلقائيًا من عملية الدفع.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-black">
            نوع المنتج
          </span>
          <select
            name="productType"
            className="w-full rounded-2xl border p-3"
          >
            <option value="single">
              درس مدفوع مستقل
            </option>
            <option value="course">
              كورس / دورة
            </option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-black">
            طريقة التقديم
          </span>
          <select
            name="deliveryMode"
            className="w-full rounded-2xl border p-3"
          >
            <option value="recorded">
              مسجل
            </option>
            <option value="live">
              مباشر
            </option>
            <option value="mixed">
              مسجل + مباشر
            </option>
          </select>
        </label>

        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-black">
            اسم الدرس / الكورس
          </span>
          <input
            required
            minLength={3}
            maxLength={160}
            name="title"
            className="w-full rounded-2xl border p-3"
            placeholder="مثال: النحو من الصفر"
          />
        </label>

        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-black">
            وصف الإعلان في المتجر
          </span>
          <textarea
            name="description"
            rows={4}
            className="w-full rounded-2xl border p-3"
            placeholder="ماذا سيتعلم الطالب؟ ولمن هذا المحتوى؟"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-black">
            السعر بالدينار البحريني
          </span>
          <input
            required
            name="price"
            type="number"
            min="1"
            max="100"
            step="0.001"
            defaultValue="5.000"
            className="w-full rounded-2xl border p-3"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-black">
            عنوان أول درس
          </span>
          <input
            name="lessonTitle"
            className="w-full rounded-2xl border p-3"
            placeholder="يُستخدم اسم المنتج إذا تُرك فارغًا"
          />
        </label>

        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-black">
            محتوى الدرس
          </span>
          <textarea
            name="lessonContent"
            rows={7}
            className="w-full rounded-2xl border p-3"
            placeholder="اكتب المحتوى التعليمي الذي تملكه..."
          />
        </label>

        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-black">
            رابط فيديو HTTPS اختياري
          </span>
          <input
            name="videoUrl"
            type="url"
            value={videoUrl}
            onChange={(event) =>
              setVideoUrl(event.target.value)
            }
            className="w-full rounded-2xl border p-3"
            placeholder="https://..."
          />
        </label>

        {videoUrl ? (
          <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:col-span-2">
            <input
              name="rightsConfirmed"
              type="checkbox"
              className="mt-1 h-5 w-5"
            />
            <span className="text-sm font-bold leading-7 text-amber-950">
              أؤكد أنني أملك هذا الفيديو أو لدي ترخيص يسمح باستخدامه تجاريًا داخل الدورة. لا يكفي مجرد وجود الفيديو على الإنترنت.
            </span>
          </label>
        ) : null}

        <label className="flex items-center gap-3 rounded-2xl bg-[#f5f8f7] p-4 sm:col-span-2">
          <input
            name="publishNow"
            type="checkbox"
            className="h-5 w-5"
          />
          <span className="font-black text-[#123f39]">
            انشر الإعلان في سوق ضاديوم بعد الحفظ
          </span>
        </label>

        <button
          type="submit"
          disabled={busy}
          className="dadyoom-arabic-button rounded-2xl p-3 font-black text-white disabled:opacity-50 sm:col-span-2"
        >
          {busy
            ? "جارٍ الحفظ..."
            : "حفظ الدرس / الكورس"}
        </button>
      </div>

      {status ? (
        <div className="rounded-2xl bg-[#fff7e4] p-4 font-bold leading-7">
          {status}
        </div>
      ) : null}
    </form>
  );
}
