"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

type VocabularyItem = { word: string; meaning: string };
type Authored = { title?: string; body?: string };
type SlideInstruction = { kind?: string; items?: Authored[] };
type Quiz = { id: string; question: string; options: { id: string; text: string }[]; correct: string; explanation?: string };
type Activity = { title: string; prompt: string; activityType: string };

type Slide = {
  id: string;
  phase: "welcome" | "overview" | "goal" | "teach" | "do" | "check" | "close";
  eyebrow: string;
  title: string;
  body?: string;
  goalNumber?: number;
  items?: string[];
  quiz?: Quiz;
  activity?: Activity;
  words?: VocabularyItem[];
};
type Props = {
  title?: string;
  summary?: string | null;
  content?: string | null;
  objectives?: string[];
  vocabulary?: VocabularyItem[];
  instructions: unknown;
  questions?: unknown;
  activities?: unknown;
  lessonId?: string;
};

function clean(value: unknown): string { return String(value ?? "").replace(/\s+/gu, " ").trim(); }
function truncate(value: unknown, max: number): string {
  const t = clean(value);
  if (t.length <= max) return t;
  const n = t.lastIndexOf(" ", max);
  return t.slice(0, n > max * .7 ? n : max).trimEnd() + "…";
}
function lessonSummary(value: unknown) {
  const s = clean(value);
  return /^(القواعد|القراءة|الكتاب|النصوص)\s*ص\s*\d+/u.test(s) ? "" : truncate(s, 170);
}

function instructionalParagraphs(value: unknown): string[] {
  const full = String(value ?? "").trim();
  const markers = [
    "مسار التعلّم الذاتي الموسّع", "مسار التعلم الذاتي —", "مسار التعلم الذاتي",
    "الدرس التطبيقي الموسّع", "مسار القراءة والفهم الأصلي",
  ];
  const indices = markers.map((m) => full.lastIndexOf(m)).filter((index) => index >= 0);
  const teaching = indices.length ? full.slice(Math.max(...indices)) : full;
  const pieces = teaching.split(/\n\s*\n|\n|[.!؟؛]+/gu)
    .map(clean)
    .filter((line) => line.length > 34 &&
      !/^(ضاديوم — درس إثرائي|مصدر الدرس|حالة المصدر|حالة التوثيق|حقوق المحتوى|تنبيه التوثيق|هذا المحتوى من إنشاء|خطة 2025|هذا ليس نص الكتاب)/u.test(line));
  const snippets: string[] = [];
  for (const piece of pieces) {
    let line = "";
    for (const word of piece.split(" ")) {
      if (line && line.length + word.length + 1 > 195) {
        if (line.length >= 34) snippets.push(line);
        line = "";
      }
      line += (line ? " " : "") + word;
    }
    if (line.length >= 34) snippets.push(line);
  }
  return snippets;
}

function authoredMaterial(instructions: unknown): string[] {
  if (!Array.isArray(instructions)) return [];
  const entry = instructions.find((e): e is SlideInstruction =>
    Boolean(e && typeof e === "object" && (e as SlideInstruction).kind === "slides"));
  return Array.isArray(entry?.items)
    ? entry.items.map((slide) => truncate(slide.body, 185)).filter((t) => t.length > 36)
    : [];
}

function validQuestions(value: unknown): Quiz[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw, index) => {
    if (!raw || typeof raw !== "object") return [];
    const q = raw as Record<string, unknown>;
    if (!Array.isArray(q.options) || q.question_type !== "multiple_choice") return [];
    const options = q.options.flatMap((item): { id: string; text: string }[] => {
      if (!item || typeof item !== "object") return [];
      const option = item as Record<string, unknown>;
      const id = clean(option.id), word = clean(option.text);
      return id && word ? [{ id, text: truncate(word, 145) }] : [];
    });
    const correct = clean(q.correct_answer);
    if (options.length < 2 || options.length > 5 || !options.some((o) => o.id === correct)) return [];
    const prompt = clean(q.question);
    if (prompt.length < 12 || /ما عنوان الدرس|ما رقم الدرس|عنوان الدرس رقم/iu.test(prompt)) return [];
    return [{ id: clean(q.id) || String(index), question: truncate(prompt, 250),
      options, correct, explanation: truncate(q.explanation, 250) }];
  });
}

