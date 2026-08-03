export const LEVELS = [
  {
    level: 1,
    name: "المبتدئ",
    minXp: 0,
    maxXp: 99,
  },
  {
    level: 2,
    name: "المتعلّم",
    minXp: 100,
    maxXp: 249,
  },
  {
    level: 3,
    name: "المجتهد",
    minXp: 250,
    maxXp: 499,
  },
  {
    level: 4,
    name: "المتقدّم",
    minXp: 500,
    maxXp: 899,
  },
  {
    level: 5,
    name: "المتميّز",
    minXp: 900,
    maxXp: 1499,
  },
  {
    level: 6,
    name: "الخبير",
    minXp: 1500,
    maxXp: 2499,
  },
  {
    level: 7,
    name: "فارس العربية",
    minXp: 2500,
    maxXp: 3999,
  },
  {
    level: 8,
    name: "سفير العربية",
    minXp: 4000,
    maxXp: 5999,
  },
  {
    level: 9,
    name: "نجم ضاديوم",
    minXp: 6000,
    maxXp: 8999,
  },
  {
    level: 10,
    name: "أسطورة العربية",
    minXp: 9000,
    maxXp: Number.POSITIVE_INFINITY,
  },
] as const;

export type LevelDefinition =
  (typeof LEVELS)[number];

export function getLevelByXp(
  xp: number
): LevelDefinition {
  const safeXp = Math.max(0, xp);

  return (
    LEVELS.find(
      (level) =>
        safeXp >= level.minXp &&
        safeXp <= level.maxXp
    ) ?? LEVELS[0]
  );
}