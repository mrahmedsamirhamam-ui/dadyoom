"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Item = {
  prompt: string;
  options?: string[];
  answer: string | boolean;
};

type Pack = {
  quiz: Item[];
  trueFalse: Item[];
  match: Item[];
  order: Item[];
  treasure: Item[];
  challenge: Item[];
};

type ArcadeMode =
  | "maze"
  | "defender"
  | "catcher"
  | "runner"
  | "guardian"
  | "mission";

const labels: Record<ArcadeMode, string> = {
  maze: "متاهة الإجابة",
  defender: "قاتل الخطأ",
  catcher: "صيّاد الكلمات",
  runner: "سباق البوابات",
  guardian: "حارس الإجابة",
  mission: "مهمة البطل",
};

const sourceKey: Record<ArcadeMode, keyof Pack> = {
  maze: "quiz",
  defender: "trueFalse",
  catcher: "match",
  runner: "order",
  guardian: "treasure",
  mission: "challenge",
};

const plusModes = new Set<ArcadeMode>([
  "runner",
  "guardian",
  "mission",
]);

function expectedValue(item: Item) {
  if (typeof item.answer === "boolean") {
    return item.answer ? "صح" : "خطأ";
  }

  return String(item.answer);
}

function normalizedOptions(item: Item) {
  if (typeof item.answer === "boolean") {
    return ["صح", "خطأ"];
  }

  const expected = expectedValue(item);
  const values = (item.options ?? []).filter(Boolean);

  if (!values.includes(expected)) {
    values.unshift(expected);
  }

  return Array.from(new Set(values)).slice(0, 4);
}

