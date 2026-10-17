"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GAME_MODES } from "@/lib/games/lesson-game-pack";
import type { GameMode, GamePack } from "@/lib/games/lesson-game-pack";
import DadyoomAnswerShooter from "./DadyoomAnswerShooter";
import DadyoomAdventureCanvas from "./DadyoomAdventureCanvas";

const modes: Record<GameMode, { title: string; icon: string; short: string }> = {
  maze: { title: "حارس العربية", icon: "🚀", short: "تصويب وليزر" },
  defender: { title: "حماة القلعة", icon: "🏰", short: "دفاع عن الحصن" },
  catcher: { title: "سباق السيارات", icon: "🏎️", short: "سباق بالحارات" },
  runner: { title: "عدّاء الكلمات", icon: "🏃", short: "مغامرة جري" },
  guardian: { title: "إنقاذ الكنز", icon: "💎", short: "استكشاف وإنقاذ" },
};
type GameResult = { won: boolean; score: number };

export default function LessonHTMLArcade({ lesson }: { lesson: { id: string; title: string } }) {
  const [pack, setPack] = useState<GamePack | null>(null);
  const [mode, setMode] = useState<GameMode>("maze");
  const [serial, setSerial] = useState(0);
  const [done, setDone] = useState<GameResult | null>(null);
  const [completed, setCompleted] = useState<Partial<Record<GameMode, number>>>({});
  const [message, setMessage] = useState("جارٍ تحميل ألعاب ضاديوم الحركية…");
  const [warning, setWarning] = useState("");
  const [canSave, setCanSave] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryable, setRetryable] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let mayRetry = true;
    void fetch("/api/lessons/games?lessonId=" + encodeURIComponent(lesson.id), {
      credentials: "same-origin", cache: "no-store", signal: controller.signal,
    }).then(async response => {
      const json = await response.json().catch(() => ({})) as { pack?: GamePack; error?: string; progressSaved?: boolean; warning?: string };
      if (!response.ok || !json.pack) {
        mayRetry = response.status === 429 || response.status >= 500;
        throw new Error(json.error ?? "بنك ألعاب الدرس غير جاهز.");
      }
      if (controller.signal.aborted) return;
      setPack(json.pack); setCanSave(Boolean(json.progressSaved));
      setWarning(json.warning ?? ""); setMessage("");
      setLoading(false);
    }).catch(error => {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRetryable(mayRetry);
        setMessage(error instanceof Error ? error.message : "تعذر تحميل ألعاب الدرس.");
      }
    });
    return () => controller.abort();
  }, [lesson.id, retryAttempt]);

  function choose(next: GameMode) {
    if (!pack) return;
    setMode(next); setSerial(value => value + 1);
    setDone(null); setMessage("");
  }
  async function finish(result: GameResult) {
    // Called exactly once by each game engine at genuine win/loss.
    setDone(result);
    setCompleted(previous => ({ ...previous, [mode]: result.score }));
    if (!result.won) {
      setMessage("هذه محاولة تدريب. أعد اللعبة لتتقن المهارة وتحمي الإجابة الصحيحة.");
      return;
    }
    if (!canSave) {
      setMessage("فزت! النتيجة معروضة هنا، ويمكنك تسجيل الدخول لحفظ الإنجازات.");
      return;
    }
    try {
      const response = await fetch("/api/games/complete", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id, gameKey: mode, score: result.score, maxScore: 5,
        }),
      });
      const body = await response.json() as { ok?: boolean; xp?: number };
      setMessage(response.ok && body.ok ?
        "تم حفظ الانتصار، وحصلت على " + (body.xp ?? 0) + " نقطة خبرة." :
        "انتهت الجولة، لكن تعذر حفظ النقاط.");
    } catch {
      setMessage("انتهت الجولة، لكن تعذر الاتصال لحفظ نقاطك.");
    }
  }
  return <main dir="rtl" className="min-h-screen bg-[#eaf1e9] px-3 py-6 text-[#123f39] sm:px-6">
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="rounded-[2rem] bg-[#123f39] p-6 text-white sm:p-8">
        <Link href={"/lessons/" + lesson.id}
          className="inline-flex min-h-11 items-center rounded-full border border-white/50 px-5 py-2 font-black">
          ← العودة إلى الدرس
        </Link>
        <p className="mt-5 text-sm font-black text-[#f3d38d]">🎮 أكاديمية ألعاب ضاديوم • العب وتعلّم</p>
        <h1 className="mt-2 text-2xl font-black leading-10 sm:text-4xl">{lesson.title}</h1>
        <p className="mt-3 max-w-3xl leading-8 text-[#d7ede3]">
          خمس مغامرات حركية مختلفة، كل مغامرة خمس مراحل بأسئلة خاصة بالدرس.
          تحرّك بالمقود على الهاتف أو الأسهم على الكمبيوتر؛ اللعب ليس مجرد الضغط على جواب.
        </p>
      </header>
      <nav aria-label="اختر اللعبة" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {GAME_MODES.map(key =>
          <button key={key} type="button" disabled={!pack} aria-pressed={mode === key} onClick={() => choose(key)}
            className={"min-h-32 rounded-3xl border-2 p-3 text-center font-black shadow-sm transition-transform active:scale-95 " +
              (mode === key ? "border-amber-500 bg-[#123f39] text-white" :
                "border-[#cbd9c9] bg-white hover:-translate-y-1")}>
            <span aria-hidden="true" className="block text-4xl">{modes[key].icon}</span>
            <span className="mt-2 block text-sm">{modes[key].title}</span>
            <span className="mt-1 block text-xs opacity-75">{modes[key].short}</span>
            {completed[key] !== undefined && <span className="mt-2 block text-xs">⭐ {completed[key]} / 5</span>}
          </button>)}
      </nav>
      {warning && <p role="note" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7">{warning}</p>}
      {message && <p role="status" className="rounded-2xl bg-[#fff5df] p-4 text-sm font-bold leading-7">{message}</p>}
      {!pack && !loading && message && <section className="rounded-3xl border border-[#cfbea0] bg-white p-6">
        <h2 className="text-xl font-black">استمر في التعلم حتى لو لم يكتمل بنك اللعبة</h2>
        <p className="mt-2 text-sm leading-8 text-[#647264]">
          بعض سجلات الكتب مراجع للمنهج وليست دروسًا كاملة بأسئلة قابلة للعب.
          لا نُنشئ إجابات عشوائية ولا نمنعك من متابعة تعلم العربية.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {retryable && <button type="button" onClick={() => {
            setLoading(true);
            setRetryable(false);
            setMessage("جارٍ إعادة تحميل ألعاب الدرس…");
            setRetryAttempt(n => n + 1);
          }}
            className="min-h-12 rounded-xl bg-[#123f39] px-5 py-3 font-black text-white">
            🔄 حاول تحميل الألعاب مجددًا
          </button>}
          <Link href="/study" className="min-h-12 rounded-xl bg-[#123f39] px-5 py-3 font-black text-white">
            اختر دروس مهارات صفك ←
          </Link>
          <Link href="/guide" className="min-h-12 rounded-xl border border-[#c4b18a] px-5 py-3 font-black">
            كيف أستخدم ضاديوم؟
          </Link>
        </div>
      </section>}
      {pack && !done && (
        mode === "maze"
          ? <DadyoomAnswerShooter key={mode + "-" + serial} items={pack.maze} onFinish={finish}/>
          : <DadyoomAdventureCanvas key={mode + "-" + serial} mode={mode}
              items={pack[mode]} onFinish={finish}/>
      )}
      {done && <section role="status" aria-live="polite"
        className="rounded-3xl border border-[#cfbf94] bg-white p-8 text-center shadow-lg">
        <p className="text-7xl" aria-hidden="true">{done.won ? "🏆" : "🛡️"}</p>
        <h2 className="mt-4 text-2xl font-black">
          {done.won ? "فزت في المغامرة!" : "انتهت الجولة؛ حاول مرة أخرى"}
        </h2>
        <p className="mt-3 text-xl font-bold">إجابات صحيحة: {done.score} من 5</p>
        <p className="mt-2 leading-7">{message}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => choose(mode)}
            className="min-h-12 rounded-xl bg-[#123f39] px-6 py-3 font-black text-white">
            🔄 إعادة اللعبة
          </button>
          {GAME_MODES.filter(key => key !== mode).slice(0, 1).map(key =>
            <button type="button" key={key} onClick={() => choose(key)}
              className="min-h-12 rounded-xl border border-[#bd9e5c] bg-[#fff7e7] px-6 py-3 font-black">
              جرّب {modes[key].title}
            </button>)}
        </div>
      </section>}
      <p className="rounded-2xl bg-white p-4 text-center text-xs leading-7 text-[#6c685c]">
        الألعاب تعمل بتقنية HTML5 Canvas وJavaScript على الهاتف والويب،
        وأهدافها تدريبية، ولا تحل محل الاختبارات الوزارية الرسمية.
      </p>
    </div>
  </main>;
}
