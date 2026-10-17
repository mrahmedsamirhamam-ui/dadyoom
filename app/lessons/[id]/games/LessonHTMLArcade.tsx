"use client";
import Link from "next/link";
import DadyoomAnswerShooter from "./DadyoomAnswerShooter";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { GAME_MODES } from "@/lib/games/lesson-game-pack";
import type { GameMode, GamePack } from "@/lib/games/lesson-game-pack";

const themes: Record<GameMode, { title: string; icon: string; instruction: string; scene: string }> = {
  maze: { title: "حارس العربية — أكشن", icon: "🚀", instruction: "تحرك بالمقود وأطلق على المركبة التي تحمل الإجابة الصحيحة.", scene: "from-amber-200 to-emerald-100" },
  defender: { title: "حارس القلعة", icon: "🏰", instruction: "احمِ القلعة باختيار الدرع الذي يحمل الإجابة الصحيحة.", scene: "from-sky-200 to-blue-100" },
  catcher: { title: "صائد البالونات", icon: "🎈", instruction: "المس البالون الصحيح قبل أن يهرب.", scene: "from-violet-200 to-pink-100" },
  runner: { title: "سباق المسارات", icon: "🏃", instruction: "حدد مسارًا أولًا ثم انطلق عبر البوابة.", scene: "from-lime-200 to-teal-100" },
  guardian: { title: "كنز البطاقات", icon: "💎", instruction: "اكشف كل بطاقة باللمس ثم اختر كنز الإجابة الصحيحة.", scene: "from-indigo-950 to-violet-900" },
};
type Stage = "playing" | "feedback" | "complete";

