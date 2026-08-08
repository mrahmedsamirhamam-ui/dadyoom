export type SkillAnalytics = {
  total: number;
  correct: number;
  percentage: number;
};

export type AssessmentAnalytics = {
  overallPercentage: number;
  strengths: string[];
  weaknesses: string[];
  skills: Record<string, SkillAnalytics>;
};

type Question = {
  skill: string;
  isCorrect: boolean;
};

export function analyzeAssessment(
  questions: Question[]
): AssessmentAnalytics {

  const skills: Record<string, SkillAnalytics> = {};

  for (const question of questions) {

    if (!skills[question.skill]) {
      skills[question.skill] = {
        total: 0,
        correct: 0,
        percentage: 0,
      };
    }

    skills[question.skill].total++;

    if (question.isCorrect) {
      skills[question.skill].correct++;
    }
  }

  let totalCorrect = 0;

  for (const skill of Object.keys(skills)) {

    const current = skills[skill];

    totalCorrect += current.correct;

    current.percentage = Math.round(
      (current.correct / current.total) * 100
    );
  }

  const strengths = Object.entries(skills)
    .filter(([, value]) => value.percentage >= 80)
    .map(([key]) => key);

  const weaknesses = Object.entries(skills)
    .filter(([, value]) => value.percentage < 60)
    .map(([key]) => key);

  return {

    overallPercentage: Math.round(
      (totalCorrect / questions.length) * 100
    ),

    strengths,

    weaknesses,

    skills,

  };
}