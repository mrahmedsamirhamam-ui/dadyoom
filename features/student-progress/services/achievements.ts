export type Achievement = {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
};

export function calculateAchievements(stats: {
  lessons: number;
  completed: number;
  mastered: number;
  totalXP: number;
}): Achievement[] {
  return [
    {
      id: "lessons_10",
      title: "قارئ مجتهد",
      description: "أكمل 10 دروس",
      progress: stats.completed,
      target: 10,
      completed: stats.completed >= 10,
    },

    {
      id: "master_20",
      title: "خبير العربية",
      description: "أتقن 20 درسًا",
      progress: stats.mastered,
      target: 20,
      completed: stats.mastered >= 20,
    },

    {
      id: "xp_1000",
      title: "ألف نقطة خبرة",
      description: "احصل على 1000 XP",
      progress: stats.totalXP,
      target: 1000,
      completed: stats.totalXP >= 1000,
    },
  ];
}
