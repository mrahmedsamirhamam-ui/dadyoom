"use client";

import { useState } from "react";
import Link from "next/link";
import {
  checkDictation,
  DICTATION_LEVELS,
  DICTATION_TASKS,
  type DictationLevel,
  type DictationResult,
} from "@/lib/arabic-lab/dictation";

const levels: DictationLevel[] = ["foundation", "building", "challenge"];

const existingTools = [
  {
    icon: "✍️",
    title: "تعبير وكتابة تكيفية",
    detail: "موضوع كتابة، ملاحظات على الأسلوب والإملاء، وفرص لتحسين النص.",
    href: "/skills/writing/practice",
    cta: "ابدأ تدريب الكتابة",
  },
  {
    icon: "📖",
    title: "فهم المقروء",
    detail: "نصوص وأسئلة في الفكرة والتفاصيل والمفردات والاستنتاج.",
    href: "/skills/reading/practice",
    cta: "تدرّب على القراءة",
  },
  {
    icon: "🧩",
    title: "مختبر الحروف",
    detail: "من الحرف إلى بناء الكلمة ومعناها في مستويات متدرجة.",
    href: "/labs/letters",
    cta: "اكتشف مختبر الحروف",
  },
  {
    icon: "🧠",
    title: "ضاد المساعد",
    detail: "اسأل عن اللغة العربية، وناقش الإجابة بدل الاكتفاء بحفظها.",
    href: "/ask",
    cta: "اسأل ضاد",
  },
  {
    icon: "📚",
    title: "قاموس السياق",
    detail: "استكشف المفردات ومعانيها في سياق الجملة.",
    href: "/dictionary",
    cta: "افتح القاموس",
  },
  {
    icon: "🎯",
    title: "التدريب التكيفي",
    detail: "اختر خطوة التدريب التالية بناءً على المهارات المتاحة.",
    href: "/skills/adaptive",
    cta: "ابدأ التدريب",
  },
];

