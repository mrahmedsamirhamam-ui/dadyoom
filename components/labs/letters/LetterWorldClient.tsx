"use client";

import { useState } from "react";
import {
  ARABIC_LETTERS,
  ARABIC_VOWELS,
  getLetterChallengeOptions,
  letterWithVowel,
} from "@/lib/letter-lab/alphabet";

type Mode = "explore" | "challenge";

export default function LetterWorldClient() {
  const [selectedIndex, setSelectedIndex] = useState(12);
  const [mode, setMode] = useState<Mode>("explore");
  const [vowelIndex, setVowelIndex] = useState(0);
  const [angle, setAngle] = useState(-15);
  const [announcement, setAnnouncement] = useState("اختر حرفًا، ثم حركه واستمع إلى صوته.");
  const [completed, setCompleted] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [firstTry, setFirstTry] = useState<string[]>([]);
  const letter = ARABIC_LETTERS[selectedIndex];
  const options = getLetterChallengeOptions(selectedIndex);
  const done = completed.includes(letter.char);

  function selectLetter(index: number) {
    if (index < 0 || index >= ARABIC_LETTERS.length) return;
    setSelectedIndex(index);
    setVowelIndex(0);
    setAngle(-15);
    setAnnouncement("حرف " + ARABIC_LETTERS[index].name + "، اكتشف صوته وكلمته.");
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  function speak(value: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setAnnouncement("الصوت الآلي غير متاح هنا. اقرأ النص المشكول الظاهر على الشاشة.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = "ar-SA";
    utterance.rate = 0.78;
    window.speechSynthesis.speak(utterance);
    setAnnouncement("يجري نطق النص. قد تختلف دقة الصوت العربي بحسب الجهاز.");
  }

  function chooseAnswer(answer: string) {
    if (mode !== "challenge" || done) return;
    if (answer !== letter.char) {
      setMistakes((current) => current.includes(letter.char) ? current : [...current, letter.char]);
      setAnnouncement("ليست الإجابة المطلوبة بعد. استمع إلى بداية الكلمة وحاول مجددًا.");
      return;
    }
    setCompleted((current) => current.includes(letter.char) ? current : [...current, letter.char]);
    if (!mistakes.includes(letter.char)) {
      setFirstTry((current) => current.includes(letter.char) ? current : [...current, letter.char]);
    }
    setAnnouncement("أحسنت! عرفت بداية الكلمة. اقرأها ثم انتقل إلى حرف جديد.");
  }

  return (
    <div dir="rtl" className="mx-auto max-w-6xl px-4 pb-16 pt-8 text-[#183b39] sm:px-6">
      <div className="rounded-[2rem] border border-[#d8e5d9] bg-white/90 p-5 shadow-lg sm:p-8">
        <p className="text-sm font-extrabold text-[#956722]">ضاديوم • عالم الحروف الحية</p>
        <h1 className="mt-2 font-arabic-display text-3xl font-black sm:text-4xl">اكتشف الحروف العربية مع أصدقاء ضاديوم</h1>
        <p className="mt-3 max-w-3xl leading-8 text-[#556a65]">
          اختر حرفًا من الحروف الثمانية والعشرين، ودوّره، واكتشف حركاته وكلمة تبدأ به.
          ثم انتقل إلى التحدي لتختبر معرفتك. تجربة إثرائية مجانية لا تحفظ بيانات الأطفال.
        </p>
        <div className="mt-6 flex flex-wrap gap-3" role="group" aria-label="نوع التجربة">
          <button type="button" aria-pressed={mode === "explore"} onClick={() => { setMode("explore"); setAnnouncement("اختر الحركة لتكتشف صوت الحرف."); }}
            className={mode === "explore" ? "world-mode world-mode-active" : "world-mode"}>🔍 استكشف الحرف</button>
          <button type="button" aria-pressed={mode === "challenge"} onClick={() => { setMode("challenge"); setAnnouncement("اختر الحرف الذي تبدأ به الكلمة."); }}
            className={mode === "challenge" ? "world-mode world-mode-active" : "world-mode"}>🎯 تحدّي الحرف الأول</button>
          <span className="mr-auto self-center rounded-full bg-[#edf6ee] px-4 py-2 text-sm font-bold text-[#245d50]">
            أتقنت في المحاولة الأولى: {firstTry.length} / {ARABIC_LETTERS.length}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-[2rem] border border-[#badacb] bg-white shadow-sm" aria-label="مشهد الحرف المجسم">
          <div className="world-stage">
            <div className="world-orb world-orb-a" aria-hidden="true" />
            <div className="world-orb world-orb-b" aria-hidden="true" />
            <span className="world-star world-star-a" aria-hidden="true">✦</span>
            <span className="world-star world-star-b" aria-hidden="true">✧</span>
            <span className="world-star world-star-c" aria-hidden="true">✦</span>
            <div className="world-stage-title">{mode === "explore" ? "صديقك: حرف " + letter.name : "هل تعرف صديق الكلمة؟"}</div>
            <div className="world-model-space">
              <div className="world-ground" aria-hidden="true" />
              <div className="world-letter-model" aria-hidden="true" style={{ transform: "rotateX(-8deg) rotateY(" + angle + "deg)" }}>
                {Array.from({ length: 7 }, (_, index) => (
                  <span className={index === 6 ? "world-letter-layer world-letter-front" : "world-letter-layer world-letter-depth"}
                    key={index} style={{ transform: "translateZ(" + (index * 4) + "px)" }}>
                    {mode === "challenge" && !done ? "؟" : letter.char}
                  </span>
                ))}
                <span className="world-letter-eyes">● ᴗ ●</span>
              </div>
            </div>
            <div className="world-platform" aria-hidden="true" />
            <p className="world-stage-caption">
              {mode === "explore" ? "المس الزرين لتدوير الحرف في المشهد المجسم" : "انظر إلى الكلمة، ثم اختر حرف البداية"}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 bg-[#f4faf6] px-4 py-4">
            <button type="button" className="world-action" onClick={() => setAngle((a) => Math.max(-60, a - 20))} aria-label="أدر المجسم إلى اليمين">↪ تدوير يمين</button>
            <button type="button" className="world-action" onClick={() => setAngle((a) => Math.min(60, a + 20))} aria-label="أدر المجسم إلى اليسار">↩ تدوير يسار</button>
            <button type="button" className="world-action" onClick={() => setAngle(-15)}>إعادة العرض</button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#dce7dc] bg-[#fffef9] p-5 shadow-sm sm:p-7" aria-label="التعلم مع الحرف">
          {mode === "explore" ? (
            <>
              <span className="text-sm font-black text-[#a2712c]">الحرف {selectedIndex + 1} من ٢٨</span>
              <h2 className="mt-2 text-3xl font-black text-[#174f47]">{letter.name}</h2>
              <p className="mt-2 text-sm leading-7 text-[#69746b]">
                جرّب الحركات الثلاث على الحرف، واضغط للاستماع. النص المكتوب متاح دائمًا.
              </p>
              <fieldset className="mt-5">
                <legend className="mb-3 font-black">اختر حركة الحرف</legend>
                <div className="grid grid-cols-3 gap-2">
                  {ARABIC_VOWELS.map((vowel, index) => (
                    <button key={vowel.mark} type="button" aria-pressed={vowelIndex === index} onClick={() => setVowelIndex(index)}
                      className={vowelIndex === index ? "world-vowel world-vowel-active" : "world-vowel"}>
                      <span className="text-4xl font-black">{letterWithVowel(letter.char, index)}</span>
                      <span className="mt-2 block text-xs font-bold">{vowel.label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <button type="button" className="world-primary mt-4 w-full" onClick={() => speak(letterWithVowel(letter.char, vowelIndex))}>
                🔊 استمع إلى {letterWithVowel(letter.char, vowelIndex)}
              </button>
              {letter.char === "ا" && (
                <p className="mt-3 rounded-xl bg-[#fff4dc] p-3 text-xs leading-6 text-[#78541e]">
                  ملاحظة: تظهر الهمزة مع الألف في أمثلة «أَ، أُ، إِ». سنميز لاحقًا بين الألف والهمزة والمد.
                </p>
              )}
              <div className="mt-5 rounded-2xl border border-[#d9e4d4] bg-[#eff6ec] p-5 text-center">
                <span className="text-5xl" role="img" aria-label={letter.meaning}>{letter.emoji}</span>
                <p className="mt-2 text-3xl font-black text-[#174f47]">{letter.word}</p>
                <p className="mt-1 text-sm">{letter.meaning}</p>
                <button type="button" onClick={() => speak(letter.word)} className="world-action mt-3">🔊 استمع إلى الكلمة</button>
              </div>
              <button type="button" className="world-primary mt-5 w-full" onClick={() => { setMode("challenge"); setAnnouncement("اختر حرف البداية الصحيح."); }}>
                انتقل إلى التحدي ←
              </button>
            </>
          ) : (
            <>
              <span className="text-sm font-black text-[#a2712c]">تحدي تعرّف الحرف • {selectedIndex + 1} / ٢٨</span>
              <h2 className="mt-3 text-2xl font-black">ما الحرف الذي تبدأ به هذه الكلمة؟</h2>
              <div className="mt-5 rounded-2xl bg-[#eff6ec] p-5 text-center">
                <span className="text-6xl" role="img" aria-label={letter.meaning}>{letter.emoji}</span>
                <p className="mt-2 text-3xl font-black text-[#174f47]">{letter.word}</p>
                <p className="mt-1 text-sm">{letter.meaning}</p>
                <button type="button" className="world-action mt-3" onClick={() => speak(letter.word)}>🔊 استمع إلى الكلمة</button>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3" role="group" aria-label="اختر حرف البداية">
                {options.map((option) => (
                  <button key={option} type="button" disabled={done} onClick={() => chooseAnswer(option)}
                    aria-label={"اختر " + ARABIC_LETTERS.find((item) => item.char === option)?.name}
                    className="world-answer">
                    {option === "ا" ? "أ" : option}
                  </button>
                ))}
              </div>
              {done && <p className="mt-4 rounded-xl bg-[#e4f3e9] p-3 font-bold text-[#24654c]">✓ أتممت هذا الحرف في جلستك. جرّب حرفًا جديدًا.</p>}
              <button type="button" className="world-primary mt-5 w-full" onClick={() => selectLetter((selectedIndex + 1) % ARABIC_LETTERS.length)}>
                الحرف التالي ←
              </button>
            </>
          )}
          <p role="status" aria-live="polite" className="mt-5 min-h-12 rounded-xl bg-[#f2f7f5] p-3 text-sm font-bold leading-7 text-[#235d51]">{announcement}</p>
        </section>
      </div>

      <section className="mt-6 rounded-[2rem] border border-[#d8e6d9] bg-white p-5 sm:p-7" aria-label="جميع الحروف العربية">
        <h2 className="text-xl font-black">أصدقاء ضاديوم: الحروف الـ٢٨</h2>
        <p className="mt-2 text-sm leading-7 text-[#64736b]">اختر أي حرف. يمكنك تكرار التجربة بالترتيب الذي يناسبك.</p>
        <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-7 md:grid-cols-10">
          {ARABIC_LETTERS.map((item, index) => (
            <button key={item.char} type="button" onClick={() => selectLetter(index)}
              aria-pressed={selectedIndex === index} aria-label={"استكشف حرف " + item.name}
              className={selectedIndex === index ? "world-alphabet-key world-alphabet-selected" : "world-alphabet-key"}>
              <span>{item.char}</span>
              {completed.includes(item.char) && <span className="absolute left-1 top-1 text-xs" aria-label="تحدي مكتمل">✓</span>}
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs leading-6 text-[#69756c]">
          المجسمات ذات تأثير عمق ثلاثي الأبعاد بتقنية CSS، وليست نماذج WebGL كاملة. النطق آلي اختياري يختلف حسب الجهاز؛
          النتيجة تدريبية داخل هذه الجلسة فقط، بلا كاميرا أو ميكروفون أو حفظ أو مشاركة بيانات، ولا تمثل درجة مدرسية.
        </p>
      </section>
    </div>
  );
}
