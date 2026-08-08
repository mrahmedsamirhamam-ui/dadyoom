export type AdaptiveLearningStep = {
  order: number;
  type: "lesson" | "practice" | "assessment";
  title: string;
  description: string;
  targetId?: string;
};

export type AdaptiveLearningPlan = {
  focusSkill: string;
  steps: AdaptiveLearningStep[];
};

export function buildAdaptiveLearningPlan(
  focusSkill: string,
  lessonId?: string
): AdaptiveLearningPlan {
  return {
    focusSkill,

    steps: [
      {
        order: 1,
        type: "lesson",
        title: "راجع الدرس",
        description:
          "ابدأ بمراجعة شرح المهارة.",
        targetId: lessonId,
      },

      {
        order: 2,
        type: "practice",
        title: "حل نشاطًا تدريبيًا",
        description:
          "أجب عن مجموعة من الأسئلة القصيرة.",
        targetId: lessonId,
      },

      {
        order: 3,
        type: "assessment",
        title: "اختبر نفسك",
        description:
          "أعد الاختبار للتأكد من تحسن مستواك.",
        targetId: lessonId,
      },
    ],
  };
}