/**
 * نموذج إثرائي أصلي لضاديوم. لا يمثل درسًا رسميًا ولا يسجّل بيانات الطلاب.
 * تصاغ الأمثلة بصورة مستقلة، ولا تُربط بالمنهج إلا بعد مراجعة المعلم.
 */
export type LetterLabLevel = "foundation" | "building" | "challenge";

export type LetterLabActivity = {
  id: string;
  word: string;
  icon: string;
  clue: string;
  initialChoices: readonly string[];
  extraLetters: readonly string[];
  meaningChoices: readonly string[];
  correctMeaning: string;
  example: string;
};

export const LETTER_LAB_LEVELS: Record<LetterLabLevel, {
  label: string;
  description: string;
}> = {
  foundation: { label: "التأسيس", description: "كلمات مألوفة وقصيرة" },
  building: { label: "البناء", description: "كلمات من المدرسة والحياة" },
  challenge: { label: "التحدي", description: "مفردات أوسع وتوظيفها" },
};

export const LETTER_LAB_ACTIVITIES: Record<LetterLabLevel, readonly LetterLabActivity[]> = {
  foundation: [
    { id: "tree", word: "شجرة", icon: "🌳", clue: "نبات له جذع وأغصان", initialChoices: ["س", "ش", "ج"], extraLetters: ["ك", "ف"], meaningChoices: ["نبات له جذع وأغصان", "أداة للكتابة", "مكان للدراسة"], correctMeaning: "نبات له جذع وأغصان", example: "تمنحنا الشجرة الظل." },
    { id: "book", word: "كتاب", icon: "📚", clue: "نقرأ صفحاته لنتعلم", initialChoices: ["ق", "ب", "ك"], extraLetters: ["س", "د"], meaningChoices: ["أداة للرسم", "صفحات نجمع فيها المعرفة", "نوع من الطعام"], correctMeaning: "صفحات نجمع فيها المعرفة", example: "أقرأ كتابًا مفيدًا." },
    { id: "pen", word: "قلم", icon: "✏️", clue: "نكتب به أفكارنا", initialChoices: ["ك", "ق", "م"], extraLetters: ["ش", "و"], meaningChoices: ["أداة نكتب بها", "وسيلة نقل", "ثمرة لذيذة"], correctMeaning: "أداة نكتب بها", example: "أكتب بالقلم جملة جميلة." },
  ],
  building: [
    { id: "library", word: "مكتبة", icon: "📖", clue: "مكان نبحث فيه عن الكتب", initialChoices: ["م", "ب", "ك"], extraLetters: ["س", "ر"], meaningChoices: ["مكان لاستعارة الكتب وقراءتها", "مكان لممارسة السباحة", "وسيلة اتصال"], correctMeaning: "مكان لاستعارة الكتب وقراءتها", example: "أزور المكتبة لأستعير قصة." },
    { id: "school", word: "مدرسة", icon: "🏫", clue: "نتعلم فيها مع معلمينا", initialChoices: ["د", "ن", "م"], extraLetters: ["ك", "ج"], meaningChoices: ["مكان للتعلم", "نوع من الأشجار", "أداة للكتابة"], correctMeaning: "مكان للتعلم", example: "مدرستي بيت العلم." },
    { id: "window", word: "نافذة", icon: "🪟", clue: "نفتحها ليدخل الهواء", initialChoices: ["ن", "ف", "و"], extraLetters: ["س", "ح"], meaningChoices: ["فتحة يدخل منها الضوء والهواء", "طريق للمشاة", "وعاء للماء"], correctMeaning: "فتحة يدخل منها الضوء والهواء", example: "فتحت النافذة صباحًا." },
  ],
  challenge: [
    { id: "initiative", word: "مبادرة", icon: "💡", clue: "خطوة إيجابية نبدأ بها عملًا نافعًا", initialChoices: ["ب", "م", "ن"], extraLetters: ["س", "ه"], meaningChoices: ["عمل نبدأ به لتحقيق فائدة", "تأخر عن موعد", "تكرار الكلام"], correctMeaning: "عمل نبدأ به لتحقيق فائدة", example: "أطلق الطلاب مبادرة للقراءة." },
    { id: "sustain", word: "استدامة", icon: "🌱", clue: "استمرار الموارد والمنافع مع حفظها للمستقبل", initialChoices: ["إ", "س", "ا"], extraLetters: ["ج", "ن"], meaningChoices: ["الحفاظ على الموارد للأجيال القادمة", "زيادة الهدر", "نسيان ما تعلمناه"], correctMeaning: "الحفاظ على الموارد للأجيال القادمة", example: "ترشيد الماء يدعم الاستدامة." },
    { id: "tolerance", word: "تسامح", icon: "🤝", clue: "احترام الآخرين وتجاوز الإساءة", initialChoices: ["ت", "ث", "س"], extraLetters: ["ق", "ي"], meaningChoices: ["احترام الآخرين والعفو عنهم", "إيذاء الآخرين", "إهمال الواجب"], correctMeaning: "احترام الآخرين والعفو عنهم", example: "يسود التسامح بين الأصدقاء." },
  ],
};

export type LetterTile = { id: string; value: string };

export function makeLetterTiles(activity: LetterLabActivity): LetterTile[] {
  const target = Array.from(activity.word).map((value, index) => ({
    id: activity.id + "-letter-" + index,
    value,
  }));
  const extra = activity.extraLetters.map((value, index) => ({
    id: activity.id + "-extra-" + index,
    value,
  }));
  // ترتيب ثابت كي لا تتغير البطاقات عند إعادة الرسم أو الترطيب.
  return [...target.slice().reverse(), ...extra];
}

export function isCorrectLetterSequence(letters: readonly string[], word: string): boolean {
  return letters.join("") === word;
}

export function getLetterLabMastery(score: number, total: number): string {
  if (total <= 0) return "ابدأ لتتعرف على مستواك";
  if (score / total >= 0.8) return "إتقان جيد في هذه التجربة";
  if (score / total >= 0.5) return "تقدم جيد ويحتاج بعض التدريب";
  return "حاول مرة أخرى مع التلميحات";
}
