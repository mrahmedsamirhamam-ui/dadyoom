export function calculateStreak(
  lastLearningDate: Date | null
) {
  if (!lastLearningDate) {
    return 0;
  }

  const today = new Date();

  const diff =
    today.getTime() -
    lastLearningDate.getTime();

  const days = Math.floor(
    diff / (1000 * 60 * 60 * 24)
  );

  if (days === 0) return 1;

  if (days === 1) return 2;

  return 0;
}
