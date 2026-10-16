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

  // A genuine topic-specific original lesson takes precedence even when
  // legacy national summaries use broad words such as "coverage".
  const originalLessonOpenings = [
    "درس ضاديوم الأصلي:",
    "حزمة ضاديوم الموضوعية المتخصصة",
    "مسار الإتقان الأصلي — ضاديوم",
    "مسار القراءة والفهم الأصلي — ضاديوم",
  ];
  if (originalLessonOpenings.some((opening) => body.startsWith(opening))) {
    return false;
  }

  // National framework nodes sometimes exceed 850 characters yet explicitly
  // state they are NOT a textbook lesson. Length must not grant fake mastery.
  return scopeContentBeginnings.some((opening) => body.startsWith(opening)) ||
    scopeSummaryBeginnings.some((opening) => abstract.startsWith(opening)) ||
    body.startsWith("هذه حزمة تعليمية أصلية من ضاديوم") ||
    body.startsWith("تستخدم ضاديوم اسم الكتاب والفصل المثبتين");
}

export function isEmptyLessonReference(content: string | null | undefined): boolean {
  return !content?.trim();
}

export type LearningResourceKind = "lesson" | "book-reference" | "curriculum-scope";
