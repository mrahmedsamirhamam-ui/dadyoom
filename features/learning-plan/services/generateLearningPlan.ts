type SkillResult = {
  total: number;
  correct: number;
  percentage: number;
};

export type LearningRecommendation = {
  skill: string;
  priority: number;
  recommendation: string;
};

type GenerateLearningPlanOptions = {
  recentFocusSkills?: string[];
  masteredSkills?: string[];
};

const ADVANCED_SKILLS = [
  "الاستنتاج",
  "التحليل",
  "التقويم",
  "التعبير",
  "التذوق",
] as const;

function normalizeSkill(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/gu, " ");
}

function selectNextAdvancedSkill(
  excludedSkills: Set<string>
): string {
  return (
    ADVANCED_SKILLS.find(
      (skill) =>
        !excludedSkills.has(skill)
    ) ??
    ADVANCED_SKILLS[0]
  );
}

export function generateLearningPlan(
  skills: Record<
    string,
    SkillResult
  >,
  options:
    GenerateLearningPlanOptions = {}
): LearningRecommendation[] {
  const recentFocusSkills =
    new Set(
      (
        options.recentFocusSkills ??
        []
      ).map(normalizeSkill)
    );

  const masteredSkills =
    new Set(
      (
        options.masteredSkills ??
        []
      ).map(normalizeSkill)
    );

  const recommendations =
    Object.entries(skills)
      .map(
        ([rawSkill, result]) => {
          const skill =
            normalizeSkill(
              rawSkill
            ) || "الاستيعاب";

          let priority = 1;
          let recommendation =
            "استمر بالممارسة.";

          if (
            result.percentage < 50
          ) {
            priority = 5;
            recommendation =
              "أعد شرح المهارة، ثم نفّذ تدريبات متدرجة قبل الاختبار مرة أخرى.";
          } else if (
            result.percentage < 70
          ) {
            priority = 4;
            recommendation =
              "حل مجموعة أسئلة جديدة مع مراجعة الأخطاء بعد كل محاولة.";
          } else if (
            result.percentage < 85
          ) {
            priority = 3;
            recommendation =
              "نفّذ مراجعة قصيرة، ثم أجب عن اختبار سريع لتثبيت المهارة.";
          } else if (
            result.percentage < 100
          ) {
            priority = 2;
            recommendation =
              "نفّذ تدريبًا متقدمًا لتثبيت الإتقان قبل الانتقال إلى مهارة جديدة.";
          } else {
            priority = 1;
            recommendation =
              "تم إتقان المهارة؛ انتقل إلى مهارة أعلى وأكثر تحديًا.";
          }

          if (
            recentFocusSkills.has(
              skill
            ) &&
            result.percentage >= 70
          ) {
            priority =
              Math.max(
                0,
                priority - 2
              );
          }

          if (
            masteredSkills.has(
              skill
            ) ||
            result.percentage >= 85
          ) {
            priority =
              Math.min(
                priority,
                1
              );
          }

          return {
            skill,
            priority,
            recommendation,
            percentage:
              result.percentage,
          };
        }
      )
      .sort((first, second) => {
        if (
          second.priority !==
          first.priority
        ) {
          return (
            second.priority -
            first.priority
          );
        }

        return (
          first.percentage -
          second.percentage
        );
      });

  const needsImprovement =
    recommendations.filter(
      (item) =>
        item.percentage < 85
    );

  if (
    needsImprovement.length > 0
  ) {
    return needsImprovement.map(
      ({
        skill,
        priority,
        recommendation,
      }) => ({
        skill,
        priority,
        recommendation,
      })
    );
  }

  const excludedSkills =
    new Set<string>([
      ...recentFocusSkills,
      ...masteredSkills,
      ...recommendations
        .filter(
          (item) =>
            item.percentage >= 85
        )
        .map(
          (item) =>
            item.skill
        ),
    ]);

  const nextSkill =
    selectNextAdvancedSkill(
      excludedSkills
    );

  return [
    {
      skill:
        nextSkill,
      priority: 3,
      recommendation:
        `ابدأ تدريبًا جديدًا في مهارة ${nextSkill} للانتقال إلى مستوى أعلى.`,
    },
    ...recommendations.map(
      ({
        skill,
        priority,
        recommendation,
      }) => ({
        skill,
        priority,
        recommendation,
      })
    ),
  ];
}