"use client";

import { useState } from "react";
import {
  getLetterLabMastery,
  isCorrectLetterSequence,
  LETTER_LAB_ACTIVITIES,
  LETTER_LAB_LEVELS,
  makeLetterTiles,
  type LetterLabLevel,
  type LetterTile,
} from "@/lib/letter-lab/activities";

type Stage = "initial" | "spelling" | "meaning" | "review" | "complete";
const LEVELS: LetterLabLevel[] = ["foundation", "building", "challenge"];
const STAGE_TITLES: Record<Exclude<Stage, "review" | "complete">, string> = {
  initial: "اكتشف الحرف الأول",
  spelling: "ابنِ الكلمة بنفسك",
  meaning: "اختر معنى الكلمة",
};

export default function LetterLabClient() {
  const [level, setLevel] = useState<LetterLabLevel>("foundation");
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("initial");
  const [selected, setSelected] = useState<LetterTile[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState("اختر الحرف الأول للكلمة بعد قراءة التلميح.");
  const words = LETTER_LAB_ACTIVITIES[level];
  const activity = words[index];
  const tiles = makeLetterTiles(activity);
  const slotsCount = Array.from(activity.word).length;
  const completedTasks = index * 3 + (stage === "initial" ? 0 : stage === "spelling" ? 1 : stage === "meaning" ? 2 : 3);
  const totalTasks = words.length * 3;

  function reset(nextLevel: LetterLabLevel) {
    setLevel(nextLevel);
    setIndex(0);
    setStage("initial");
    setSelected([]);
    setScore(0);
    setMisses(0);
    setFeedback("اختر الحرف الأول للكلمة بعد قراءة التلميح.");
  }

  function awardFirstAttempt() {
    if (misses === 0) setScore((current) => current + 1);
    setMisses(0);
  }

  function chooseFirst(letter: string) {
    if (stage !== "initial") return;
    if (letter !== Array.from(activity.word)[0]) {
      setMisses((current) => current + 1);
      setFeedback("حاول مجددًا. استمع إلى بداية الكلمة أو اقرأ تلميحها.");
      return;
    }
    awardFirstAttempt();
    setFeedback("أحسنت! اختر البطاقات بالترتيب من أول حرف إلى آخر حرف.");
    setStage("spelling");
  }

  function addTile(tile: LetterTile) {
    if (stage !== "spelling" || selected.some((item) => item.id === tile.id) || selected.length >= slotsCount) return;
    setSelected((current) => [...current, tile]);
    setFeedback("يمكنك حذف آخر حرف وتصحيح ترتيبك قبل التحقق.");
  }

  function checkSpelling() {
    if (stage !== "spelling") return;
    if (selected.length !== slotsCount) {
      setFeedback("أكمل جميع خانات الكلمة أولًا.");
      return;
    }
    if (!isCorrectLetterSequence(selected.map((tile) => tile.value), activity.word)) {
      setMisses((current) => current + 1);
      setFeedback("الترتيب لم يكتمل على الوجه الصحيح. أعد المحاولة واقرأ الكلمة من اليمين إلى اليسار.");
      setSelected([]);
      return;
    }
    awardFirstAttempt();
    setFeedback("ممتاز! بقي أن تفهم معنى الكلمة وتستخدمها.");
    setStage("meaning");
  }

  function chooseMeaning(choice: string) {
    if (stage !== "meaning") return;
    if (choice !== activity.correctMeaning) {
      setMisses((current) => current + 1);
      setFeedback("تأمل التلميح وجرب اختيار معنى آخر.");
      return;
    }
    awardFirstAttempt();
    setFeedback("أنجزت مراحل الكلمة الثلاث. اقرأ المثال لتثبيت المعنى.");
    setStage("review");
  }

  function nextWord() {
    if (index + 1 >= words.length) {
      setStage("complete");
      return;
    }
    setIndex((current) => current + 1);
    setStage("initial");
    setSelected([]);
    setMisses(0);
    setFeedback("كلمة جديدة! اقرأ التلميح واختر حرف البداية.");
  }

  function speakWord() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setFeedback("النطق الآلي غير متاح على هذا الجهاز؛ اقرأ الكلمة والمثال المكتوبين.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(activity.word);
    utterance.lang = "ar-SA";
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div dir="rtl" className="mx-auto max-w-6xl px-4 pb-20 pt-8 text-[#23413b] sm:px-6">
      <div className="rounded-[2rem] border border-[#dfd2b9] bg-[#fffef9] p-5 shadow-lg shadow-[#174f47]/5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-extrabold text-[#a17128]">مدينة الحروف الحية • تجربة إثرائية</p>
            <h1 className="mt-2 font-arabic-display text-3xl font-black sm:text-4xl">من الحرف إلى المعنى</h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-[#6e655b]">
              الحروف لا تدخل العقل وحدها؛ أنت تختارها وترتبها وتستخدمها. تعلم بثلاث خطوات قصيرة وتغذية راجعة فورية.
            </p>
          </div>
          <div className="rounded-2xl bg-[#edf5f1] px-5 py-3 text-sm font-bold text-[#174f47]">
            النقاط من أول محاولة: <span className="text-xl font-black">{score} / {totalTasks}</span>
          </div>
        </div>

        <fieldset className="mt-7">
          <legend className="mb-3 text-sm font-black">اختر مستوى التدريب</legend>
          <div className="flex flex-wrap gap-2" aria-label="مستويات التدريب">
            {LEVELS.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={level === key}
                onClick={() => reset(key)}
                className={level === key
                  ? "rounded-xl bg-[#174f47] px-5 py-3 font-bold text-white shadow-sm"
                  : "rounded-xl border border-[#d6c6a9] bg-white px-5 py-3 font-bold text-[#675b4d] hover:bg-[#f7f0e3]"}
              >
                {LETTER_LAB_LEVELS[key].label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[#766c60]">{LETTER_LAB_LEVELS[level].description}</p>
        </fieldset>

        <div className="mt-7" aria-label="مقدار تقدمك في التدريب">
          <div className="mb-2 flex justify-between text-xs font-black">
            <span>تقدم التعلّم</span>
            <span>{Math.min(completedTasks, totalTasks)} من {totalTasks} مهام</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#e9dfcd]">
            <div className="h-full rounded-full bg-[#32776d] transition-[width] duration-300" style={{ width: (Math.min(completedTasks, totalTasks) / totalTasks) * 100 + "%" }} />
          </div>
        </div>
      </div>

      {stage === "complete" ? (
        <section className="mt-6 rounded-[2rem] border border-[#dfd2b9] bg-white p-8 text-center shadow-sm" aria-live="polite">
          <span className="text-6xl" role="img" aria-label="احتفال">🎉</span>
          <h2 className="mt-5 text-3xl font-black">أكملت رحلة الكلمات!</h2>
          <p className="mt-3 text-xl font-bold text-[#174f47]">{score} من {totalTasks} نقاط من المحاولة الأولى</p>
          <p className="mt-3 text-[#6e655b]">{getLetterLabMastery(score, totalTasks)}</p>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#6e655b]">
            هذه نتيجة تدريبية داخل الجلسة فقط، وليست درجة مدرسية رسمية. لا تُرسل نتائجك ولا تُحفظ على خادم.
          </p>
          <button type="button" onClick={() => reset(level)} className="mt-7 rounded-xl bg-[#174f47] px-7 py-3 font-bold text-white">
            أعد الرحلة لتحسين إتقانك
          </button>
        </section>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-[2rem] border border-[#dbc9a5] bg-[#f3e8d0] p-5 sm:p-7" aria-label="مشهد الحروف التفاعلي">
            <p className="text-sm font-extrabold text-[#72551c]">كلمة {index + 1} من {words.length}</p>
            <div className="letter-lab-scene relative mx-auto mt-4 flex h-[320px] max-w-lg flex-col items-center overflow-hidden rounded-[2rem] border border-[#dac398] bg-gradient-to-b from-[#fefaf0] via-[#f4ead9] to-[#e5d7bc] pt-5 sm:h-[350px]">
              <div aria-hidden="true" className="absolute inset-x-4 top-5 flex justify-between opacity-30">
                <span className="text-2xl">✦</span><span className="text-2xl">✧</span><span className="text-2xl">✦</span>
              </div>
              <div className="z-10 rounded-full bg-[#fffef9]/90 px-5 py-2 text-sm font-black text-[#174f47] shadow-sm">
                أفكّر ← أجرّب ← أتعلّم
              </div>
              <div className="pointer-events-none relative mt-3 h-28 w-56" aria-hidden="true">
                {Array.from(activity.word).slice(0, 6).map((letter, position) => (
                  <span
                    key={activity.id + "-" + position}
                    className="letter-lab-fall absolute top-0 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#b99b62] bg-white text-2xl font-black text-[#174f47] shadow-md"
                    style={{ right: (position % 5) * 21 + "%", animationDelay: position * 0.23 + "s" }}
                  >{letter}</span>
                ))}
              </div>
              <div className="pointer-events-none relative -mt-2 h-16 w-44 border-x-[4px] border-t-[7px] border-[#c3a874] bg-[#d8c39d]/35 [clip-path:polygon(0_0,100%_0,61%_100%,39%_100%)]" aria-hidden="true" />
              <div className="pointer-events-none relative -mt-1 flex h-24 w-48 flex-col items-center justify-center rounded-[45%_45%_24%_24%] border-[5px] border-[#9f8760] bg-[#fffbf2] shadow-inner" aria-hidden="true">
                <span className="text-4xl">🧠</span>
                <span className="text-xs font-black text-[#174f47]">بناء المعرفة</span>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-[#dfcda7] bg-[#fffaf0] p-5 text-center">
              <span className="text-5xl" role="img" aria-label={activity.clue}>{activity.icon}</span>
              <p className="mt-3 text-lg font-bold text-[#493f33]">التلميح: {activity.clue}</p>
              <button type="button" onClick={speakWord} className="mt-4 rounded-xl border border-[#32776d] bg-white px-4 py-2 text-sm font-bold text-[#174f47] hover:bg-[#edf5f1]">
                🔊 استمع إلى الكلمة (إن دعم الجهاز العربية)
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#dfd2b9] bg-[#fffef9] p-5 shadow-sm sm:p-8" aria-label="أنشطة تعلم الكلمة">
            {stage === "review" ? (
              <div>
                <p className="text-sm font-extrabold text-[#a17128]">اكتمل تدريب هذه الكلمة</p>
                <h2 className="mt-5 text-4xl font-black text-[#174f47]">{activity.word}</h2>
                <p className="mt-5 rounded-2xl bg-[#edf5f1] p-5 text-lg font-bold leading-8">{activity.example}</p>
                <p className="mt-4 text-[#655d53]">اقرأ الجملة بصوتك، ثم انتقل إلى الكلمة التالية.</p>
                <button type="button" onClick={nextWord} className="mt-7 w-full rounded-xl bg-[#174f47] px-6 py-4 font-black text-white">
                  {index + 1 === words.length ? "اعرض نتيجة التدريب" : "الكلمة التالية ←"}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-extrabold text-[#a17128]">المرحلة {stage === "initial" ? "١" : stage === "spelling" ? "٢" : "٣"} من ٣</p>
                <h2 className="mt-3 font-arabic-display text-2xl font-black">{STAGE_TITLES[stage]}</h2>
                {stage === "initial" ? (
                  <>
                    <p className="mt-4 text-[#6e655b]">أي حرف تبدأ به كلمة تدل على: <strong>{activity.clue}</strong>؟</p>
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      {activity.initialChoices.map((letter) => (
                        <button key={letter} type="button" onClick={() => chooseFirst(letter)} aria-label={"اختر الحرف " + letter} className="min-h-24 rounded-2xl border-2 border-[#dac9ac] bg-white text-5xl font-black text-[#174f47] shadow-sm hover:border-[#32776d] hover:bg-[#edf5f1] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#d6ad57]">
                          {letter}
                        </button>
                      ))}
                    </div>
                  </>
                ) : stage === "spelling" ? (
                  <>
                    <p className="mt-4 text-[#6e655b]">رتّب الحروف لتكتب: <strong>{activity.clue}</strong>.</p>
                    <div className="mt-5 flex min-h-18 flex-wrap justify-center gap-2 rounded-2xl border-2 border-dashed border-[#ceb991] bg-[#fcf7eb] p-3" aria-label="خانات الكلمة مرتبة من اليمين إلى اليسار">
                      {Array.from({ length: slotsCount }, (_, position) => (
                        <span key={position} className="flex h-12 w-10 items-center justify-center rounded-lg bg-white text-2xl font-black text-[#174f47] shadow-sm">
                          {selected[position]?.value ?? "ـ"}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap justify-center gap-2" aria-label="بطاقات الحروف">
                      {tiles.map((tile) => (
                        <button
                          key={tile.id}
                          type="button"
                          disabled={selected.some((item) => item.id === tile.id)}
                          onClick={() => addTile(tile)}
                          className="h-14 min-w-12 rounded-xl border border-[#d1bd99] bg-white px-3 text-3xl font-black text-[#174f47] shadow-sm hover:bg-[#edf5f1] disabled:cursor-not-allowed disabled:opacity-30"
                        >{tile.value}</button>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button type="button" onClick={checkSpelling} className="flex-1 rounded-xl bg-[#174f47] px-5 py-3 font-black text-white">تحقق من الكلمة</button>
                      <button type="button" onClick={() => setSelected((current) => current.slice(0, -1))} disabled={selected.length === 0} className="rounded-xl border border-[#d4c29f] px-5 py-3 font-bold disabled:opacity-40">احذف الأخير</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-4 text-[#6e655b]">ما المعنى المناسب لكلمة <strong className="text-[#174f47]">{activity.word}</strong>؟</p>
                    <div className="mt-6 grid gap-3">
                      {activity.meaningChoices.map((choice) => (
                        <button key={choice} type="button" onClick={() => chooseMeaning(choice)} className="min-h-16 rounded-xl border border-[#d4c29f] bg-white p-4 text-right font-bold leading-7 hover:border-[#32776d] hover:bg-[#edf5f1]">
                          {choice}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <p aria-live="polite" role="status" className="mt-7 min-h-18 rounded-2xl border border-[#c8ddd6] bg-[#eff7f3] p-4 text-sm font-bold leading-7 text-[#174f47]">
              {feedback}
            </p>
            <p className="mt-5 text-xs leading-6 text-[#746b60]">
              نتائج تدريب مؤقتة دون إنشاء حساب أو تخزين بيانات. هذه الأنشطة إثرائية وليست مرتبطة تلقائيًا بدرجات المناهج الرسمية.
            </p>
          </section>
        </div>
      )}

      <style jsx>{String.raw`
        .letter-lab-fall {
          animation: letter-lab-fall 3.3s ease-in infinite;
          transform-origin: center;
        }
        @keyframes letter-lab-fall {
          0% { opacity: 0; transform: translate3d(0, -12px, 0) rotate(-12deg); }
          20% { opacity: 1; }
          72% { opacity: 1; transform: translate3d(-12px, 64px, 0) rotate(12deg); }
          100% { opacity: 0; transform: translate3d(0, 120px, 0) scale(.65); }
        }
        @media (prefers-reduced-motion: reduce) {
          .letter-lab-fall { animation: none; opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
