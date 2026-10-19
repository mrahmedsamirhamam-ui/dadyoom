"use client";

import { useEffect, useMemo, useState } from "react";

type Props = { title: string; content: string };

function extractOriginalListeningScript(content: string): string | null {
  const lines = content.split(/\r?\n/u).map((line) => line.trim());
  const start = lines.findIndex((line) =>
    /^نص استماع أصلي/u.test(line) &&
    /يقرأه المعلم|يقرؤه المعلم|يقرأه المعلم|داعِم|داعم|ضاديوم/u.test(line)
  );
  if (start < 0) return null;
  const script = lines.slice(start + 1).find((line) => line.length > 70) ?? "";
  if (script.length < 70 || script.length > 1400) return null;
  return script;
}

export default function OriginalListeningPractice({ title, content }: Props) {
  const script = useMemo(() => extractOriginalListeningScript(content), [content]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [message, setMessage] = useState("");
  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);
  if (!script) return null;

  function play() {
    if (!script || typeof window === "undefined") return;
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setMessage("لا يدعم هذا الجهاز القراءة الصوتية. يمكن للمعلم قراءة النص من زر إظهار النص.");
      return;
    }
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(script);
    voice.lang = "ar-BH";
    voice.rate = 0.82;
    voice.pitch = 1;
    const arabic = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("ar"));
    if (arabic) voice.voice = arabic;
    voice.onend = () => setState("idle");
    voice.onerror = () => {
      setState("idle");
      setMessage("تعذرت القراءة الصوتية على الجهاز. استخدم النص للقراءة بمساعدة المعلم.");
    };
    setMessage("");
    setState("playing");
    window.speechSynthesis.speak(voice);
  }

  function pauseOrResume() {
    if (!("speechSynthesis" in window)) return;
    if (state === "playing") {
      window.speechSynthesis.pause();
      setState("paused");
    } else if (state === "paused") {
      window.speechSynthesis.resume();
      setState("playing");
    }
  }

  function stop() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setState("idle");
  }

  return (
    <section dir="rtl" aria-label="استماع تدريبي من ضاديوم"
      className="rounded-3xl border border-[#b5d6c8] bg-[#f0faf5] p-5 text-[#123f39] sm:p-7">
      <p className="text-xs font-black text-[#397c67]">تدريب استماع أصلي — لا يتضمن تسجيل الوزارة</p>
      <h2 className="mt-2 font-arabic-display text-xl font-black leading-9 sm:text-2xl">
        استمع أولًا، ثم اختبر فهمك: {title}
      </h2>
      <p className="mt-2 text-sm leading-7">
        استمع إلى النص مرتين. تُنشئ القراءة الصوتية باستخدام قدرات جهازك مجانًا،
        وقد يختلف النطق وجودة الصوت من هاتف إلى آخر.
        ويمكن للمعلم أو ولي الأمر قراءة النص عند تعذّر الصوت.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={play}
          className="min-h-11 rounded-xl bg-[#123f39] px-5 py-3 text-sm font-black text-white">
          {state === "idle" ? "استمع إلى النص" : "أعد الاستماع من البداية"}
        </button>
        <button type="button" onClick={pauseOrResume} disabled={state === "idle"}
          className="min-h-11 rounded-xl border border-[#88b4a3] bg-white px-5 py-3 text-sm font-bold disabled:opacity-40">
          {state === "paused" ? "استئناف الصوت" : "إيقاف مؤقت"}
        </button>
        <button type="button" onClick={stop} disabled={state === "idle"}
          className="min-h-11 rounded-xl border border-[#88b4a3] bg-white px-5 py-3 text-sm font-bold disabled:opacity-40">
          إيقاف الصوت
        </button>
        <button type="button" aria-expanded={showTranscript} onClick={() => setShowTranscript((prev) => !prev)}
          className="min-h-11 rounded-xl border border-[#b59d61] bg-[#fff9e9] px-5 py-3 text-sm font-bold">
          {showTranscript ? "إخفاء النص المساند" : "إظهار النص المساند"}
        </button>
      </div>
      {message ? <p role="status" className="mt-3 text-sm font-bold text-[#8d4f26]">{message}</p> : null}
      {showTranscript ? (
        <div className="mt-5 rounded-2xl border border-[#ddcfad] bg-white p-4">
          <p className="mb-2 text-xs font-black text-[#86641e]">نص تدريبي من تأليف ضاديوم — للمراجعة وإتاحة الوصول</p>
          <p className="font-arabic-reading text-xl leading-[2]">{script}</p>
        </div>
      ) : null}
      <p className="mt-4 text-xs leading-6 text-[#5e7065]">
        تُقيَّم مهارة الاستماع بمساعدة المعلم أو بعد سماع المقطع؛
        هذا النص بديل تدريبي داعم لا يثبت مطابقة نص الاستماع الوزاري.
      </p>
    </section>
  );
}
