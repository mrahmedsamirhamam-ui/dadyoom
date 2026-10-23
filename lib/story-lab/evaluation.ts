import type { StoryQuestion } from "./stories";

/** Training-only decision; no grades, student identity or server writes. */
export function evaluateStoryChoice(question: StoryQuestion, index: number) {
  const correct = Number.isInteger(index) && index >= 0 && index < question.choices.length && index === question.correctIndex;
  return {
    correct,
    feedback: correct ? question.explanation : question.hint,
  };
}

export function describeStoryPractice(firstTryCorrect: number, total: number): string {
  if (total === 0) return "ابدأ بمشاهدة القصة ثم أجب عن الأسئلة.";
  if (firstTryCorrect === total) return "ممتاز! فهمت الأمثلة من المحاولة الأولى.";
  if (firstTryCorrect >= Math.ceil(total / 2)) return "تقدم جميل! راجع الأمثلة التي احتجت فيها إلى تلميح.";
  return "واصل التدريب: ارجع إلى المشاهد واستمع للشرح ثم جرّب مرة أخرى.";
}
