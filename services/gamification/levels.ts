import { LEVELS, type LevelDefinition } from "@/lib/constants/levels";


export interface LevelProgress {
  current: LevelDefinition;
  next: LevelDefinition | null;
  progress: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpRemaining: number;
}

export function getLevelProgress(xp: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(xp));

  const current =
    LEVELS.find(
      (level) =>
        safeXp >= level.minXp &&
        safeXp <= level.maxXp
    ) ?? LEVELS[0];

  const currentIndex = LEVELS.findIndex(
    (level) => level.level === current.level
  );

  const next =
    currentIndex < LEVELS.length - 1
      ? LEVELS[currentIndex + 1]
      : null;

  if (!next) {
    return {
      current,
      next: null,
      progress: 100,
      xpIntoLevel: safeXp - current.minXp,
      xpForNextLevel: 0,
      xpRemaining: 0,
    };
  }

  const xpIntoLevel = safeXp - current.minXp;
  const xpForNextLevel = next.minXp - current.minXp;

  return {
    current,
    next,
    progress: Math.min(
      100,
      Math.round((xpIntoLevel / xpForNextLevel) * 100)
    ),
    xpIntoLevel,
    xpForNextLevel,
    xpRemaining: Math.max(0, next.minXp - safeXp),
  };
}
