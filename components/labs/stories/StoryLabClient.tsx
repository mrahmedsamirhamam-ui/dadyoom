"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { describeStoryPractice, evaluateStoryChoice } from "@/lib/story-lab/evaluation";
import type { LearningStory } from "@/lib/story-lab/stories";

type Phase = "story" | "question" | "review" | "complete";

export default function StoryLabClient({ story }: { story: LearningStory }) {
  const [phase, setPhase] = useState<Phase>("story");
  const [sceneIndex, setSceneIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [message, setMessage] = useState("");
  const [spokenFallback, setSpokenFallback] = useState("");

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const scene = story.scenes[sceneIndex];
  const question = story.questions[questionIndex];
  const total = story.questions.length;

  function reset() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setPhase("story");
    setSceneIndex(0);
    setQuestionIndex(0);
    setWrongAttempts(0);
    setFirstTryCorrect(0);
    setMessage("");
    setSpokenFallback("");
  }

  function readText(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setSpokenFallback("النطق الآلي غير متاح؛ يمكنك قراءة النص المكتوب كاملًا.");
      return;
    }
    setSpokenFallback("");
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "ar-SA";
    speech.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
  }

  function nextScene() {
    if (sceneIndex + 1 >= story.scenes.length) {
      setPhase("question");
      setMessage("");
    } else {
      setSceneIndex((current) => current + 1);
    }
  }

  function answer(index: number) {
    if (phase !== "question") return;
    const result = evaluateStoryChoice(question, index);
    if (!result.correct) {
      setWrongAttempts((current) => current + 1);
      setMessage(result.feedback);
      return;
    }
    if (wrongAttempts === 0) setFirstTryCorrect((current) => current + 1);
    setMessage(result.feedback);
    setPhase("review");
  }

  function nextQuestion() {
    if (questionIndex + 1 >= total) {
      setPhase("complete");
      return;
    }
    setQuestionIndex((current) => current + 1);
    setWrongAttempts(0);
    setMessage("");
    setPhase("question");
  }

  const progress = phase === "story"
    ? (sceneIndex / story.scenes.length) * 40
    : phase === "complete"
      ? 100
      : 40 + ((questionIndex + (phase === "review" ? 1 : 0)) / total) * 60;

  return (
    <div dir="rtl" className="mx-auto max-w-5xl px-4 pb-16 pt-8 text-[#21433c] sm:px-6">
      <div className="rounded-[2rem] border border-[#dfd0b1] bg-[#fffef9] p-5 shadow-lg shadow-[#174f47]/5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold text-[#9b7128]">حكايات ضاديوم • {story.badge}</p>
            <h1 className="mt-2 font-arabic-display text-3xl font-black leading-snug sm:text-4xl">{story.title}</h1>
            <p className="mt-3 text-base text-[#635c52]">{story.subtitle}</p>
          </div>
          <Link href="/labs/stories" className="rounded-xl border border-[#d7c7a6] bg-white px-4 py-3 text-sm font-bold hover:bg-[#f7f0e3]">
            كل الحكايات
          </Link>
        </div>
        <div className="mt-6 rounded-xl bg-[#f0f5ef] p-4 text-sm leading-7">
          <strong>هدفي اليوم:</strong> {story.goal}
        </div>
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs font-extrabold">
            <span>{phase === "story" ? "نتابع القصة" : phase === "complete" ? "أكملت التجربة" : "أطبّق ما تعلّمت"}</span>
            <span>{Math.round(progress)}٪</span>
          </div>
          <div role="progressbar" aria-label="تقدم نشاط القصة" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} className="h-3 overflow-hidden rounded-full bg-[#e9dfcd]">
            <div className="h-full rounded-full bg-[#32776d] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: progress + "%" }} />
          </div>
        </div>
      </div>

      {phase === "story" ? (
        <div className="mt-6 grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
          <section aria-label="مشهد القصة" className="flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-[#d9c392] bg-gradient-to-b from-[#f9f2e0] via-[#e5f1e9] to-[#e9dbc0] p-6 text-center">
            <div className="rounded-full border border-[#d5b97f] bg-white/85 px-4 py-2 text-sm font-black text-[#775322]">
              المشهد {sceneIndex + 1} من {story.scenes.length}
            </div>
            <div aria-hidden="true" className="my-5 text-8xl sm:text-9xl">{scene.symbol}</div>
            <p className="rounded-2xl bg-white/90 px-5 py-4 font-arabic-display text-2xl font-black leading-loose text-[#174f47] shadow-sm">
              {scene.focus}
            </p>
            <p className="mt-5 text-xs font-bold text-[#726755]">المشهد توضيحي، والنص المكتوب متاح دائمًا.</p>
          </section>

          <section aria-label="الحوار التعليمي" className="flex flex-col rounded-[2rem] border border-[#dfd0b1] bg-[#fffef9] p-6 sm:p-8">
            <p className="text-sm font-extrabold text-[#a17128]">
              {scene.speaker === "teacher" ? "المعلمة تشرح" : scene.speaker === "student" ? "الطالبة تسأل" : "الحروف تتحدث"}
            </p>
            <p className="mt-5 flex-1 font-arabic-reading text-2xl font-bold leading-[2.1] text-[#2b453e]">
              «{scene.line}»
            </p>
            <button type="button" onClick={() => readText(scene.line)} className="mt-6 self-start rounded-xl border border-[#32776d] bg-[#eef6f2] px-4 py-3 text-sm font-bold hover:bg-[#dcece6]">
              🔊 استمع إلى الحوار
            </button>
            {spokenFallback && <p role="status" className="mt-2 text-sm text-[#66594c]">{spokenFallback}</p>}
            <button type="button" onClick={nextScene} className="mt-8 min-h-12 w-full rounded-xl bg-[#174f47] px-5 py-3 font-extrabold text-white hover:bg-[#123f39] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#d6ad57]">
              {sceneIndex + 1 === story.scenes.length ? "هيا نتدرّب ←" : "المشهد التالي ←"}
            </button>
          </section>
        </div>
      ) : phase === "complete" ? (
        <section aria-live="polite" className="mt-6 rounded-[2rem] border border-[#dfd0b1] bg-[#fffef9] p-8 text-center">
          <div aria-hidden="true" className="text-6xl">🌟</div>
          <h2 className="mt-5 text-3xl font-black">أحسنت، أكملت الحكاية!</h2>
          <p className="mt-4 text-xl font-black text-[#174f47]">{firstTryCorrect} من {total} إجابات صحيحة من المحاولة الأولى</p>
          <p className="mx-auto mt-4 max-w-xl leading-8">{describeStoryPractice(firstTryCorrect, total)}</p>
          <div className="mx-auto mt-6 max-w-2xl rounded-xl bg-[#eef6f2] p-5 text-right leading-8">
            <strong>خلاصة الدرس:</strong> {story.closing}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={reset} className="rounded-xl bg-[#174f47] px-6 py-3 font-bold text-white hover:bg-[#123f39]">أعد التجربة</button>
            <Link href="/labs/stories" className="rounded-xl border border-[#cbb78f] px-6 py-3 font-bold hover:bg-[#f7f0e3]">اختر حكاية أخرى</Link>
          </div>
          <p className="mt-6 text-xs leading-7 text-[#72685d]">
            النتيجة توجيهية داخل هذه الجلسة فقط؛ لا تُسجل على الخادم ولا تُحتسب درجة أو إتقانًا رسميًا.
          </p>
        </section>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-[#dfd0b1] bg-[#f8efdd] p-6 sm:p-8">
            <p className="text-sm font-extrabold text-[#9b7128]">ما تعلمناه</p>
            <h2 className="mt-2 font-arabic-display text-2xl font-black">القاعدة بسهولة</h2>
            <p className="mt-5 font-arabic-reading text-xl leading-[2]">{story.rule}</p>
            <button type="button" onClick={() => readText(story.rule)} className="mt-5 rounded-xl border border-[#c4ab7c] bg-white px-4 py-3 text-sm font-bold hover:bg-[#faf3e6]">🔊 استمع إلى القاعدة</button>
            {spokenFallback && <p role="status" className="mt-2 text-sm">{spokenFallback}</p>}
          </section>
          <section className="rounded-[2rem] border border-[#dfd0b1] bg-[#fffef9] p-6 sm:p-8">
            <p className="text-sm font-extrabold text-[#9b7128]">تدريب {questionIndex + 1} من {total}</p>
            <h2 className="mt-3 text-xl font-black leading-9">{question.prompt}</h2>
            {phase === "question" ? (
              <div className="mt-6 grid gap-3">
                {question.choices.map((choice, index) => (
                  <button key={questionIndex + "-" + index} type="button" onClick={() => answer(index)}
                    className="min-h-16 rounded-xl border-2 border-[#dac9ac] bg-white px-5 py-3 text-right font-arabic-reading text-2xl font-bold leading-relaxed text-[#174f47] hover:border-[#32776d] hover:bg-[#eef6f2] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#d6ad57]">
                    {choice}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-[#c8ddd6] bg-[#eef6f2] p-5">
                <p className="text-lg font-black">✓ إجابة صحيحة</p>
                <p className="mt-3 leading-8">{message}</p>
                <button type="button" onClick={nextQuestion} className="mt-6 min-h-12 w-full rounded-xl bg-[#174f47] px-5 py-3 font-bold text-white hover:bg-[#123f39]">
                  {questionIndex + 1 === total ? "اعرض نتيجة التدريب" : "السؤال التالي ←"}
                </button>
              </div>
            )}
            {phase === "question" && (
              <p role="status" aria-live="polite" className="mt-6 min-h-12 rounded-xl bg-[#edf5f1] p-4 text-sm font-bold leading-7 text-[#174f47]">
                {message || "تأمل القاعدة ثم اختر إجابة واحدة."}
              </p>
            )}
            <p className="mt-5 text-xs leading-6 text-[#72685d]">تعلم بهدوء، ويمكنك إعادة المحاولة دون عقوبة. لا نسجل بياناتك أو نتيجتك.</p>
          </section>
        </div>
      )}
      <p className="mx-auto mt-7 max-w-3xl text-center text-xs leading-7 text-[#72685d]">
        تجربة تعليمية أصلية من ضاديوم، وليست درسًا وزاريًا معتمدًا أو اختبارًا مدرسيًا. لا تحتاج إلى حساب أو دفع.
      </p>
    </div>
  );
}
