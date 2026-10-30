"use client";

import { useEffect, useRef, useState } from "react";

/**
 * No remote audio service, key, third-party tracking or paid dependency.
 * A device's Web Speech Arabic voice is optional, NEVER evidence that
 * recorded native-speaker audio exists or that playback has passed E2E.
 */
type Props = {
  script: string;
};

export default function ListeningScriptPlayer({ script }: Props) {
  const spokenRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [showTeacherScript, setShowTeacherScript] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      spokenRef.current = null;
    };
  }, []);

  function stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    spokenRef.current = null;
    setSpeaking(false);
  }

  function play() {
    setMessage("");
    if (speaking) {
      stop();
      return;
    }
    if (typeof window === "undefined" ||
        !("speechSynthesis" in window) ||
        !("SpeechSynthesisUtterance" in window)) {
      setMessage("هذا الجهاز لا يوفر القراءة الآلية؛ يرجى الاستماع إلى المعلم.");
      return;
    }
    const text = script.trim();
    if (!text) {
      setMessage("لا يوجد نص مسموع لهذا النشاط.");
      return;
    }
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    const voice = voices.find(v => v.lang.toLowerCase().startsWith("ar"));
    if (!voice) {
      setMessage("لا يوجد صوت عربي مُتاح في هذا المتصفح؛ يُقرأ النص بواسطة المعلم.");
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice.lang;
    utterance.voice = voice;
    utterance.rate = 0.83;
    utterance.pitch = 1;
    utterance.onend = () => {
      if (spokenRef.current === utterance) {
        spokenRef.current = null;
        setSpeaking(false);
      }
    };
    utterance.onerror = () => {
      if (spokenRef.current === utterance) {
        spokenRef.current = null;
        setSpeaking(false);
        setMessage("تعذر تشغيل الصوت العربي؛ يمكن للمعلم قراءة النص.");
      }
    };
    spokenRef.current = utterance;
    try {
      synth.speak(utterance);
      setSpeaking(true);
    } catch {
      spokenRef.current = null;
      setSpeaking(false);
      setMessage("تعذر تشغيل صوت الجهاز؛ يمكن للمعلم قراءة النص.");
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4" dir="rtl">
      <p className="text-sm font-bold text-sky-900">
        نشاط استماع موجَّه — استمع دون قراءة النص أولًا
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={play}
          aria-pressed={speaking}
          className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-bold text-white hover:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-800"
        >
          {speaking ? "⏹ إيقاف القراءة" : "🔊 جرّب القراءة العربية بصوت الجهاز"}
        </button>
        <button
          type="button"
          onClick={() => setShowTeacherScript(x => !x)}
          aria-expanded={showTeacherScript}
          className="rounded-xl border border-sky-300 bg-white px-4 py-2 text-sm font-bold text-sky-900 hover:bg-sky-100"
        >
          {showTeacherScript ? "إخفاء نص المعلم" : "إظهار نص المعلم عند الحاجة"}
        </button>
      </div>
      <p className="mt-2 text-xs leading-6 text-slate-700">
        الصوت يعتمد على وجود صوت عربي في الجهاز؛ لا توجد ملفات صوتية مسجّلة لهذا النشاط.
        إن لم تتوفر قراءة عربية، يقرأ المعلم النص.
      </p>
      {message ? <p role="status" className="mt-2 text-sm font-bold text-rose-700">{message}</p> : null}
      {showTeacherScript ? (
        <div className="mt-3 rounded-xl bg-white p-3">
          <p className="text-sm font-bold text-slate-800">نص مخصص للمعلم أو لاحتياجات الوصول</p>
          <p className="mt-1 whitespace-pre-wrap leading-8 text-slate-800">{script}</p>
        </div>
      ) : null}
    </div>
  );
}
