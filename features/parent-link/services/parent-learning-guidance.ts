export type ParentProgressInput = {
  completedLessons: number;
  masteredLessons: number;
  averageScore: number;
};

export type ParentLearningGuidance = {
  masteryRate: number;
  academicStatus:
    | "بانتظار بيانات"
    | "أداء متميز"
    | "أداء جيد"
    | "يحتاج متابعة"
    | "يحتاج دعمًا إضافيًا";
  recommendation: string;
  nextAction: string;
};

function nonNegativeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function percentage(value: number): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
}

/**
 * Guidance for families based on the existing progress summary only.
 * It is not a diagnostic assessment or an authoritative grade verification.
 * All values must come from a permission-checked parent/child data source.
 */
export function buildParentLearningGuidance({
  completedLessons,
  masteredLessons,
  averageScore,
}: ParentProgressInput): ParentLearningGuidance {
  const completed = nonNegativeCount(completedLessons);
  const mastered = Math.min(completed, nonNegativeCount(masteredLessons));
  const average = percentage(averageScore);
  const masteryRate = completed > 0
    ? Math.round((mastered / completed) * 100)
    : 0;

  if (completed === 0) {
    return {
      masteryRate,
      academicStatus: "بانتظار بيانات",
      recommendation: "لا توجد دروس مكتملة بعد. شجع الطالب على بدء التعلم وإتمام أول تدريب.",
      nextAction: "اختاروا درسًا واحدًا، واقرؤوا مقدمته معًا مدة 10 دقائق، ثم حلوا سؤالًا واحدًا.",
    };
  }

  if (average >= 85 && masteryRate >= 70) {
    return {
      masteryRate,
      academicStatus: "أداء متميز",
      recommendation: "تُظهر المؤشرات الحالية تقدمًا جيدًا. حافظوا على الانتظام في التعلم.",
      nextAction: "اطلب من الطالب شرح ما تعلمه بأسلوبه ثم كتابة ثلاث جمل تطبيقية.",
    };
  }

  if (average >= 70) {
    return {
      masteryRate,
      academicStatus: "أداء جيد",
      recommendation: "تابعوا المراجعة المنتظمة، وخاصة الدروس التي لم تصل إلى الإتقان.",
      nextAction: "راجعوا درسًا غير متقن لمدة 10 دقائق ثم أجيبوا عن ثلاثة أسئلة.",
    };
  }

  if (average >= 50) {
    return {
      masteryRate,
      academicStatus: "يحتاج متابعة",
      recommendation: "يحتاج الطالب إلى مراجعة الدروس والمهارات الأقل إتقانًا.",
      nextAction: "اقرؤوا فقرة قصيرة معًا، ثم اطلب من الطالب تلخيصها في جملتين.",
    };
  }

  return {
    masteryRate,
    academicStatus: "يحتاج دعمًا إضافيًا",
    recommendation: "قد يحتاج الطالب إلى متابعة أكثر قربًا مع المعلم ومراجعة المهارات الأساسية.",
    nextAction: "اختاروا مهارة أساسية واحدة وتدرّبوا عليها لمدة 10 دقائق، ثم اطلبوا ملاحظات المعلم.",
  };
}
