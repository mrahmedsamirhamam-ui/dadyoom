"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const alphabet = [
  "أ",
  "ب",
  "ت",
  "ث",
  "ج",
  "ح",
  "خ",
  "د",
  "ذ",
  "ر",
  "ز",
  "س",
  "ش",
  "ص",
  "ض",
  "ط",
  "ظ",
  "ع",
  "غ",
  "ف",
  "ق",
  "ك",
  "ل",
  "م",
  "ن",
  "هـ",
  "و",
  "ي",
] as const;

type Letter = (typeof alphabet)[number];

type Tab =
  | "letters"
  | "write"
  | "listen"
  | "speak"
  | "games"
  | "videos";

const tabs: Array<{ value: Tab; label: string }> = [
  { value: "letters", label: "الحروف" },
  { value: "write", label: "اكتب" },
  { value: "listen", label: "اسمع" },
  { value: "speak", label: "اقرأ" },
  { value: "games", label: "ألعاب" },
  { value: "videos", label: "فيديو" },
];

function nextLetter(current: Letter): Letter {
  const index = alphabet.indexOf(current);
  return alphabet[(index + 1) % alphabet.length];
}

function speakArabic(value: string) {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window)
  ) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(value);
  utterance.lang = "ar";
  utterance.rate = 0.72;

  const voice = window.speechSynthesis
    .getVoices()
    .find((item) =>
      item.lang.toLowerCase().startsWith("ar")
    );

  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

