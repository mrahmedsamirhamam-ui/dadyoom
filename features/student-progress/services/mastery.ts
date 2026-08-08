export type MasteryStatus =
  | "in_progress"
  | "completed"
  | "mastered";

export function calculateMastery(
  score: number
): MasteryStatus {
  if (score >= 90) {
    return "mastered";
  }

  if (score >= 70) {
    return "completed";
  }

  return "in_progress";
}