function usableActivities(value: unknown): Activity[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const a = raw as Record<string, unknown>;
    const type = clean(a.activity_type);
    const body = clean(a.prompt) || clean(a.instructions);
    if ((type !== "writing" && type !== "speaking" && type !== "reading") || body.length < 25 || a.is_published === false) return [];
    return [{ title: truncate(a.title, 65), prompt: truncate(body, 245), activityType: type }];
  });
}

function plannedGoals(objectives: unknown, hasMaterial: boolean): string[] {
  const originals = Array.isArray(objectives) ? objectives.map((o) => truncate(o, 135)).filter((o) => o.length > 12) : [];
  // Unknown curricular objectives must not be fabricated as verified curriculum outcomes.
  if (originals.length) return originals.slice(0, 3);
  return hasMaterial ? [
    "أفهم الفكرة الأساسية وأستخرج شاهدًا من الشرح.",
    "أطبّق الفكرة في مثال جديد من إنشائي.",
    "أراجع إجابتي وأفسّر سبب صحتها أو خطئها.",
  ] : ["أتعرف فكرة الدرس وأطلب من معلمي توضيح ما ينقصني."];
}

function plan(props: Props): Slide[] {
  const label = truncate(props.title, 95) || "درس اللغة العربية";
  const pieces = instructionalParagraphs(props.content);
  const authored = authoredMaterial(props.instructions);
  const explanations = [...pieces, ...authored].filter((s, i, all) => all.indexOf(s) === i);
  const questions = validQuestions(props.questions);
  const activities = usableActivities(props.activities);
  const goals = plannedGoals(props.objectives, explanations.length > 0);
  const vocab = (props.vocabulary ?? []).filter((v) => clean(v.word) && clean(v.meaning)).slice(0, 3);
  const slides: Slide[] = [
    { id: "welcome", phase: "welcome", eyebrow: "ضاديوم | حصة العربية", title: label,
      body: lessonSummary(props.summary) || "نفهم ونجرّب ونلعب ونتحقق من التعلم، خطوة خطوة." },
    { id: "agenda", phase: "overview", eyebrow: "خطة حصتنا", title: "أهداف واضحة… وتعلّم نشط",
      items: goals },
  ];

  goals.forEach((goal, index) => {
    const number = index + 1;
    const exercise = activities[index % (activities.length || 1)];
    const storedQuestion = questions[index];
    slides.push({ id: "goal-" + number, phase: "goal", eyebrow: "الهدف " + number,
      title: "ماذا سأستطيع أن أفعل؟", body: goal, goalNumber: number });
    slides.push({ id: "explain-" + number, phase: "teach", eyebrow: "أفهم الهدف " + number,
      title: index === 0 ? "نقرأ ونفهم" : index === 1 ? "نلاحظ ونحلّل" : "نربط ونستنتج",
      body: explanations[index] || "ارجع إلى الشرح الكامل الموجود أسفل العرض، واقرأ المثال من مصدره الصحيح.",
      goalNumber: number, words: index === 0 ? vocab : undefined });
    slides.push({ id: "activity-" + number, phase: "do", eyebrow: "تطبيق الهدف " + number,
      title: exercise?.title || "أنشطتي لهذا الهدف",
      body: exercise?.prompt || "طبّق الهدف في مثال جديد من إنشائك، ثم ناقش السبب مع معلمك.",
      activity: exercise, goalNumber: number });
    slides.push({ id: "assessment-" + number, phase: "check", eyebrow: "أتأكد من فهمي | الهدف " + number,
      title: storedQuestion ? "تحدٍّ من أسئلة الدرس" : "أشرح وأبرهن",
      body: storedQuestion
        ? "سؤال تدريبي من بنك الدرس؛ لا يُعد إثباتًا منفردًا لإتقان الهدف، وتظهر تغذية راجعة بعد الإجابة."
        : "اشرح الهدف بأسلوبك، واكتب مثالًا صحيحًا وحدد الشاهد. قارن عملك بالشرح واطلب تقييم معلمك.",
      quiz: storedQuestion, goalNumber: number });
  });
  slides.push({ id: "close", phase: "close", eyebrow: "العربية أسهل في ضاديوم",
    title: "أحسنت… تعلّمك يستمر!",
    body: "أكمل الشرح المكتوب، ثم أنشطة الدرس والألعاب والتقويم الرسمي. هذه الشرائح للتدريب التكويني، ولا تسجّل درجات إتقان تلقائيًا." });
  return slides;
}