export default function ArabicLabClient() {
  const [level, setLevel] = useState<DictationLevel>("foundation");
  const [taskIndex, setTaskIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<DictationResult | null>(null);
  const [showText, setShowText] = useState(false);
  const [speechUnavailable, setSpeechUnavailable] = useState(false);
  const tasks = DICTATION_TASKS[level];
  const task = tasks[taskIndex];

  function resetTask(nextLevel: DictationLevel, nextIndex: number) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setLevel(nextLevel);
    setTaskIndex(nextIndex);
    setAnswer("");
    setResult(null);
    setShowText(false);
    setSpeechUnavailable(false);
  }

  function listen() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechUnavailable(true);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(task.sentence);
    utterance.lang = "ar-SA";
    utterance.rate = 0.8;
    utterance.onerror = () => setSpeechUnavailable(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function check() {
    if (!answer.trim()) {
      setResult(null);
      return;
    }
    setResult(checkDictation(answer, task.sentence));
  }

  return (
    <div dir="rtl" className="mx-auto max-w-6xl px-4 py-8 text-[#23413b] sm:px-6">
      <section className="rounded-[2rem] bg-[#174f47] px-6 py-9 text-[#fffaf0] sm:px-10">
        <p className="text-sm font-extrabold text-[#f2d99c]">ضاديوم • بيت العربية الرقمي</p>
        <h1 className="mt-3 font-arabic-display text-3xl font-black leading-normal sm:text-5xl">
          مختبر العربية الذكي
        </h1>
        <p className="mt-3 max-w-3xl text-lg leading-9 text-[#fff5de]">
          أستكشف، أتدرّب، أكتشف خطئي، أصلحه، ثم أرتقي بمهاراتي في اللغة العربية.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#f2d99c]">
          هذه بوابة تجمع أدوات ضاديوم القائمة مع تجربة إملاء إثرائية مستقلة. لا تعني اعتماد الدروس رسميًا أو اكتمال مناهج الدول.
        </p>
      </section>

      <section aria-labelledby="dictation-title" className="mt-8 rounded-[2rem] border border-[#dfd2b9] bg-[#fffef9] p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-[#986b24]">تجربة إثرائية جديدة • دون تسجيل الإجابات</p>
            <h2 id="dictation-title" className="mt-2 text-2xl font-black sm:text-3xl">📝 مختبر الإملاء الموجّه</h2>
            <p className="mt-3 max-w-2xl leading-8 text-[#645a4d]">
              استمع إلى الجملة، واكتبها بنفسك، ثم اعرف المهارة الإملائية التي تحتاج إلى ممارسة.
              هذا فحص محلي لقواعد محددة، وليس تصحيحًا شاملًا بالذكاء الاصطناعي.
            </p>
          </div>
          <span className="rounded-full bg-[#f6ecd6] px-4 py-2 text-sm font-bold text-[#654a1f]">
            الجملة {taskIndex + 1} من {tasks.length}
          </span>
        </div>

        <fieldset className="mt-6">
          <legend className="mb-3 text-base font-black">اختر مستوى التدريب</legend>
          <div className="flex flex-wrap gap-2">
            {levels.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={level === item}
                onClick={() => resetTask(item, 0)}
                className={`rounded-xl border px-4 py-3 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174f47] ${level === item ? "border-[#174f47] bg-[#174f47] text-white" : "border-[#dfd2b9] bg-white text-[#23413b] hover:bg-[#f6f0e5]"}`}
              >
                {DICTATION_LEVELS[item].label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-[#746b60]">{DICTATION_LEVELS[level].description}</p>
        </fieldset>

        <div className="mt-6 rounded-2xl bg-[#f8f0df] p-5">
          <p className="font-black">مهارة اليوم: {task.focus}</p>
          <p className="mt-2 leading-7">{task.hint}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={listen} className="rounded-xl bg-[#174f47] px-5 py-3 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174f47]">
              🔊 استمع للجملة
            </button>
            <button type="button" onClick={() => setShowText((v) => !v)} className="rounded-xl border border-[#174f47] bg-white px-5 py-3 font-bold text-[#174f47] focus-visible:outline-2 focus-visible:outline-offset-2">
              {showText ? "إخفاء الجملة" : "عرض الجملة كتابةً"}
            </button>
          </div>
          {speechUnavailable && <p role="status" className="mt-3 text-sm text-[#8d4b31]">الصوت غير متاح على هذا الجهاز. استخدم خيار «عرض الجملة كتابةً».</p>}
          {showText && <p className="mt-4 rounded-xl bg-white p-4 font-arabic-naskh text-2xl leading-loose" aria-label="الجملة المرجعية">{task.sentence}</p>}
        </div>

        <div className="mt-6">
          <label htmlFor="arabic-lab-answer" className="mb-3 block font-black">اكتب الجملة هنا</label>
          <textarea
            id="arabic-lab-answer"
            dir="rtl"
            rows={3}
            value={answer}
            onChange={(event) => { setAnswer(event.target.value); setResult(null); }}
            maxLength={300}
            spellCheck={false}
            placeholder="استمع، ثم اكتب الجملة بما تذكرته..."
            className="w-full rounded-2xl border border-[#cfc0a6] bg-white p-4 text-xl leading-9 text-[#27231f] focus-visible:outline-2 focus-visible:outline-[#174f47]"
          />
          <p className="mt-2 text-sm text-[#746b60]">للتدرّب بإنصاف، أوقف التصحيح التلقائي للوحة المفاتيح إن أمكن.</p>
          <button
            type="button"
            onClick={check}
            disabled={!answer.trim()}
            className="mt-4 rounded-xl bg-[#174f47] px-6 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            تحقق من كتابتي
          </button>
        </div>

        <div aria-live="polite" role="status" className="mt-5">
          {result && (
            <div className={`rounded-2xl border p-5 ${result.correct ? "border-[#8bbaa7] bg-[#eef8f2]" : "border-[#e7c99a] bg-[#fff7e9]"}`}>
              <p className="text-lg font-black">{result.correct ? "أحسنت! الجملة صحيحة إملائيًا في هذا التدريب." : "محاولة جيدة! راجع كتابتك ثم جرب مجددًا."}</p>
              {!result.correct && (
                <p className="mt-2 leading-7">
                  الكلمات التي تحتاج إلى مراجعة: {result.differences.length}؛
                  {result.differences.slice(0, 3).map((item) => ` الكلمة ${item.position}`).join("،")}.
                </p>
              )}
              <p className="mt-3 leading-7"><strong>قاعدة نتعلمها:</strong> {task.explanation}</p>
              {result.correct && <p className="mt-2 text-sm">هذه نتيجة تمرين قصير، وليست درجة مدرسية أو حكمًا على إتقان المنهج.</p>}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => resetTask(level, taskIndex)} className="rounded-xl border border-[#dfd2b9] px-5 py-3 font-bold hover:bg-[#f6f0e5]">
            إعادة المحاولة
          </button>
          <button type="button" onClick={() => resetTask(level, (taskIndex + 1) % tasks.length)} className="rounded-xl bg-[#c8943d] px-5 py-3 font-black text-[#241b0c]">
            {taskIndex + 1 === tasks.length ? "أعد جولة المستوى" : "الجملة التالية ←"}
          </button>
        </div>
      </section>

      <section aria-labelledby="arabic-lab-tools" className="mt-10">
        <h2 id="arabic-lab-tools" className="font-arabic-display text-2xl font-black sm:text-3xl">محطات مختبر العربية</h2>
        <p className="mt-2 leading-8 text-[#645a4d]">روابط إلى أدوات موجودة في المشروع؛ قد يتطلب بعضها تسجيل الدخول، ويظل تشغيل خدماتها مرتبطًا بإعدادات الموقع.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {existingTools.map((tool) => (
            <article key={tool.href} className="flex flex-col rounded-2xl border border-[#e5d8bf] bg-[#fffef9] p-5">
              <span aria-hidden="true" className="text-3xl">{tool.icon}</span>
              <h3 className="mt-3 text-xl font-black">{tool.title}</h3>
              <p className="mt-2 flex-1 leading-7 text-[#645a4d]">{tool.detail}</p>
              <Link href={tool.href} className="mt-5 inline-flex rounded-lg font-black text-[#174f47] underline decoration-[#c8943d] underline-offset-4 focus-visible:outline-2">
                {tool.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-[#dfd2b9] bg-[#f6ecd6] p-6">
        <h2 className="text-xl font-black">المختبر يتطور مع ضاديوم</h2>
        <p className="mt-2 leading-8">
          ربط المهارات بالمناهج الرسمية للدول الـ22، والتصحيح التفسيري المتقدم، وملف إنجاز الطالب، والمراجعة بإشراف المعلم مراحل لاحقة بعد مراجعة المحتوى والخصوصية والاختبارات.
        </p>
        <Link href="/courses" className="mt-3 inline-block font-black text-[#174f47] underline underline-offset-4">تصفح دروس المناهج الحالية</Link>
      </section>
    </div>
  );
}
