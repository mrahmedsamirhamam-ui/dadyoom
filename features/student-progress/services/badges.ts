export type Badge = {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
};

export function calculateBadges(stats: {
  totalXP: number;
  completed: number;
  mastered: number;
}): Badge[] {
  return [
    {
      id: "first_lesson",
      title: "أول درس",
      icon: "📘",
      unlocked: stats.completed >= 1,
    },
    {
      id: "five_lessons",
      title: "أنجز 5 دروس",
      icon: "🏆",
      unlocked: stats.completed >= 5,
    },
    {
      id: "master",
      title: "خبير الإتقان",
      icon: "⭐",
      unlocked: stats.mastered >= 10,
    },
    {
      id: "xp100",
      title: "100 XP",
      icon: "⚡",
      unlocked: stats.totalXP >= 100,
    },
    {
      id: "xp500",
      title: "500 XP",
      icon: "🚀",
      unlocked: stats.totalXP >= 500,
    },
  ];
}