export default function EarlyLearningRoom({
  childName,
}: {
  childName: string;
}) {
  const [tab, setTab] = useState<Tab>("letters");
  const [letter, setLetter] = useState<Letter>("أ");

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[radial-gradient(circle_at_top,#fff4c7,#dff5ea_45%,#dcecff)] px-4 py-6"
    >
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="overflow-hidden rounded-[2.2rem] bg-[#123f39] p-6 text-white shadow-2xl sm:p-8">
          <p className="text-sm font-black text-[#f2ce7d]">
            غرفة الطفل
          </p>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">
            تعلّم من الصغر
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-white/85">
            أهلًا {childName}. نتعلّم الحروف بالحركة والصوت والكتابة واللعب.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-xl bg-white/10 px-4 py-2 font-black"
            >
              البيت
            </Link>
            <Link
              href="/shorts"
              className="rounded-xl bg-[#f2ce7d] px-4 py-2 font-black text-[#123f39]"
            >
              شورتس العربية
            </Link>
            <Link
              href="/rewards"
              className="rounded-xl bg-white px-4 py-2 font-black text-[#123f39]"
            >
              🏆 جوائزي وشهاداتي
            </Link>
          </div>
        </header>

        <nav className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={`rounded-2xl border px-3 py-4 font-black shadow-sm transition active:scale-95 ${
                tab === item.value
                  ? "border-[#123f39] bg-[#123f39] text-white"
                  : "border-white bg-white/85 text-[#123f39]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-xl backdrop-blur sm:p-7">
          {tab === "letters" ? (
            <LettersPanel
              letter={letter}
              setLetter={setLetter}
            />
          ) : tab === "write" ? (
            <WritingPanel
              letter={letter}
              setLetter={setLetter}
            />
          ) : tab === "listen" ? (
            <ListeningPanel
              letter={letter}
              setLetter={setLetter}
            />
          ) : tab === "speak" ? (
            <SpeakingPanel
              letter={letter}
              setLetter={setLetter}
            />
          ) : tab === "games" ? (
            <ChildGames />
          ) : (
            <AlphabetCinema />
          )}
        </section>
      </div>
    </main>
  );
}

function LettersPanel({
  letter,
  setLetter,
}: {
  letter: Letter;
  setLetter: (value: Letter) => void;
}) {
  return (
    <>
      <div className="text-center">
        <p className="text-sm font-black text-[#9b7328]">
          اضغط على أي حرف
        </p>
        <div className="mt-2 text-[8rem] font-black leading-none text-[#123f39]">
          {letter}
        </div>
        <button
          type="button"
          onClick={() => speakArabic(letter)}
          className="mt-4 rounded-2xl bg-[#123f39] px-6 py-3 font-black text-white"
        >
          اسمع الحرف
        </button>
      </div>

      <div className="mt-7 grid grid-cols-5 gap-2 sm:grid-cols-7">
        {alphabet.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setLetter(value);
              speakArabic(value);
            }}
            className={`aspect-square rounded-2xl border text-3xl font-black shadow-sm transition hover:-translate-y-1 ${
              value === letter
                ? "border-amber-400 bg-amber-100 text-[#123f39]"
                : "border-emerald-100 bg-emerald-50 text-emerald-900"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    </>
  );
}

function WritingPanel({
  letter,
  setLetter,
}: {
  letter: Letter;
  setLetter: (value: Letter) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-black text-[#123f39]">
        اكتب الحرف عدة مرات
      </h2>
      <p className="mt-2 text-slate-600">
        مرّر إصبعك أو الماوس فوق الحرف الكبير، ثم امسح وكرّر.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
        <div className="grid grid-cols-4 gap-2 lg:grid-cols-3">
          {alphabet.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setLetter(value)}
              className={`rounded-xl p-3 text-2xl font-black ${
                value === letter
                  ? "bg-[#123f39] text-white"
                  : "bg-amber-50 text-[#72551c]"
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        <TraceBoard letter={letter} />
      </div>
    </div>
  );
}

function TraceBoard({ letter }: { letter: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  function point(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    return {
      x:
        (event.clientX - rect.left) *
        (canvas.width / rect.width),
      y:
        (event.clientY - rect.top) *
        (canvas.height / rect.height),
    };
  }

  function start(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const p = point(event);
    if (!canvas || !p) return;

    drawing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);

    const context = canvas.getContext("2d");
    if (!context) return;

    context.beginPath();
    context.moveTo(p.x, p.y);
  }

  function move(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;

    const canvas = canvasRef.current;
    const p = point(event);
    if (!canvas || !p) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.lineWidth = 16;
    context.lineCap = "round";
    context.strokeStyle = "#123f39";
    context.lineTo(p.x, p.y);
    context.stroke();
  }

  function clear() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-[2rem] border-4 border-dashed border-amber-300 bg-white">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[16rem] font-black text-amber-100">
          {letter}
        </div>
        <canvas
          ref={canvasRef}
          width={900}
          height={520}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={() => {
            drawing.current = false;
          }}
          onPointerCancel={() => {
            drawing.current = false;
          }}
          className="relative h-[360px] w-full touch-none sm:h-[500px]"
        />
      </div>

      <button
        type="button"
        onClick={clear}
        className="mt-3 rounded-xl bg-amber-100 px-5 py-3 font-black text-amber-900"
      >
        امسح واكتب من جديد
      </button>
    </div>
  );
}

function ListeningPanel({
  letter,
  setLetter,
}: {
  letter: Letter;
  setLetter: (value: Letter) => void;
}) {
  const index = alphabet.indexOf(letter);
  const choices: Letter[] = [
    letter,
    alphabet[(index + 5) % alphabet.length],
    alphabet[(index + 11) % alphabet.length],
  ];

  return (
    <div className="text-center">
      <div className="text-6xl">🔊</div>
      <h2 className="mt-3 text-2xl font-black text-[#123f39]">
        اسمع ثم اختر
      </h2>

      <button
        type="button"
        onClick={() => speakArabic(letter)}
        className="mt-4 rounded-2xl bg-[#123f39] px-7 py-4 font-black text-white"
      >
        شغّل الصوت
      </button>

      <div className="mx-auto mt-6 grid max-w-2xl grid-cols-3 gap-3">
        {choices.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              if (value === letter) {
                speakArabic("أحسنت");
                setLetter(nextLetter(letter));
              } else {
                speakArabic("حاول مرة أخرى");
              }
            }}
            className="aspect-square rounded-[2rem] bg-amber-50 text-5xl font-black text-amber-900 shadow"
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function SpeakingPanel({
  letter,
  setLetter,
}: {
  letter: Letter;
  setLetter: (value: Letter) => void;
}) {
  return (
    <div className="text-center">
      <p className="text-sm font-black text-[#9b7328]">
        اقرأ بصوت عالٍ
      </p>
      <div className="mt-4 text-[11rem] font-black leading-none text-[#123f39]">
        {letter}
      </div>
      <p className="mt-4 text-lg font-bold text-slate-700">
        قل اسم الحرف، ثم اسمع النموذج الصحيح.
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => speakArabic(letter)}
          className="rounded-2xl bg-[#123f39] px-6 py-4 font-black text-white"
        >
          اسمع النموذج
        </button>
        <button
          type="button"
          onClick={() => setLetter(nextLetter(letter))}
          className="rounded-2xl bg-amber-100 px-6 py-4 font-black text-amber-900"
        >
          الحرف التالي
        </button>
      </div>
    </div>
  );
}

function ChildGames() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <LetterCatchGame />
      <LetterRoadGame />
    </div>
  );
}

function LetterCatchGame() {
  const [step, setStep] = useState(0);
  const target = alphabet[step % alphabet.length];

  const choices = useMemo(() => {
    const a = alphabet[(step + 3) % alphabet.length];
    const b = alphabet[(step + 7) % alphabet.length];
    const c = alphabet[(step + 12) % alphabet.length];

    return step % 2 === 0
      ? [a, target, b, c]
      : [target, c, a, b];
  }, [step, target]);

  return (
    <div className="min-h-[420px] overflow-hidden rounded-[2rem] bg-gradient-to-b from-sky-200 to-emerald-100 p-5">
      <div className="text-center text-5xl">🐠</div>
      <h3 className="mt-2 text-center text-xl font-black text-[#123f39]">
        اصطد حرف {target}
      </h3>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {choices.map((value, itemIndex) => (
          <button
            key={`${value}-${itemIndex}`}
            type="button"
            onClick={() => {
              if (value === target) {
                setStep((valueStep) => valueStep + 1);
                speakArabic("أحسنت");
              } else {
                speakArabic("حاول مرة أخرى");
              }
            }}
            className={`aspect-square rounded-full bg-white text-4xl font-black shadow-xl ${
              itemIndex % 2 === 0
                ? "animate-bounce"
                : "animate-pulse"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-xl bg-white/70 p-3 text-center font-black">
        النقاط: {step}
      </div>
    </div>
  );
}

function LetterRoadGame() {
  const [step, setStep] = useState(0);
  const target = alphabet[step % alphabet.length];

  const choices: Letter[] = [
    alphabet[(step + 4) % alphabet.length],
    target,
    alphabet[(step + 9) % alphabet.length],
  ];

  return (
    <div className="min-h-[420px] rounded-[2rem] bg-gradient-to-b from-amber-100 to-orange-100 p-5">
      <div className="text-center text-5xl">🐪</div>
      <h3 className="mt-2 text-center text-xl font-black text-[#6d4b20]">
        ساعد الجمل يصل إلى حرف {target}
      </h3>

      <div className="mt-8 grid gap-3">
        {choices.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              if (value === target) {
                setStep((valueStep) => valueStep + 1);
                speakArabic("أحسنت");
              } else {
                speakArabic("حاول مرة أخرى");
              }
            }}
            className="group flex items-center justify-between rounded-2xl border-4 border-amber-300 bg-white p-4 font-black shadow transition hover:translate-x-2 hover:border-emerald-400"
          >
            <span className="text-4xl">{value}</span>
            <span className="text-3xl transition group-hover:scale-125">
              🚪
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 h-4 overflow-hidden rounded-full bg-white">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{
            width: `${Math.min(
              100,
              (step / alphabet.length) * 100
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function AlphabetCinema() {
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!running) return;

    speakArabic(alphabet[index]);

    const timer = window.setTimeout(() => {
      setIndex((value) => (value + 1) % alphabet.length);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [index, running]);

  return (
    <div className="text-center">
      <p className="text-sm font-black text-[#9b7328]">
        عرض الحروف المتحرك
      </p>

      <div className="mx-auto mt-5 flex aspect-video max-w-3xl items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#123f39] via-[#1f665c] to-[#d8b55f] shadow-2xl">
        <div className="animate-pulse text-[12rem] font-black text-white drop-shadow-2xl">
          {alphabet[index]}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setRunning((value) => !value)}
        className="mt-5 rounded-2xl bg-[#123f39] px-7 py-4 font-black text-white"
      >
        {running ? "إيقاف العرض" : "شغّل فيديو الحروف"}
      </button>

      <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600">
        فيديوهات YouTube الخارجية تظهر من المصدر الأصلي فقط بعد فحص الإتاحة والترخيص ومراجعة ملاءمتها للأطفال.
      </p>
    </div>
  );
}
