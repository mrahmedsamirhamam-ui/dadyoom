import type {
  AIProvider,
  AiLearningPlan,
  AiRecommendation,
  StudentAiContext,
} from "./provider";

export class MockAIProvider implements AIProvider {
  async generateRecommendation(
    context: StudentAiContext
  ): Promise<AiRecommendation> {
    const hasWeakSkill =
      context.weakestSkill &&
      context.weakestSkillScore < 60;

    return {
      title: hasWeakSkill
        ? `لنقوِّ مهارة ${context.weakestSkill}`
        : "واصل تقدمك الرائع",
      message: hasWeakSkill
        ? `يا ${context.studentName}، خصص وقتًا قصيرًا اليوم للتدرب على ${context.weakestSkill}. التدريب المنتظم سيساعدك على التقدم بثبات.`
        : `أحسنت يا ${context.studentName}. واصل التعلم واجمع المزيد من نقاط الخبرة.`,
      priority: hasWeakSkill ? "high" : "low",
      lessonId: null,
    };
  }

  async generateLearningPlan(
    context: StudentAiContext
  ): Promise<AiLearningPlan> {
    const focusSkill =
      context.weakestSkill || "القراءة";

    const needsSupport =
      context.weakestSkillScore < 60;

    return {
      title: "خطة ضاديوم لليوم",
      message: `سنركز اليوم على تطوير مهارة ${focusSkill} من خلال نشاط قصير ومحدد.`,
      priority: needsSupport ? "high" : "medium",
      focusSkill,
      recommendedLesson: null,
      practiceType:
        focusSkill.includes("قراءة") ||
        focusSkill.includes("استيعاب")
          ? "reading"
          : "quiz",
      dailyGoal: "15 دقيقة",
      motivation: `أنت قادر يا ${context.studentName} على إحراز تقدم واضح بخطوة صغيرة كل يوم.`,
    };
  }
}
