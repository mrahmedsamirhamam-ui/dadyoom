type StudentMemoryRow = {
  skill: string;
  score: number;
  attempts: number;
  updated_at: string;
};

export type StudentMemorySummary = {
  totalSkills: number;
  totalAttempts: number;
  averageScore: number;
  strongestSkill: string | null;
  strongestSkillScore: number;
  weakestSkill: string | null;
  weakestSkillScore: number;
  skillsNeedingReview: string[];
  summary: string;
};

export function buildStudentMemorySummary(
  memory: StudentMemoryRow[]
): StudentMemorySummary {
  if (memory.length === 0) {
    return {
      totalSkills: 0,
      totalAttempts: 0,
      averageScore: 0,
      strongestSkill: null,
      strongestSkillScore: 0,
      weakestSkill: null,
      weakestSkillScore: 0,
      skillsNeedingReview: [],
      summary:
        "لا توجد بيانات تعلم كافية حتى الآن.",
    };
  }

  const sortedSkills = [...memory].sort(
    (first, second) =>
      first.score - second.score
  );

  const weakestSkill =
    sortedSkills[0];

  const strongestSkill =
    sortedSkills[
      sortedSkills.length - 1
    ];

  const totalAttempts =
    memory.reduce(
      (total, item) =>
        total + item.attempts,
      0
    );

  const averageScore =
    Math.round(
      memory.reduce(
        (total, item) =>
          total + item.score,
        0
      ) / memory.length
    );

  const skillsNeedingReview =
    sortedSkills
      .filter(
        (item) =>
          item.score < 70
      )
      .map(
        (item) =>
          item.skill
      );

  const summaryParts = [
    `متوسط مستوى الطالب ${averageScore}%.`,
    `أقوى مهارة هي ${strongestSkill.skill} بنسبة ${strongestSkill.score}%.`,
    `المهارة الأكثر احتياجًا للتحسين هي ${weakestSkill.skill} بنسبة ${weakestSkill.score}%.`,
    skillsNeedingReview.length > 0
      ? `المهارات التي تحتاج إلى مراجعة: ${skillsNeedingReview.join("، ")}.`
      : "لا توجد مهارات منخفضة حاليًا.",
    `إجمالي المحاولات المسجلة: ${totalAttempts}.`,
  ];

  return {
    totalSkills:
      memory.length,

    totalAttempts,

    averageScore,

    strongestSkill:
      strongestSkill.skill,

    strongestSkillScore:
      strongestSkill.score,

    weakestSkill:
      weakestSkill.skill,

    weakestSkillScore:
      weakestSkill.score,

    skillsNeedingReview,

    summary:
      summaryParts.join(" "),
  };
}