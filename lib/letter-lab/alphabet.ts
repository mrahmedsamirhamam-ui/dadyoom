/**
 * Independent, original enrichment content for the Arabic letter world.
 * The list is not a substitute for reviewed national curriculum lessons.
 */
export type ArabicLetter = {
  char: string;
  name: string;
  word: string;
  emoji: string;
  meaning: string;
};

export const ARABIC_LETTERS: readonly ArabicLetter[] = [
  { char: "ا", name: "الألف", word: "أَسَد", emoji: "🦁", meaning: "حيوان قوي" },
  { char: "ب", name: "الباء", word: "بَاب", emoji: "🚪", meaning: "ندخل منه إلى المكان" },
  { char: "ت", name: "التاء", word: "تَمْر", emoji: "🌴", meaning: "ثمرة النخلة" },
  { char: "ث", name: "الثاء", word: "ثَعْلَب", emoji: "🦊", meaning: "حيوان بري" },
  { char: "ج", name: "الجيم", word: "جَمَل", emoji: "🐪", meaning: "حيوان يعيش في الصحراء" },
  { char: "ح", name: "الحاء", word: "حِصَان", emoji: "🐎", meaning: "حيوان نركبه" },
  { char: "خ", name: "الخاء", word: "خَرُوف", emoji: "🐑", meaning: "حيوان له صوف" },
  { char: "د", name: "الدال", word: "دُبّ", emoji: "🐻", meaning: "حيوان كبير" },
  { char: "ذ", name: "الذال", word: "ذُرَة", emoji: "🌽", meaning: "نبات تؤكل حبوبه" },
  { char: "ر", name: "الراء", word: "رُمَّان", emoji: "🍎", meaning: "فاكهة كثيرة الحبوب" },
  { char: "ز", name: "الزاي", word: "زَهْرَة", emoji: "🌸", meaning: "جزء ملون من النبات" },
  { char: "س", name: "السين", word: "سَمَكَة", emoji: "🐟", meaning: "حيوان يعيش في الماء" },
  { char: "ش", name: "الشين", word: "شَجَرَة", emoji: "🌳", meaning: "نبات له جذع وأغصان" },
  { char: "ص", name: "الصاد", word: "صَقْر", emoji: "🦅", meaning: "طائر جارح" },
  { char: "ض", name: "الضاد", word: "ضِفْدَع", emoji: "🐸", meaning: "حيوان يقفز قرب الماء" },
  { char: "ط", name: "الطاء", word: "طَائِرَة", emoji: "✈️", meaning: "وسيلة نقل تطير" },
  { char: "ظ", name: "الظاء", word: "ظَرْف", emoji: "✉️", meaning: "نضع الرسالة داخله" },
  { char: "ع", name: "العين", word: "عَيْن", emoji: "👁️", meaning: "نرى بها" },
  { char: "غ", name: "الغين", word: "غَزَال", emoji: "🦌", meaning: "حيوان سريع ورشيق" },
  { char: "ف", name: "الفاء", word: "فَرَاشَة", emoji: "🦋", meaning: "حشرة ملونة تطير" },
  { char: "ق", name: "القاف", word: "قَمَر", emoji: "🌙", meaning: "جرم نراه في السماء ليلًا" },
  { char: "ك", name: "الكاف", word: "كِتَاب", emoji: "📚", meaning: "نقرأ صفحاته" },
  { char: "ل", name: "اللام", word: "لَيْمُون", emoji: "🍋", meaning: "ثمرة حمضية" },
  { char: "م", name: "الميم", word: "مَوْز", emoji: "🍌", meaning: "فاكهة صفراء" },
  { char: "ن", name: "النون", word: "نَجْم", emoji: "⭐", meaning: "جرم مضيء في السماء" },
  { char: "ه", name: "الهاء", word: "هَدِيَّة", emoji: "🎁", meaning: "نقدمها لمن نحب" },
  { char: "و", name: "الواو", word: "وَرْدَة", emoji: "🌹", meaning: "زهرة جميلة" },
  { char: "ي", name: "الياء", word: "يَد", emoji: "✋", meaning: "نمسك بها الأشياء" },
] as const;

export const ARABIC_VOWELS = [
  { label: "الفَتْحَة", mark: "َ" },
  { label: "الضَّمَّة", mark: "ُ" },
  { label: "الكَسْرَة", mark: "ِ" },
] as const;

/** Initial hamza forms are introduced alongside alif; do not teach اَ / اِ. */
export function letterWithVowel(char: string, index: number): string {
  if (index < 0 || index >= ARABIC_VOWELS.length) return char;
  if (char === "ا") return ["أَ", "أُ", "إِ"][index];
  return char + ARABIC_VOWELS[index].mark;
}

export function getLetterChallengeOptions(index: number): readonly string[] {
  if (!Number.isInteger(index) || index < 0 || index >= ARABIC_LETTERS.length) return [];
  const candidates = [
    ARABIC_LETTERS[index].char,
    ARABIC_LETTERS[(index + 7) % ARABIC_LETTERS.length].char,
    ARABIC_LETTERS[(index + 17) % ARABIC_LETTERS.length].char,
  ];
  const offset = index % candidates.length;
  return [...candidates.slice(offset), ...candidates.slice(0, offset)];
}
