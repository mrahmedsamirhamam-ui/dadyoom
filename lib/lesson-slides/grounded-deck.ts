/**
 * Source-grounded lesson presentation.
 * Never turn an official-book catalogue node or learning objectives alone into
 * a seemingly complete explanation. No language model or payment is required.
 */
export type GroundedLesson = {
  title: string;
  summary?: string | null;
  content?: string | null;
  learning_objectives?: unknown;
  vocabulary?: unknown;
  instructions?: unknown;
};

export type GroundedSlide = {
  kind: "cover" | "objectives" | "concept" | "activity" | "review";
  title: string;
  subtitle?: string;
  bullets?: string[];
  callout?: string;
  question?: string;
  answer?: string;
};

export type GroundedDeck = {
  title: string;
  slides: GroundedSlide[];
  needsContentReview: boolean;
  omittedContent: boolean;
};

const INDEX_ONLY = /(?:راجع|استخدم|استعن)\s+(?:الكتاب|بكتاب|النسخة|المصدر)\s+(?:الرسمي|المرخصة|المعتمد)|(?:لا|دون)\s+إعادة\s+نشر\s+(?:محتوى|نص)\s+الكتاب/iu;

function clean(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/\r\n?/gu, "\n").replace(/[\t ]+/gu, " ").trim()
    : "";
}

function objectives(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => typeof item === "string" ? clean(item) : "")
    .filter(Boolean)
    .slice(0, 5);
}

function vocabulary(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (!item || typeof item !== "object") return "";
    const entry = item as Record<string, unknown>;
    const word = clean(entry.word);
    const meaning = clean(entry.meaning);
    return word && meaning ? `${word} — ${meaning}` : "";
  }).filter(Boolean).slice(0, 8);
}

function teachingSource(value: unknown): string {
  if (!Array.isArray(value)) return "";
  const rows: string[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const entry = raw as Record<string, unknown>;
    if (entry.kind !== "slides" || !Array.isArray(entry.items)) continue;
    for (const slide of entry.items) {
      if (!slide || typeof slide !== "object") continue;
      const row = slide as Record<string, unknown>;
      const body = clean(row.body);
      if (body) rows.push(body);
    }
  }
  return rows.join("\n\n");
}

/** Preserve sentence content, including long paragraphs previously discarded. */
function segments(source: string): string[] {
  const lines = source.split(/\n+/u).map(clean).filter(Boolean);
  const pieces: string[] = [];
  for (const line of lines) {
    const sentences = line.split(/(?<=[.!؟؛])\s+/u).filter(Boolean);
    for (const sentence of sentences) {
      let pending = sentence.trim();
      while (pending.length > 0) {
        if (pending.length <= 195) {
          pieces.push(pending);
          break;
        }
        const bound = pending.lastIndexOf(" ", 195);
        const cut = bound > 90 ? bound : 195;
        pieces.push(pending.slice(0, cut).trim());
        pending = pending.slice(cut).trim();
      }
    }
  }
  return pieces;
}

function groupSegments(rows: string[], max = 650): string[][] {
  const groups: string[][] = [];
  let current: string[] = [];
  let used = 0;
  for (const row of rows) {
    if (current.length && (used + row.length > max || current.length >= 5)) {
      groups.push(current);
      current = [];
      used = 0;
    }
    current.push(row);
    used += row.length;
  }
  if (current.length) groups.push(current);
  return groups;
}

export function buildGroundedLessonDeck(lesson: GroundedLesson): GroundedDeck {
  const title = clean(lesson.title) || "درس العربية";
  const content = clean(lesson.content);
  const extraSlides = teachingSource(lesson.instructions);
  const source = content || extraSlides;
  const joined = source.replace(/\s+/gu, " ").trim();

  // Book-index records are references, not lessons, even if marked published.
  const indexOnly = joined.length < 420 && INDEX_ONLY.test(joined);
  const noExplanation = joined.length < 85 || indexOnly;
  const slides: GroundedSlide[] = [{
    kind: "cover",
    title,
    subtitle: "عرض تعلم ضاديوم — من متن الدرس",
  }];

  if (noExplanation) {
    slides.push({
      kind: "review",
      title: "الشرح يحتاج إلى استكمال",
      callout: "لا يتوفر في هذا السجل متن تعليمي كافٍ لعرض شرح الدرس.",
      bullets: [
        "لا تُعدّ الأهداف وحدها شرحًا لموضوع الدرس.",
        "ارجع إلى الكتاب المصرّح باستخدامه أو الدرس المكتوب، وانتظر استكمال المحتوى ومراجعته.",
      ],
    });
    return {
      title,
      slides,
      needsContentReview: true,
      omittedContent: false,
    };
  }

  const goals = objectives(lesson.learning_objectives);
  if (goals.length) {
    slides.push({
      kind: "objectives",
      title: "ماذا سنتعلم؟",
      bullets: goals,
    });
  }

  const groups = groupSegments(segments(source));
  const displayedGroups = groups.slice(0, 24);
  displayedGroups.forEach((group, index) => {
    slides.push({
      kind: "concept",
      title: index === 0
        ? "نبدأ بفهم موضوع الدرس"
        : `نستكمل شرح الدرس (${index + 2})`,
      bullets: group,
    });
  });

  const words = vocabulary(lesson.vocabulary);
  if (words.length) {
    slides.push({
      kind: "concept",
      title: "مفردات ومعانٍ من الدرس",
      bullets: words,
    });
  }

  slides.push({
    kind: "activity",
    title: "أطبق ما تعلمته",
    question: "اختر فكرة من الشرح ووضحها بكلماتك.",
    bullets: [
      "اذكر شاهدًا أو مثالًا من الفقرات السابقة إن وجد.",
      "ارجع إلى متن الدرس لتتأكد من صحة شرحك.",
    ],
  });
  slides.push({
    kind: "review",
    title: "أراجع فهمي",
    bullets: [
      "ما الموضوع الذي تناولته فقرات الدرس؟",
      "ما أهم معلومتين تعلمتهما من الشرح؟",
      "أكمل بعد العرض تدريبات ضاديوم الخاصة بالدرس.",
    ],
    callout: groups.length > 24
      ? "هذا العرض يلخص جزءًا من المتن؛ أكمل القراءة في صفحة الدرس."
      : undefined,
  });
  return {
    title,
    slides,
    needsContentReview: false,
    omittedContent: groups.length > 24,
  };
}
