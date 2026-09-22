import { getLevelProgress } from "@/services/gamification/levels";

export function calculateLevel(xp: number) {
  const progress = getLevelProgress(xp);

  return {
    level: progress.current.level,
    name: progress.current.name,
    currentXP: progress.xpIntoLevel,
    nextLevelXP: progress.xpForNextLevel,
    percent: progress.progress,
    maxed: progress.next === null,
  };
}
