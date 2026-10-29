"use client";

import { useArabicSpeech } from "@/hooks/use-arabic-speech";

/**
 * A real browser-driven Arabic speech smoke test; no prerecorded audio is implied.
 * Uses the same Arabic TTS hook as lesson activities.
 */
export default function ArabicVoiceCheck() {
  const { speak, stop, status, error } = useArabicSpeech();
  const speaking = status === "speaking";

  return (
    <section aria-labelledby="arabic-voice-check-title" dir="rtl" className="mt-5 rounded-3xl border border-sky-200 bg-white p-5 text-slate-900">
      <h2 id="arabic-voice-check-title" className="text-lg font-black">افحص الصوت العربي هنا</h2>
      <p className="mt-2 text-sm leading-7 text-slate-700">
        يستخدم هذا الفحص خدمة النطق المتوفرة في متصفحك أو جهازك، ولا يعني وجود ملفات صوتية مسجلة لكل درس.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (speaking) {
              stop();
            } else {
              void speak("مرحبًا بك في ضاديوم. اسْتَمِعْ جيدًا إلى الجملة ثم أجب عن الأسئلة.");
            }
          }}
          className="rounded-xl bg-sky-800 px-5 py-3 font-bold text-white hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          {speaking ? "إيقاف الصوت" : "تشغيل اختبار الصوت العربي"}
        </button>
        <span aria-live="polite" role="status" className="text-sm text-slate-700">
          {speaking ? "جاري النطق" : status === "error" ? "تعذر تشغيل النطق" : "جاهز للتجربة"}
        </span>
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
