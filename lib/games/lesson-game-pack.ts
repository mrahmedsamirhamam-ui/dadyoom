/**
 * Dadyoom HTML arcade content contract.
 * One lesson -> five modes -> five distinct prompts in each mode.
 * Server-approved packs can replace the question JSON without changing HTML.
 * Never treat source-generated excerpts as verified ministry textbook content.
 */
export const GAME_MODES = ["maze", "defender", "catcher", "runner", "guardian"] as const;
export type GameMode = typeof GAME_MODES[number];

export type GameItem = {
  prompt: string;
  options: string[];
  answer: string;
  explanation?: string;
};
export type GamePack = Record<GameMode, GameItem[]>;
export type QuestionRow = {
  question: string;
  options: unknown;
  correct_answer: string;
};
export type VocabularyRow = { word: string; meaning: string };

export function optionStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(item => {
    if (typeof item === "string") return item.trim();
    if (item && typeof item === "object") {
      const object = item as Record<string, unknown>;
      return String(object.text ?? object.label ?? object.value ?? object.option ?? "").trim();
    }
    return "";
  }).filter((item): item is string => item.length > 0))).slice(0, 5);
}

export function answerText(raw: string, options: string[], originalOptions?: unknown): string | null {
  const answer = String(raw ?? "").trim();
  if (options.includes(answer)) return answer;
  if (Array.isArray(originalOptions)) {
    const index = originalOptions.findIndex(option =>
      option && typeof option === "object" &&
      String((option as { id?: unknown }).id ?? "").trim() === answer);
    if (index >= 0) return options[index] ?? null;
  }
  if (/^[a-e]$/iu.test(answer)) return options[answer.toLowerCase().charCodeAt(0) - 97] ?? null;
  if (/^[0-4]$/.test(answer)) return options[Number(answer)] ?? null;
  // Question imports have various index conventions; ambiguous numeric formats
  // must not be assumed correct by default.
  const letters = ["أ", "ب", "ج", "د", "هـ"];
  const letter = letters.indexOf(answer);
  if (letter !== -1) return options[letter] ?? null;
  const zeroBased = answer.match(/^index:([0-4])$/);
  if (zeroBased) return options[Number(zeroBased[1])] ?? null;
  const oneBased = answer.match(/^choice:([1-5])$/);
  if (oneBased) return options[Number(oneBased[1]) - 1] ?? null;
  return null;
}

function validItem(item: GameItem): boolean {
  const unique = new Set(item.options);
  return item.prompt.trim().length >= 9 &&
    item.prompt.length <= 500 &&
    item.options.length >= 2 && item.options.length <= 5 &&
    unique.size === item.options.length && unique.has(item.answer) &&
    item.options.every(option => option.length > 0 && option.length <= 120);
}

export function approvedPack(value: unknown): GamePack | null {
  if (!value || typeof value !== "object") return null;
  const pack = value as Record<string, unknown>;
  const result = {} as GamePack;
  for (const mode of GAME_MODES) {
    const rows = pack[mode];
    if (!Array.isArray(rows) || rows.length !== 5) return null;
    const mapped = rows.map(raw => {
      if (!raw || typeof raw !== "object") return null;
      const item = raw as Record<string, unknown>;
      if (typeof item.prompt !== "string" || typeof item.answer !== "string") return null;
      const options = optionStrings(item.options);
      // Never collapse duplicate/blank raw choices when an answer is
      // supplied as an index or option ID: that silently changes its meaning.
      if (!Array.isArray(item.options) || options.length !== item.options.length) return null;
      const candidate: GameItem = {
        prompt: item.prompt.trim(), options,
        answer: item.answer.trim(),
        explanation: typeof item.explanation === "string" ?
          item.explanation.slice(0, 350) : undefined,
      };
      return validItem(candidate) ? candidate : null;
    });
    if (mapped.some(item => item === null)) return null;
    const safe = mapped as GameItem[];
    if (new Set(safe.map(item => item.prompt)).size !== 5) return null;
    result[mode] = safe;
  }
  return result;
}

/**
 * Spread answer positions across all five games and five stages.
 * Imported question banks may consistently store the right option first;
 * game engines must not teach players that the first lane is always safe.
 * Reordering affects presentation only: answer remains the original text.
 */
export function distributeGameAnswerPositions(pack: GamePack): GamePack {
  return Object.fromEntries(GAME_MODES.map((mode, modeIndex) => [
    mode,
    pack[mode].map((item, stageIndex) => {
      const shift = (modeIndex + stageIndex) % item.options.length;
      return {
        ...item,
        options: [
          ...item.options.slice(shift),
          ...item.options.slice(0, shift),
        ],
      };
    }),
  ])) as GamePack;
}

const SKIP_WORDS = new Set([
  "ضاديوم", "الدرس", "الصف", "اللغة", "العربية", "الوزارة",
  "الرسمية", "المصدر", "المراجعة", "الكلمات", "التدريب",
  "المحتوى", "الكتاب", "بداية", "منقولة", "الأنشطة",
  "المناسب", "جديدة", "والآخر", "تعليمي", "المقترح",
]);