export default function LessonHTMLArcade({ lesson }: { lesson: { id: string; title: string } }) {
  const [pack, setPack] = useState<GamePack | null>(null);
  const [mode, setMode] = useState<GameMode>("maze");
  const [index, setIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [stage, setStage] = useState<Stage>("playing");
  const [chosen, setChosen] = useState<string | null>(null);
  const [message, setMessage] = useState("جارٍ تحميل الألعاب…");
  const [warning, setWarning] = useState("");
  const [canSave, setCanSave] = useState(false);
  const [completed, setCompleted] = useState<Partial<Record<GameMode, number>>>({});
  const [lane, setLane] = useState(0);
  const [mazeWon, setMazeWon] = useState(true);
  const [revealed, setRevealed] = useState<string[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/lessons/games?lessonId=" + encodeURIComponent(lesson.id), {
      credentials: "same-origin", cache: "no-store", signal: controller.signal,
    }).then(async response => {
      const json = await response.json() as { pack?: GamePack; error?: string; progressSaved?: boolean; warning?: string };
      if (!response.ok || !json.pack) throw new Error(json.error ?? "تعذر تجهيز الألعاب.");
      if (controller.signal.aborted) return;
      setPack(json.pack);
      setCanSave(Boolean(json.progressSaved));
      setWarning(json.warning ?? "");
      setMessage("");
    }).catch(error => {
      if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "تعذر تحميل الألعاب.");
    });
    return () => controller.abort();
  }, [lesson.id]);

  const questions = pack?.[mode] ?? [];
  const current = questions[index];
  const options = current ? [...current.options] : [];
  function restart(target: GameMode) {
    setMode(target); setIndex(0); setPoints(0); setChosen(null);
    setStage("playing"); setLane(0); setRevealed([]); setMessage(""); setMazeWon(true);
  }
  function select(answer: string) {
    if (stage !== "playing" || !current) return;
    setChosen(answer);
    if (answer === current.answer) setPoints(value => value + 1);
    setStage("feedback");
  }
  async function finish(finalScore: number = points) {
    setStage("complete");
    setCompleted(old => ({ ...old, [mode]: finalScore }));
    if (!canSave) { setMessage("اللعب مجاني؛ سجل الدخول إذا أردت حفظ نتائجك."); return; }
    try {
      const response = await fetch("/api/games/complete", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, gameKey: mode, score: finalScore, maxScore: questions.length }),
      });
      const body = await response.json() as { ok?: boolean; xp?: number };
      setMessage(response.ok && body.ok
        ? "حفظنا محاولتك وأضفنا " + (body.xp ?? 0) + " نقطة خبرة."
        : "أنهيت الجولة؛ تعذر حفظ النقاط هذه المرة.");
    } catch { setMessage("أنهيت الجولة؛ تعذر الاتصال لحفظ النقاط."); }
  }
  function advance() {
    if (stage !== "feedback" || !current) return;
    if (index === questions.length - 1) { void finish(); return; }
    setIndex(old => old + 1);
    setChosen(null); setStage("playing"); setRevealed([]); setLane(0);
  }
  function runnerGo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (options[lane]) select(options[lane]);
  }

  return <main dir="rtl" className="min-h-screen bg-[#edf4ec] px-3 py-7 text-[#123f39] sm:px-6">
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="rounded-[2rem] bg-[#123f39] p-6 text-white sm:p-8">
        <Link href={"/lessons/" + lesson.id} className="rounded-full border border-white/40 px-4 py-2 font-bold">← العودة للدرس</Link>
        <p className="mt-5 text-sm font-black text-[#f2d18e]">🎮 ضاديوم • العب وتعلّم</p>
        <h1 className="mt-2 text-2xl font-black sm:text-4xl">{lesson.title}</h1>
        <p className="mt-3 text-sm leading-7 text-[#e5f5ed]">خمس ألعاب HTML تفاعلية مختلفة؛ لكل لعبة خمس مراحل بأسئلة من محتوى الدرس.</p>
      </header>
      <nav aria-label="اختر اللعبة" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {GAME_MODES.map(key => <button key={key} type="button" aria-pressed={mode === key}
          onClick={() => restart(key)}
          className={"min-h-28 rounded-3xl border-2 p-3 text-center font-black shadow-sm active:scale-95 " +
            (mode === key ? "border-[#ac8236] bg-[#123f39] text-white" : "border-[#d1d9c8] bg-white")}>
          <span className="block text-4xl">{themes[key].icon}</span>
          <span className="mt-2 block text-sm">{themes[key].title}</span>
          {completed[key] !== undefined && <span className="block text-xs">✓ {completed[key]}/5</span>}
        </button>)}
      </nav>
      {warning && <p role="note" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7">{warning}</p>}
      {message && <p role="status" className="rounded-2xl bg-[#fff4d8] p-4 font-bold">{message}</p>}
      {pack && mode === "maze" && stage !== "complete" &&
        <DadyoomAnswerShooter items={questions} onFinish={result => {
          setMazeWon(result.won);
          setPoints(result.score);
          setMessage(result.won ? "أتممت المهمة الحركية بنجاح!" : "انتهت الجولة؛ يمكنك إعادة المحاولة.");
          void finish(result.score);
        }}/>}
      {mode !== "maze" && current && stage !== "complete" && <section
        className={"rounded-[2rem] bg-gradient-to-b p-5 shadow-xl sm:p-8 " + themes[mode].scene +
          (mode === "guardian" ? " text-white" : "")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xl font-black">{themes[mode].icon} {themes[mode].title}</p>
            <p className="text-sm">السؤال {index + 1} من {questions.length}</p></div>
          <span className="rounded-full bg-white/80 px-4 py-2 font-black text-[#123f39]">⭐ {points}</span>
        </div>
        <div aria-label="مراحل الجولة" className="mt-4 flex gap-2">
          {questions.map((_, i) => <span key={i} className={"h-2.5 flex-1 rounded-full " +
            (i <= index ? "bg-[#ba832c]" : "bg-white/70")} />)}
        </div>
        <div className={"mt-5 rounded-3xl p-5 text-center sm:p-8 " +
          (mode === "guardian" ? "bg-white/15" : "bg-white/85")}>
          <p className="text-sm font-bold">{themes[mode].instruction}</p>
          <h2 className="mt-3 text-lg font-black leading-9 sm:text-2xl">{current.prompt}</h2>
        </div>
        {stage === "playing" && <div key={mode + "-" + index} className="mt-5">
          {mode === "runner" ? <form onSubmit={runnerGo}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {options.map((opt, i) => <button type="button" key={opt} aria-pressed={lane === i}
                onClick={() => setLane(i)}
                className={"min-h-40 rounded-3xl border-4 p-3 font-black " +
                  (lane === i ? "border-amber-500 bg-white" : "border-white/70 bg-white/50")}>
                <span className="block text-4xl">🚪</span>{opt}
                {lane === i && <span className="block text-3xl">🏃</span>}
              </button>)}
            </div>
            <button type="submit" className="mt-4 w-full rounded-2xl bg-[#123f39] p-4 font-black text-white">
              🏁 انطلق في المسار المختار
            </button>
          </form> : <div className={"grid gap-3 " +
            (mode === "catcher" || mode === "guardian" ? "grid-cols-2 sm:grid-cols-4" : "sm:grid-cols-2")}>
            {options.map((opt, i) => {
              const flipped = revealed.includes(opt);
              return <button type="button" key={opt} onClick={() =>
                mode === "guardian" && !flipped ? setRevealed(old => [...old, opt]) : select(opt)}
                aria-label={mode === "guardian" && !flipped ? "اكشف بطاقة " + (i + 1) : "اختر " + opt}
                className={"min-h-28 rounded-3xl border-4 p-3 text-center font-black shadow-lg active:scale-95 " +
                  (mode === "guardian" ? "border-amber-300 bg-white/10 text-white" :
                    mode === "catcher" ? "border-white bg-white/90 text-violet-900 sm:min-h-40" :
                    "border-[#d1a351] bg-white/95 text-[#123f39]")}>
                <span aria-hidden="true" className="block text-4xl">
                  {mode === "maze" ? "🚪" : mode === "defender" ? "🛡️" :
                    mode === "catcher" ? "🎈" : flipped ? "💎" : "❓"}
                </span>
                {mode === "guardian" && !flipped ? "اكشف البطاقة" : opt}
              </button>;
            })}
          </div>}
        </div>}
        {stage === "feedback" && <div role="status" aria-live="polite"
          className="mt-5 rounded-3xl bg-white p-6 text-center text-[#123f39] shadow-lg">
          <div className="text-5xl">{chosen === current.answer ? "🎉" : "💡"}</div>
          <h3 className="mt-3 text-xl font-black">{chosen === current.answer ? "إجابة رائعة!" : "تعلم من المحاولة"}</h3>
          <p className="mt-3 leading-8">الحل الصحيح: <strong>{current.answer}</strong></p>
          {current.explanation && <p className="mt-2 text-sm leading-7">{current.explanation}</p>}
          <button type="button" onClick={advance}
            className="mt-5 min-h-12 rounded-full bg-[#123f39] px-8 py-3 font-black text-white">
            {index === questions.length - 1 ? "🏆 عرض نتيجة اللعبة" : "المهمة التالية ←"}
          </button>
        </div>}
      </section>}
      {pack && stage === "complete" && <section role="status"
        className="rounded-3xl bg-white p-8 text-center shadow-lg">
        <span className="text-7xl">{mode === "maze" && !mazeWon ? "🛑" : "🏆"}</span>
        <h2 className="mt-4 text-3xl font-black">{mode === "maze" && !mazeWon ? "انتهت محاولة حارس العربية" : "أنهيت خمس مراحل!"}</h2>
        <p className="mt-3 text-xl font-black">{points} من {questions.length}</p>
        <p className="mt-2 text-sm">{message}</p>
        <button type="button" onClick={() => restart(mode)}
          className="mt-6 rounded-full bg-[#123f39] px-6 py-3 font-black text-white">العب مرة أخرى</button>
      </section>}
      <footer className="rounded-2xl bg-white p-4 text-center text-xs leading-7">
        الألعاب HTML وCSS وتعمل باللمس ولوحة المفاتيح. النقاط تدريبية وليست درجات رسمية للمنهج.
      </footer>
    </div>
  </main>;
}
