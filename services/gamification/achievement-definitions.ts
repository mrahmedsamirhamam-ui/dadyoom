export interface AchievementDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS = {
  FIRST_LESSON: {
    key: "FIRST_LESSON",
    title: "أول خطوة",
    description: "أكملت أول درس في ضاديوم.",
    icon: "🥇",
  },

  FIVE_LESSONS: {
    key: "FIVE_LESSONS",
    title: "طالب مجتهد",
    description: "أكملت خمسة دروس.",
    icon: "📚",
  },

  HUNDRED_XP: {
    key: "HUNDRED_XP",
    title: "جامع النقاط",
    description: "وصلت إلى 100 نقطة خبرة.",
    icon: "⭐",
  },

  SEVEN_DAY_STREAK: {
    key: "SEVEN_DAY_STREAK",
    title: "سبعة أيام متتالية",
    description: "تعلمت سبعة أيام دون انقطاع.",
    icon: "🔥",
  },
} satisfies Record<string, AchievementDefinition>;
