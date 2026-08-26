export function calculateXP(
  score: number
): number {
  if (score >= 95) return 30;
  if (score >= 85) return 20;
  if (score >= 70) return 15;

  return 5;
}
