/**
 * A ministry curriculum area is a learning domain, not an individual lesson.
 * Detect our own structured coverage placeholders only; never infer a lesson
 * is incomplete merely because its textbook reference is unavailable.
 */
const scopeContentBeginnings = [
  "هذا المحتوى من إنشاء ضاديوم لتغطية مجال",
  "هذا المحتوى أصلي من ضاديوم ومصمم لمواءمة مجال",
  "هذا درس أصلي من ضاديوم صُمم لتغطية الكفاية الرسمية",
  "هذه حزمة تعليمية أصلية من ضاديوم لمواءمة معايير",
  "تمثل هذه العقدة مجال",
  "يمثل هذا العنصر حزمة نواتج تعلم",
  "محتوى ضاديوم الأصلي لمواءمة",
  "وحدة ضاديوم أصلية لمواءمة مجال",
  "محتوى أصلي من ضاديوم لمواءمة مجال",
  "محتوى تعليمي أصلي من ضاديوم لمواءمة",
  "هذا المحتوى أصلي من ضاديوم لمواءمة مجال",
  "محتوى تعليمي أصلي من ضاديوم لمواءمة «",
  "هذا المحتوى أصلي من ضاديوم ومصمم لمواءمة",
] as const;

const scopeSummaryBeginnings = [
  "حزمة وطنية أصلية من ضاديوم لمجال",
  "تغطية وطنية أصلية من ضاديوم لمجال",
  "حزمة أصلية من ضاديوم لتغطية معايير",
  "حزمة مطابقة وطنية أصلية لمقرر",
  "تغطية تعليمية أصلية من ضاديوم للكفاية",
  "تغطية أصلية من ضاديوم لـ",
  "تغطية أصلية من ضاديوم لمجال",
  "حزمة تعليمية أصلية من ضاديوم لمواءمة",
] as const;

export function isCurriculumScopeRecord({
  summary,
  content,
}: {
  summary?: string | null;
  content?: string | null;
}): boolean {
  const body = (content ?? "").trim();
  const abstract = (summary ?? "").trim();

  // Long real explanatory texts take priority over a boilerplate heading.
  // The observed scopes have 300-600 characters, not worked lessons.
  if (body && body.length >= 850) return false;

  return scopeContentBeginnings.some((opening) => body.startsWith(opening)) ||
    scopeSummaryBeginnings.some((opening) => abstract.startsWith(opening)) ||
    (body.length < 850 && body.startsWith("هذه حزمة تعليمية أصلية من ضاديوم")) ||
    (body.length < 850 && body.startsWith("تستخدم ضاديوم اسم الكتاب والفصل المثبتين"));
}

export function isEmptyLessonReference(content: string | null | undefined): boolean {
  return !content?.trim();
}

export type LearningResourceKind = "lesson" | "book-reference" | "curriculum-scope";
