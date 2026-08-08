export type MasteryState =
  | "struggling"
  | "developing"
  | "proficient"
  | "mastered";

export function calculateMastery(
  score: number,
  attempts: number
): MasteryState {
  if (score >= 95 && attempts <= 2) {
    return "mastered";
  }

  if (score >= 80) {
    return "proficient";
  }

  if (score >= 60) {
    return "developing";
  }

  return "struggling";
}

export function masteryColor(
  state: MasteryState
) {
  switch (state) {
    case "mastered":
      return "emerald";

    case "proficient":
      return "blue";

    case "developing":
      return "amber";

    default:
      return "red";
  }
}