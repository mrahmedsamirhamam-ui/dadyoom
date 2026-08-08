export function buildLessonInsights(
  wrongQuestions: number,
  totalQuestions: number
) {
  const percent =
    totalQuestions === 0
      ? 0
      : Math.round(
          (wrongQuestions / totalQuestions) * 100
        );

  if (percent <= 10) {
    return "أداؤك ممتاز، استمر.";
  }

  if (percent <= 30) {
    return "راجع بعض المفاهيم قبل الانتقال.";
  }

  if (percent <= 60) {
    return "ينصح بإعادة قراءة الدرس.";
  }

  return "ابدأ الدرس من جديد مع استخدام المعلم الذكي.";
}