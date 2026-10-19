"use client";

import { useEffect, useMemo, useState } from "react";

type Props = { title: string; content: string };

function panelsFromLesson(content: string): string[] {
  const body = content.trim();
  if (!body || body.length < 250) return [];
  const mark = [
    "مسار التعلّم الذاتي الموسّع",
    "مسار التعلم الذاتي",
    "الدرس التطبيقي الموسّع",
  ].map((item) => body.lastIndexOf(item)).filter((x) => x >= 0);
  const relevant = mark.length ? body.slice(Math.max(...mark)) : body;
  const parts = relevant.split(/\n\s*\n/g)
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter((x) => x.length > 65 &&
      !/^(تحقق الجودة|مصدر الدرس|حقوق المحتوى|هذا ليس النص|حالة التوثيق)/u.test(x))
    .map((x) => x.slice(0, 490));
  return parts.slice(0, 6);
}

export default function OriginalLessonVisualExplainer({ title, content }: Props) {
  const slides = useMemo(() => panelsFromLesson(content), [content]);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (!playing || slides.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [playing, slides.length]);
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  if (slides.length === 0) return null;

  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(slides[active]);
    utterance.lang = "ar";
    utterance.rate = 0.85;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const step = (next: number) => {
    setActive((next + slides.length) % slides.length);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return (
    <section dir="rtl" aria-label="شرح مرئي تفاعلي أصلي من ضاديوم" className="space-y-4 rounded-3xl border border-[#d9c596] bg-white p-4 sm:p-6">
      <div>
        <p className="text-xs font-black text-amber-700">وسيلة شرح مرئية مجانية من ضاديوم</p>
        <h2 className="mt-1 text-2xl font-black text-[#123f39]">{title}</h2>
        <p className="mt-2 text-sm leading-7 text-[#696357]">
          عرض شرائح نصية متحركة مأخوذة من شرح ضاديوم الأصلي للدرس؛
          ليس فيديو مصورًا أو تسجيلًا رسميًا للوزارة. القراءة الصوتية اختيارية حسب دعم جهازك.
        </p>
      </div>
      <div className="relative flex min-h-72 aspect-video flex-col justify-center overflow-hidden rounded-[1.6rem] bg-[#123f39] p-5 text-white sm:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#dcb66b]/15" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-20 h-72 w-72 rounded-full bg-[#3cb6a0]/20" />
        <div className="relative z-10">
          <p className="mb-4 text-xs font-black text-[#f0d79d]">الشرح المرئي • المشهد {active + 1} من {slides.length}</p>
          <p key={active} className="whitespace-pre-line text-lg font-bold leading-10 sm:text-2xl sm:leading-[2]">
            {slides[active]}
          </p>
        </div>
        <div className="absolute bottom-0 right-0 left-0 flex h-2 bg-white/20">
          {slides.map((_, i) => (
            <span key={i} className={i <= active ? "bg-[#dcb66b]" : "bg-transparent"} style={{ width: `${100 / slides.length}%` }} />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setPlaying((x) => !x)} className="rounded-xl bg-[#123f39] px-5 py-3 font-black text-white">
          {playing ? "إيقاف العرض مؤقتًا" : "تشغيل العرض المتحرك"}
        </button>
        <button type="button" onClick={() => step(active - 1)} className="rounded-xl border border-[#d5bc85] px-4 py-3 font-bold">المشهد السابق</button>
        <button type="button" onClick={() => step(active + 1)} className="rounded-xl border border-[#d5bc85] px-4 py-3 font-bold">المشهد التالي</button>
        <button type="button" onClick={speak} className="rounded-xl border border-[#90b7ac] bg-[#eef8f3] px-4 py-3 font-bold text-[#123f39]">
          {speaking ? "إيقاف القراءة الصوتية" : "اقرأ المشهد صوتيًا"}
        </button>
      </div>
      <p className="text-xs leading-6 text-[#696357]">
        هذا العرض مساعد للتعلم الذاتي ولا يحل محل نص الكتاب المدرسي.
        عند غياب فيديو مطابق للدرس، لا نعرض مقطعًا عشوائيًا من موضوع آخر.
      </p>
    </section>
  );
}