function sourceClozeItems(source: string): GameItem[] {
  // Use exact excerpts from this lesson. Not AI-generated factual claims.
  const paragraphs = source.replace(/\r/g, "\n").split(/[\n.!؟؛،:]+/u)
    .map(p => p.replace(/\s+/gu, " ").trim())
    .filter(p => p.length >= 28 && p.length <= 550 &&
      !/^(هذا شرح|حقوق المحتوى|حالة التوثيق|ملاحظة|المصدر الرسمي|مسار دعم|مسار التحدي|تقويم|توجيه تربوي)/u.test(p));
  const full = paragraphs.join(" ");
  const found = [...full.matchAll(/[\p{Script=Arabic}]{4,}/gu)];
  const words = Array.from(new Set(found.map(x => x[0]))).filter(x => !SKIP_WORDS.has(x));
  if (words.length < 5) return [];

  const candidates: GameItem[] = [];
  const seen = new Set<string>();
  for (const paragraph of paragraphs) {
    // Pick several unique significant words from each paragraph, using an
    // individual gap so the answer is traceable to the source passage.
    const tokens = [...paragraph.matchAll(/[\p{Script=Arabic}]{4,}/gu)];
    for (const match of tokens) {
      const word = match[0];
      if (SKIP_WORDS.has(word) || seen.has(word)) continue;
      const offset = match.index ?? 0;
      const a = Math.max(0, offset - 42);
      const b = Math.min(paragraph.length, offset + word.length + 42);
      let excerpt = paragraph.slice(a, b);
      const localIndex = offset - a;
      excerpt = excerpt.slice(0, localIndex) + "ــــــ" + excerpt.slice(localIndex + word.length);
      if (excerpt.length < 27) continue;
      const alternatives = words.filter(w => w !== word &&
        w.length >= 4 && Math.abs(w.length - word.length) <= 5);
      const fallback = words.filter(w => w !== word);
      const distractors = (alternatives.length >= 3 ? alternatives : fallback)
        .filter(w => w !== word).slice(0, 3);
      if (distractors.length < 3) continue;
      const options = [word, ...distractors];
      // Shuffle deterministically, no randomness or extra requests.
      const rotation = (candidates.length * 3 + word.length) % 4;
      const shifted = options.slice(rotation).concat(options.slice(0, rotation));
      const item: GameItem = {
        prompt: "أكمل الكلمة الناقصة من نص هذا الدرس: «" + excerpt + "»",
        options: shifted, answer: word,
        explanation: "الكلمة كما وردت في مادة ضاديوم: «" + word + "».",
      };
      if (!validItem(item)) continue;
      seen.add(word);
      candidates.push(item);
      if (candidates.length >= 80) return candidates;
    }
  }
  return candidates;
}

export function buildLessonGamePack(
  title: string,
  content: string,
  questions: QuestionRow[],
  vocabulary: VocabularyRow[],
): { pack: GamePack | null; bankSize: number; generated: number } {
  const seed: GameItem[] = [];
  for (const row of questions) {
    const options = optionStrings(row.options);
    // A/B/C answers refer to positions in the source array. Removing
    // duplicate or blank choices before mapping a position can mark a
    // different answer as correct, so reject ambiguous imports outright.
    if (!Array.isArray(row.options) ||
        options.length !== row.options.length ||
        options.length < 2 || options.length > 5 ||
        typeof row.question !== "string") continue;
    const answer = answerText(row.correct_answer, options, row.options);
    if (answer) seed.push({ prompt: row.question.trim(), options, answer });
  }
  const meanings = Array.from(new Set(vocabulary.map(x => x.meaning?.trim()).filter(Boolean)));
  for (const row of vocabulary) {
    const word = row.word?.trim(), meaning = row.meaning?.trim();
    if (!word || !meaning || meanings.length < 2) continue;
    const wrong = meanings.filter(x => x !== meaning).slice(0, 3);
    seed.push({
      prompt: "اختر معنى الكلمة «" + word + "» من هذا الدرس",
      options: [meaning, ...wrong],
      answer: meaning,
      explanation: "المفردة «" + word + "» معناها «" + meaning + "».",
    });
  }
  const unique: GameItem[] = [];
  const seen = new Set<string>();
  let generated = 0;
  const sourceItems = sourceClozeItems(content);
  for (const [item, generatedFromText] of [
    ...seed.map((item) => [item, false] as const),
    ...sourceItems.map((item) => [item, true] as const),
  ]) {
    const key = item.prompt.replace(/\s+/gu, " ").trim();
    if (!validItem(item) || seen.has(key)) continue;
    unique.push(item);
    seen.add(key);
    if (generatedFromText) generated += 1;
    if (unique.length >= 25) break;
  }
  if (unique.length < 5) {
    return { pack: null, bankSize: unique.length, generated: 0 };
  }
  const pack = {} as GamePack;
  GAME_MODES.forEach((mode, modeIndex) => {
    // Consecutive windows guarantee five distinct prompts within each game
    // for EVERY bank size >= 5. Stepping by five used to repeat prompts
    // whenever the bank size was 5, 10, 15 or 20.
    // A bank with >=25 candidates also has no cross-game repetitions.
    pack[mode] = Array.from({ length: 5 }, (_, stageIndex) =>
      unique[(modeIndex * 5 + stageIndex) % unique.length]);
  });
  return {
    pack,
    bankSize: unique.length,
    generated,
  };
}
