"use client";

import { useMemo, useRef, useState } from "react";

type VocabularyItem = {
  word: string;
  meaning: string;
};

type TeachingSlideSource = {
  slide?: number;
  title?: string;
  body?: string;
};

type InstructionEntry = {
  kind?: string;
  items?: TeachingSlideSource[];
};

type DeckSlide = {
  key: string;
  kicker: string;
  title: string;
  subtitle?: string;
  body?: string;
  items?: string[];
  words?: VocabularyItem[];
  emblem?: string;
};

type Props = {
  title?: string;
  summary?: string | null;
  content?: string | null;
  objectives?: string[];
  vocabulary?: VocabularyItem[];
  instructions: unknown;
  questions?: unknown;
};

function extractTeachingSlides(instructions: unknown): TeachingSlideSource[] {
  if (!Array.isArray(instructions)) return [];

  const entry = instructions.find((item) => {
    if (!item || typeof item !== "object") return false;
    return (item as InstructionEntry).kind === "slides";
  }) as InstructionEntry | undefined;

  if (!entry || !Array.isArray(entry.items)) return [];

  return entry.items.filter(
    (item) =>
      Boolean(
        item &&
          typeof item === "object" &&
          (typeof item.title === "string" || typeof item.body === "string")
      )
  );
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function compact(value: string, max = 360) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function splitContent(content: string | null | undefined) {
  const lines = text(content)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += 3) {
    chunks.push(compact(lines.slice(i, i + 3).join("\n"), 380));
  }
  return chunks;
}

function buildDeck({
  title,
  summary,
  content,
  objectives = [],
  vocabulary = [],
  instructions,
}: Props): DeckSlide[] {
  const sourceSlides = extractTeachingSlides(instructions);
  const contentChunks = splitContent(content);

  const teachingBodies = sourceSlides
    .map((slide) => ({
      title: text(slide.title),
      body: compact(text(slide.body), 380),
    }))
    .filter((slide) => slide.title || slide.body);

  const fallbackBody =
    contentChunks[0] ||
    teachingBodies[0]?.body ||
    text(summary) ||
    "ابدأ الدرس خطوة بخطوة، واقرأ الأمثلة بهدوء.";

  const secondBody =
    teachingBodies[1]?.body ||
    contentChunks[1] ||
    teachingBodies[0]?.body ||
    fallbackBody;

  const thirdBody =
    teachingBodies[2]?.body ||
    contentChunks[2] ||
    secondBody;

  const practiceBody =
    contentChunks.find((chunk) =>
      /اقرأ|اكتب|تحد|تحدث|ردد|جرّب|صنّف|لاحظ/.test(chunk)
    ) ||
    "اقرأ المثال مرة أخرى، ثم طبّق الفكرة بنفسك.";

  const lessonTitle = text(title) || "درس العربية";
  const lessonSummary = text(summary) || fallbackBody;

  return [
    {
      key: "cover",
      kicker: "درس ضاديوم",
      title: lessonTitle,
      subtitle: lessonSummary,
      emblem: "ض",
    },
    {
      key: "objectives",
      kicker: "هدفنا اليوم",
      title: "ماذا سنتعلم؟",
      items:
        objectives.length > 0
          ? objectives.slice(0, 4)
          : ["نفهم فكرة الدرس.", "نقرأ الأمثلة.", "نطبّق ما تعلمناه."],
      emblem: "✓",
    },
    {
      key: "concept",
      kicker: teachingBodies[0]?.title || "الفكرة الأساسية",
      title: lessonTitle,
      body: fallbackBody,
      emblem: "ف",
    },
    {
      key: "vocabulary",
      kicker: "كلمات الدرس",
      title: "نتعرّف الكلمات",
      words: vocabulary.slice(0, 5),
      body:
        vocabulary.length === 0
          ? secondBody
          : undefined,
      emblem: "ك",
    },
    {
      key: "learn",
      kicker: teachingBodies[1]?.title || "نتعلم معًا",
      title: "ركّز معي",
      body: secondBody,
      emblem: "ض",
    },
    {
      key: "example",
      kicker: teachingBodies[2]?.title || "مثال واضح",
      title: "اقرأ ولاحظ",
      body: thirdBody,
      emblem: "م",
    },
    {
      key: "practice",
      kicker: "تطبيق سريع",
      title: "جرّب بنفسك",
      body: practiceBody,
      emblem: "✎",
    },
    {
      key: "finish",
      kicker: "أحسنت",
      title: "أنت الآن جاهز",
      subtitle: lessonSummary,
      body: "بعد انتهاء العرض، أكمل أسئلة ضاديوم التفاعلية الأصلية الخاصة بالدرس.",
      emblem: "★",
    },
  ];
}