export default function LessonLearningSlides(props: Props) {
  const deck = useMemo(() => plan(props), [props]);
  const [page, setPage] = useState(0);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const finger = useRef<number | null>(null);
  const index = Math.min(page, deck.length - 1);
  const slide = deck[index];
  const progress = ((index + 1) / deck.length) * 100;
  const dark = slide.phase === "welcome" || slide.phase === "close";
  const surface = dark ? "bg-[#103d37] text-[#fffaf0]" : slide.phase === "do" || slide.phase === "check"
    ? "bg-[#eaf5ef] text-[#183f38]" : "bg-[#fffdf6] text-[#183f38]";
  const select = (id: string, value: string) => setChosen((prev) => ({ ...prev, [id]: value }));
  const go = (n: number) => setPage(Math.max(0, Math.min(deck.length - 1, n)));
  const keyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(index + 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); go(index - 1); }
    if (e.key === "Home") { e.preventDefault(); go(0); }
    if (e.key === "End") { e.preventDefault(); go(deck.length - 1); }
  };
  const gameHref = props.lessonId && /^[0-9a-f-]{36}$/i.test(props.lessonId)
    ? "/lessons/" + props.lessonId + "/games" : null;

  return (
    <section dir="rtl" tabIndex={0} onKeyDown={keyDown}
      onTouchStart={(e) => { finger.current = e.changedTouches[0]?.clientX ?? null; }}
      onTouchEnd={(e) => {
        if (finger.current === null) return;
        const delta = (e.changedTouches[0]?.clientX ?? finger.current) - finger.current;
        finger.current = null;
        if (Math.abs(delta) > 50) go(index + (delta > 0 ? 1 : -1));
      }}
      aria-label="درس تفاعلي متدرج الأهداف من ضاديوم"
      className="overflow-hidden rounded-[1.6rem] border border-[#dccba8] bg-white shadow-xl shadow-[#123f39]/10 outline-none focus-visible:ring-4 focus-visible:ring-[#d6ad57]">
      <div role="progressbar" aria-label="تقدم شرائح الحصة" aria-valuemin={1}
        aria-valuemax={deck.length} aria-valuenow={index + 1} className="h-1.5 bg-[#e9dfc9]">
        <div className="h-full bg-[#bc9045] transition-[width] duration-200" style={{ width: progress + "%" }} />
      </div>
      <article aria-live="polite" aria-atomic="true"
        className={"relative flex min-h-[34rem] flex-col p-5 sm:min-h-[37rem] sm:p-9 lg:p-12 " + surface}>
        <div aria-hidden="true" className="pointer-events-none absolute -left-16 -bottom-16 h-52 w-52 rounded-full border-[30px] border-[#c59a4b]/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border-[32px] border-[#53aa9e]/10" />
        <header className="relative z-10 flex items-start justify-between gap-3 border-b border-current/15 pb-4">
          <div className="min-w-0">
            <p className={"text-xs font-black sm:text-sm " + (dark ? "text-[#f3d79d]" : "text-[#96691b]")}>
              ضاديوم — بيت اللغة العربية
            </p>
            <p className="mt-1 text-xs font-semibold opacity-80">{slide.eyebrow}</p>
          </div>
          <Image src={dark ? "/brand/dadyoom-logo-inverse.webp" : "/brand/dadyoom-logo.webp"}
            alt="شعار ضاديوم" width={120} height={60} sizes="120px" className="h-auto w-24 shrink-0 object-contain sm:w-30" />
        </header>
        <div className="relative z-10 flex flex-1 flex-col justify-center py-6 sm:py-8">
          <p className={"mb-3 text-sm font-bold " + (dark ? "text-[#f3d79d]" : "text-[#916722]")}>
            {index + 1} من {deck.length}
            {slide.goalNumber ? "  •  الهدف " + slide.goalNumber : ""}
          </p>
          <h2 className="font-arabic-display text-2xl font-black leading-[1.65] [overflow-wrap:anywhere] sm:text-3xl lg:text-4xl">
            {slide.title}
          </h2>
          {slide.body ? (
            <p className="mt-5 max-w-[58rem] font-arabic-reading text-xl font-semibold leading-[1.95] sm:text-2xl sm:leading-[1.9]">
              {slide.body}
            </p>
          ) : null}
          {slide.items ? (
            <ol className="mt-6 grid gap-3">
              {slide.items.map((item, n) => (
                <li key={n} className="flex items-start gap-3 rounded-2xl border border-[#e3d6b8] bg-white/85 p-3 text-lg font-bold leading-8 text-[#123f39] sm:p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e0bc72] font-black">{n + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
          ) : null}
          {slide.words?.length ? (
            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              {slide.words.map((item, n) => (
                <div key={n} className="rounded-xl border border-[#e0d0a9] bg-white p-3 text-[#123f39]">
                  <dt className="text-xl font-black">{item.word}</dt>
                  <dd className="mt-1 font-arabic-reading text-lg leading-8">{item.meaning}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {slide.quiz ? (
            <fieldset className="mt-5 space-y-3 rounded-2xl border border-[#b7d0c6] bg-white p-4 text-[#123f39] sm:p-5">
              <legend className="px-1 text-lg font-black leading-8">{slide.quiz.question}</legend>
              {slide.quiz.options.map((choice) => {
                const selected = chosen[slide.quiz!.id] === choice.id;
                const isAnswered = Boolean(chosen[slide.quiz!.id]);
                return (
                  <button key={choice.id} type="button"
                    aria-pressed={selected} onClick={() => select(slide.quiz!.id, choice.id)}
                    className={"block min-h-11 w-full rounded-xl border px-4 py-3 text-right text-base font-semibold leading-7 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b88935] " +
                      (selected ? "border-[#277564] bg-[#dcefe5]" : "border-[#d9dfd7] bg-[#fafdfb] hover:border-[#66a394]")}>
                    {choice.text}
                    {selected ? "  ✓" : ""}
                  </button>
                );
              })}
              {chosen[slide.quiz.id] ? (
                <p role="status" className="rounded-xl border border-[#dfd2ae] bg-[#fff7df] p-3 text-sm font-bold leading-8">
                  {chosen[slide.quiz.id] === slide.quiz.correct ? "إجابة صحيحة، أحسنت!" : "حاول مراجعة المثال، ثم أعد الاختيار."}
                  {slide.quiz.explanation ? "  " + slide.quiz.explanation : ""}
                </p>
              ) : (
                <p className="text-xs text-[#54685d]">تحدٍّ تدريبي داخل العرض، وليس اختبار إتقان رسميًا.</p>
              )}
            </fieldset>
          ) : null}
          {slide.phase === "do" || slide.phase === "check" ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {gameHref ? (
                <Link href={gameHref} className="inline-flex min-h-11 items-center rounded-xl bg-[#123f39] px-5 py-3 text-sm font-black text-white">
                  <span aria-hidden="true" className="ml-2">🎮</span>ألعاب الدرس التفاعلية
                </Link>
              ) : null}
              {slide.phase === "do" ? (
                <span className="inline-flex items-center rounded-xl border border-[#9bb8a4] px-4 py-2 text-sm font-bold">
                  {slide.activity ? "نشاط من بنك الدرس — راجعه مع معلمك" : "تطبيق مفتوح يُراجع مع المعلم"}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <footer className="relative z-10 flex items-center justify-between gap-3 border-t border-current/15 pt-4 text-xs font-bold sm:text-sm">
          <span>العربية لقلب الطالب قبل عقله</span>
          <span dir="ltr">Dadyoom.com</span>
        </footer>
      </article>
      <nav aria-label="التنقل بين خطوات الحصة" className="flex items-center justify-between gap-3 bg-[#123f39] px-3 py-4 text-white sm:px-6">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0}
          aria-label="الشريحة السابقة" className="min-h-11 rounded-xl border border-white/35 px-4 py-2 font-bold disabled:opacity-30">
          السابق
        </button>
        <span className="text-center text-sm font-bold">{index + 1} / {deck.length}</span>
        <button type="button" onClick={() => go(index + 1)} disabled={index === deck.length - 1}
          aria-label="الشريحة التالية" className="min-h-11 rounded-xl bg-[#d7b164] px-4 py-2 font-black text-[#103d37] disabled:opacity-30">
          التالي
        </button>
      </nav>
      <div className="flex flex-wrap justify-center gap-2 bg-[#123f39] px-4 pb-4">
        {deck.map((s, n) => (
          <button key={s.id} type="button" aria-label={"انتقل إلى " + s.eyebrow} aria-current={n === index ? "step" : undefined}
            onClick={() => go(n)} className={n === index
              ? "h-2.5 w-8 rounded-full bg-[#d6ad57]" : "h-2.5 w-2.5 rounded-full bg-white/30 hover:bg-white/65"} />
        ))}
      </div>
    </section>
  );
}
