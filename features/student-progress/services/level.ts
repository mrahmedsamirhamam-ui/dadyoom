export function calculateLevel(
  xp: number
) {
  const level =
    Math.floor(xp / 100) + 1;

  const currentXP =
    xp % 100;

  const nextLevelXP = 100;

  return {
    level,
    currentXP,
    nextLevelXP,
    percent:
      Math.round(
        (currentXP / nextLevelXP) * 100
      ),
  };
}