export default function LessonGamesClient({
  lesson,
}: {
  lesson: {
    id: string;
    title: string;
  };
}) {
  const [pack, setPack] = useState<Pack | null>(null);
  const [plan, setPlan] = useState("free");
  const [mode, setMode] = useState<ArcadeMode>("maze");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState(
    "جارٍ تجهيز ساحة اللعب…"
  );
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void fetch(
      `/api/lessons/games?lessonId=${encodeURIComponent(
        lesson.id
      )}`,
      { cache: "no-store" }
    )
      .then(async (response) => {
        const payload = (await response.json()) as {
          pack?: Pack;
          plan?: string;
          error?: string;
        };

        if (!response.ok || !payload.pack) {
          throw new Error(
            payload.error ?? "تعذر تجهيز الألعاب."
          );
        }

        if (cancelled) return;

        setPack(payload.pack);
        setPlan(payload.plan === "plus" ? "plus" : "free");
        setMessage("");
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "تعذر تجهيز الألعاب."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lesson.id]);

  const questions = pack?.[sourceKey[mode]] ?? [];
  const current = questions[index];

  const options = useMemo(
    () => (current ? normalizedOptions(current) : []),
    [current]
  );

  async function finishGame(nextScore: number) {
    setFinished(true);

    try {
      const response = await fetch("/api/games/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId: lesson.id,
          gameKey: sourceKey[mode],
          score: nextScore,
          maxScore: questions.length,
        }),
      });

      const payload = (await response.json()) as {
        xp?: number;
      };

      setMessage(
        `أنهيت اللعبة: ${nextScore}/${questions.length} • ${Number(
          payload.xp ?? 0
        )} XP`
      );
    } catch {
      setMessage(
        `أنهيت اللعبة: ${nextScore}/${questions.length}`
      );
    }
  }

  function resolve(chosen: string) {
    if (!current) return;

    const correct = chosen === expectedValue(current);
    const nextScore = correct ? score + 1 : score;

    setScore(nextScore);

    if (index + 1 >= questions.length) {
      void finishGame(nextScore);
      return;
    }

    setIndex((value) => value + 1);
  }

  function selectMode(next: ArcadeMode) {
    if (plan !== "plus" && plusModes.has(next)) {
      setMessage(
        "هذه الساحة من مزايا Plus. اختر إحدى الألعاب المفتوحة."
      );
      return;
    }

    setMode(next);
    setIndex(0);
    setScore(0);
    setFinished(false);
    setMessage("");
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-[#f8edcf] via-[#e8f5ef] to-white px-4 py-7"
    >
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-[2rem] bg-[#123f39] p-6 text-white shadow-xl">
          <p className="text-sm font-black text-[#f2ce7d]">
            ألعاب فيها حركة ومهمات من نفس الدرس
          </p>
          <h1 className="mt-2 text-3xl font-black">
            {lesson.title}
          </h1>
          <Link
            href={`/lessons/${lesson.id}`}
            className="mt-4 inline-flex rounded-xl bg-white/10 px-4 py-2 font-black"
          >
            العودة للدرس
          </Link>
        </section>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {(Object.keys(labels) as ArcadeMode[]).map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => selectMode(item)}
                className={`rounded-2xl border px-3 py-3 text-sm font-black transition active:scale-95 ${
                  mode === item
                    ? "border-[#123f39] bg-[#123f39] text-white"
                    : "border-[#d8c7a6] bg-white text-[#123f39]"
                }`}
              >
                {labels[item]}
                {plan !== "plus" && plusModes.has(item)
                  ? " · Plus"
                  : ""}
              </button>
            )
          )}
        </section>

        {message ? (
          <div className="rounded-2xl bg-[#fff7df] p-4 font-bold text-[#6c5018]">
            {message}
          </div>
        ) : null}

        {plan !== "plus" ? (
          <Link
            href="/pricing"
            className="inline-flex rounded-xl border border-[#cba752] bg-white px-4 py-2 font-black text-[#715313]"
          >
            افتح ساحات Plus
          </Link>
        ) : null}

        {current && !finished ? (
          <section className="rounded-[2rem] border border-[#d9c9a8] bg-white p-4 shadow-xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-[#9b7328]">
                  {labels[mode]} · {index + 1}/{questions.length}
                </p>
                <h2 className="mt-2 text-xl font-black text-[#123f39] sm:text-2xl">
                  {current.prompt}
                </h2>
              </div>

              <div className="rounded-full bg-[#e8f5ef] px-4 py-2 font-black text-[#123f39]">
                النقاط {score}
              </div>
            </div>

            <div className="mt-5">
              {mode === "maze" ? (
                <MazeRound
                  key={`${mode}-${index}`}
                  options={options}
                  onResolve={resolve}
                />
              ) : mode === "defender" ? (
                <DefenderRound
                  key={`${mode}-${index}`}
                  options={options}
                  answer={expectedValue(current)}
                  onResolve={resolve}
                />
              ) : mode === "catcher" ? (
                <CatcherRound
                  key={`${mode}-${index}`}
                  options={options}
                  onResolve={resolve}
                />
              ) : mode === "runner" ? (
                <RunnerRound
                  key={`${mode}-${index}`}
                  options={options}
                  onResolve={resolve}
                />
              ) : mode === "guardian" ? (
                <GuardianRound
                  key={`${mode}-${index}`}
                  options={options}
                  answer={expectedValue(current)}
                  onResolve={resolve}
                />
              ) : (
                <MissionRound
                  key={`${mode}-${index}`}
                  options={options}
                  onResolve={resolve}
                />
              )}
            </div>
          </section>
        ) : null}

        {finished ? (
          <section className="rounded-[2rem] border bg-white p-8 text-center shadow-xl">
            <div className="text-6xl">🏆</div>
            <h2 className="mt-4 text-3xl font-black text-[#123f39]">
              أنهيت الجولة
            </h2>
            <p className="mt-2 text-xl font-black text-[#9b7021]">
              {score}/{questions.length}
            </p>
            <button
              type="button"
              onClick={() => {
                setIndex(0);
                setScore(0);
                setFinished(false);
                setMessage("");
              }}
              className="mt-5 rounded-xl bg-[#123f39] px-6 py-3 font-black text-white"
            >
              العب مرة أخرى
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function MazeRound({
  options,
  onResolve,
}: {
  options: string[];
  onResolve: (value: string) => void;
}) {
  const gates = options.slice(0, 4);
  const gateCells = [0, 4, 20, 24];
  const walls = new Set([6, 8, 11, 13, 16, 18]);
  const [cell, setCell] = useState(12);

  function move(delta: number) {
    const next = cell + delta;
    const row = Math.floor(cell / 5);
    const nextRow = Math.floor(next / 5);

    if (
      next < 0 ||
      next > 24 ||
      walls.has(next) ||
      (Math.abs(delta) === 1 && row !== nextRow)
    ) {
      return;
    }

    setCell(next);

    const gateIndex = gateCells.indexOf(next);

    if (gateIndex >= 0 && gates[gateIndex]) {
      window.setTimeout(() => {
        onResolve(gates[gateIndex]);
      }, 180);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
      <div className="grid aspect-square max-h-[520px] grid-cols-5 gap-1 rounded-3xl bg-[#d9b96a] p-2 shadow-inner">
        {Array.from({ length: 25 }, (_, gridIndex) => {
          const gateIndex = gateCells.indexOf(gridIndex);
          const gate =
            gateIndex >= 0 ? gates[gateIndex] : null;

          return (
            <div
              key={gridIndex}
              className={`relative flex min-h-14 items-center justify-center rounded-xl text-center text-xs font-black sm:text-sm ${
                walls.has(gridIndex)
                  ? "bg-[#6f5a38]"
                  : gate
                    ? "bg-[#fff8e8] text-[#123f39]"
                    : "bg-[#f8edcf]"
              }`}
            >
              {gate ? <span className="px-1">{gate}</span> : null}
              {cell === gridIndex ? (
                <span className="absolute text-3xl drop-shadow">
                  🧒
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col justify-center">
        <p className="mb-3 text-center text-sm font-black text-slate-600">
          حرّك البطل حتى يصل إلى بوابة الإجابة الصحيحة.
        </p>
        <div className="mx-auto grid w-40 grid-cols-3 gap-2">
          <span />
          <Pad label="↑" onClick={() => move(-5)} />
          <span />
          <Pad label="→" onClick={() => move(1)} />
          <Pad label="↓" onClick={() => move(5)} />
          <Pad label="←" onClick={() => move(-1)} />
        </div>
      </div>
    </div>
  );
}

function DefenderRound({
  options,
  answer,
  onResolve,
}: {
  options: string[];
  answer: string;
  onResolve: (value: string) => void;
}) {
  const wrong = options.filter((value) => value !== answer);
  const [destroyed, setDestroyed] = useState<string[]>([]);

  const remaining = wrong.filter(
    (value) => !destroyed.includes(value)
  );

  useEffect(() => {
    if (wrong.length > 0 && remaining.length === 0) {
      const timer = window.setTimeout(() => {
        onResolve(answer);
      }, 350);

      return () => window.clearTimeout(timer);
    }
  }, [answer, onResolve, remaining.length, wrong.length]);

  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-3xl bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100 p-5">
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-6xl">
        🏰
      </div>

      <div className="mx-auto max-w-sm rounded-2xl border-2 border-emerald-500 bg-white/90 p-3 text-center font-black text-emerald-800 shadow">
        🛡️ احمِ: {answer}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {remaining.map((value, enemyIndex) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              setDestroyed((items) => [
                ...items,
                value,
              ])
            }
            className={`rounded-full border-4 border-rose-400 bg-rose-50 px-4 py-5 font-black text-rose-900 shadow-xl ${
              enemyIndex % 2 === 0
                ? "animate-bounce"
                : "animate-pulse"
            }`}
          >
            👾 {value}
          </button>
        ))}
      </div>

      <p className="absolute bottom-4 right-4 rounded-xl bg-white/80 px-3 py-2 text-xs font-black">
        دمّر الإجابات الخاطئة واترك الصحيحة.
      </p>
    </div>
  );
}

function CatcherRound({
  options,
  onResolve,
}: {
  options: string[];
  onResolve: (value: string) => void;
}) {
  return (
    <div className="min-h-[380px] rounded-3xl bg-gradient-to-b from-indigo-200 to-amber-100 p-5">
      <div className="text-center text-5xl">🐦</div>
      <p className="mt-2 text-center font-black text-indigo-950">
        اصطد الإجابة الصحيحة قبل أن تهرب.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {options.map((value, balloonIndex) => (
          <button
            key={value}
            type="button"
            onClick={() => onResolve(value)}
            className={`rounded-full border-4 border-indigo-300 bg-white/90 px-4 py-6 font-black shadow-xl ${
              balloonIndex % 2 === 0
                ? "animate-bounce"
                : "animate-pulse"
            }`}
          >
            🎈 {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function RunnerRound({
  options,
  onResolve,
}: {
  options: string[];
  onResolve: (value: string) => void;
}) {
  const lanes = options.slice(0, 4);
  const [lane, setLane] = useState(0);

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-b from-sky-200 to-emerald-200 p-5">
      <p className="text-center font-black text-[#123f39]">
        غيّر المسار ثم ادخل البوابة.
      </p>

      <div className="mt-6 grid min-h-[300px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {lanes.map((value, laneIndex) => (
          <button
            key={value}
            type="button"
            onClick={() => setLane(laneIndex)}
            className={`relative overflow-hidden rounded-3xl border-4 p-4 pt-16 font-black shadow-inner ${
              lane === laneIndex
                ? "border-amber-400 bg-white"
                : "border-white/60 bg-white/55"
            }`}
          >
            <div className="absolute left-1/2 top-3 -translate-x-1/2 text-4xl">
              🚪
            </div>
            {value}
            {lane === laneIndex ? (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-4xl">
                🏃
              </div>
            ) : null}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          const value = lanes[lane];
          if (value) onResolve(value);
        }}
        className="mt-5 w-full rounded-2xl bg-[#123f39] px-5 py-4 font-black text-white"
      >
        انطلق إلى البوابة
      </button>
    </div>
  );
}

function GuardianRound({
  options,
  answer,
  onResolve,
}: {
  options: string[];
  answer: string;
  onResolve: (value: string) => void;
}) {
  const wrong = options.filter((value) => value !== answer);
  const [destroyed, setDestroyed] = useState<string[]>([]);

  const remaining = wrong.filter(
    (value) => !destroyed.includes(value)
  );

  useEffect(() => {
    if (wrong.length > 0 && remaining.length === 0) {
      const timer = window.setTimeout(() => {
        onResolve(answer);
      }, 350);

      return () => window.clearTimeout(timer);
    }
  }, [answer, onResolve, remaining.length, wrong.length]);

  return (
    <div className="rounded-3xl bg-gradient-to-b from-slate-800 to-slate-950 p-5 text-white">
      <div className="text-center text-6xl">🛡️</div>
      <div className="mx-auto mt-3 max-w-md rounded-2xl border border-emerald-400 bg-emerald-400/15 p-4 text-center font-black">
        احمِ الإجابة الصحيحة: {answer}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {remaining.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              setDestroyed((items) => [
                ...items,
                value,
              ])
            }
            className="animate-pulse rounded-2xl border border-rose-400 bg-rose-500/20 p-5 font-black"
          >
            ⚔️ {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function MissionRound({
  options,
  onResolve,
}: {
  options: string[];
  onResolve: (value: string) => void;
}) {
  return (
    <div className="rounded-3xl bg-gradient-to-b from-amber-100 via-orange-50 to-emerald-100 p-5">
      <div className="flex items-center gap-4 rounded-2xl bg-white/80 p-4 shadow">
        <div className="text-5xl">🧑‍🏫</div>
        <p className="font-black text-[#123f39]">
          أمامك بوابات. اختر بوابة المهمة الصحيحة لتكمل الرحلة.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {options.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onResolve(value)}
            className="group min-h-36 rounded-[2rem] border-4 border-amber-300 bg-white p-4 font-black shadow-xl transition hover:-translate-y-2 hover:border-emerald-400"
          >
            <div className="text-5xl transition group-hover:scale-110">
              🏜️🚪
            </div>
            <div className="mt-3">{value}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Pad({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-12 rounded-xl bg-[#123f39] text-2xl font-black text-white active:scale-95"
    >
      {label}
    </button>
  );
}