export default function LessonLearningSlides(props: Props) {
  const slides = useMemo(() => buildDeck(props), [props]);
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<number | null>(null);

  const goTo = (nextIndex: number) => {
    setCurrent(Math.max(0, Math.min(slides.length - 1, nextIndex)));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") goTo(current + 1);
    if (event.key === "ArrowRight") goTo(current - 1);
  };

  const slide = slides[current];
  const progress = ((current + 1) / slides.length) * 100;

  return (
    <section
      dir="rtl"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={(event) => {
        touchStart.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const end = event.changedTouches[0]?.clientX ?? touchStart.current;
        const delta = end - touchStart.current;
        touchStart.current = null;

        if (Math.abs(delta) < 45) return;
        if (delta > 0) goTo(current + 1);
        if (delta < 0) goTo(current - 1);
      }}
      className="overflow-hidden rounded-[2rem] border border-[#d5bf86] bg-[#123f39] shadow-2xl shadow-[#123f39]/15 outline-none"
      aria-label="عرض الدرس"
    >
      <div className="h-1.5 bg-[#0b2f2b]">
        <div
          className="h-full bg-gradient-to-l from-[#c99d35] to-[#f0d47d] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="relative flex min-h-[34rem] items-center justify-center bg-[#efe8da] p-3 sm:p-5">
        <article className="relative aspect-video w-full max-w-[1120px] overflow-hidden rounded-[1.5rem] border border-white/20 bg-[radial-gradient(circle_at_50%_36%,rgba(224,181,77,0.18),transparent_28%),linear-gradient(135deg,#0b2f2b_0%,#1f665c_52%,#123f39_100%)] text-[#fffdf8] shadow-2xl">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.13]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,253,248,.45) 1px,transparent 1px),linear-gradient(90deg,rgba(224,181,77,.5) 1px,transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />

          <div className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-b from-transparent to-[#062a27]/95" />

          <div className="relative z-10 flex h-full flex-col p-8 sm:p-12 lg:p-14">
            <div className="max-w-[78%]">
              <p className="text-sm font-black text-[#f0d47d] sm:text-lg">
                {slide.kicker}
              </p>

              <h2 className="mt-2 font-arabic-display text-3xl font-black leading-tight text-[#fffdf8] drop-shadow sm:text-5xl lg:text-6xl">
                {slide.title}
              </h2>

              {slide.subtitle ? (
                <p className="mt-4 max-w-3xl text-lg font-bold leading-8 text-[#e9f2ee] sm:text-2xl">
                  {slide.subtitle}
                </p>
              ) : null}

              <div className="mt-5 h-1.5 w-1/2 rounded-full bg-gradient-to-l from-[#f0d47d] via-[#c99d35] to-transparent" />
            </div>

            {slide.items ? (
              <div className="mt-7 grid max-w-[82%] gap-3 sm:grid-cols-2">
                {slide.items.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="border-t-2 border-[#e0b54d]/80 pt-3 text-lg font-bold leading-8 text-[#fffdf8] sm:text-2xl"
                  >
                    {index + 1}. {item}
                  </div>
                ))}
              </div>
            ) : null}

            {slide.words && slide.words.length > 0 ? (
              <div className="mt-7 max-w-[84%]">
                <div className="flex flex-wrap gap-3">
                  {slide.words.map((item, index) => (
                    <span
                      key={`${item.word}-${index}`}
                      className="rounded-2xl border border-[#f0d47d]/60 bg-[#0b2f2b]/60 px-4 py-2 text-xl font-black sm:text-3xl"
                    >
                      {item.word}
                    </span>
                  ))}
                </div>

                <div className="mt-5 space-y-2 text-lg font-bold leading-8 text-[#eef5f1] sm:text-2xl">
                  {slide.words.slice(0, 3).map((item, index) => (
                    <p key={`${item.word}-meaning-${index}`}>
                      {item.word} — {item.meaning}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {slide.body ? (
              <p className="mt-7 max-w-[84%] whitespace-pre-line text-lg font-bold leading-9 text-[#f5fbf8] sm:text-2xl lg:text-3xl">
                {slide.body}
              </p>
            ) : null}

            <div className="absolute left-7 top-7 grid h-24 w-24 place-items-center rounded-full border-[6px] border-double border-[#f0d47d] bg-[radial-gradient(circle,#d9b24c_0_10%,#1f665c_11%_45%,#0b2f2b_46%_100%)] text-4xl font-black text-[#fffdf8] shadow-xl sm:h-36 sm:w-36 sm:text-6xl">
              {slide.emblem}
            </div>

            <div className="absolute bottom-5 right-7 text-sm font-black text-[#f4df9b] sm:text-base">
              ضاديوم • بيت العربية الرقمي
            </div>

            <div className="absolute bottom-5 left-7 text-sm font-black text-white">
              {current + 1} / {slides.length}
            </div>
          </div>
        </article>

        <button
          type="button"
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          aria-label="الشريحة السابقة"
          className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-[#123f39] text-3xl font-black text-white shadow-lg transition hover:scale-105 disabled:opacity-25 sm:right-5"
        >
          ›
        </button>

        <button
          type="button"
          onClick={() => goTo(current + 1)}
          disabled={current === slides.length - 1}
          aria-label="الشريحة التالية"
          className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-[#123f39] text-3xl font-black text-white shadow-lg transition hover:scale-105 disabled:opacity-25 sm:left-5"
        >
          ‹
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 bg-[#123f39] px-4 py-4">
        {slides.map((item, index) => (
          <button
            key={item.key}
            type="button"
            aria-label={`الانتقال إلى الشريحة ${index + 1}`}
            onClick={() => goTo(index)}
            className={
              index === current
                ? "h-2.5 w-9 rounded-full bg-[#e0b54d] transition-all"
                : "h-2.5 w-2.5 rounded-full bg-white/35 transition-all hover:bg-white/60"
            }
          />
        ))}
      </div>
    </section>
  );
}
