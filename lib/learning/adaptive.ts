/** Pure, deterministic recommendations. No learner identity or sensitive data. */
export const ARABIC_SKILLS = [
  "reading", "writing", "spelling", "grammar", "expression", "listening", "speaking",
] as const;
export type ArabicSkill = (typeof ARABIC_SKILLS)[number];
export type LearnerGoal = "school" | "conversation" | "work" | "travel" | "heritage";
export type LearningMode = "text" | "audio" | "visual" | "interactive";
export type Proficiency = "beginner" | "developing" | "independent" | "advanced";
export type LearnerPreferences = {
  goal: LearnerGoal;
  preferredMode: LearningMode;
  interfaceLanguage: string;
};
export type LearningEvidence = {
  skill: ArabicSkill;
  correct: number;
  total: number;
  recentMistakes: number;
};
export type Recommendation = {
  skill: ArabicSkill;
  proficiency: Proficiency;
  action: "review" | "practice" | "advance";
  mode: LearningMode;
  reason: "insufficient_evidence" | "needs_support" | "ready_to_advance" | "keep_practicing";
};

export function recommendNextStep(
  evidence: LearningEvidence,
  preferences: LearnerPreferences,
): Recommendation {
  const { correct, total, recentMistakes } = evidence;
  if (![correct, total, recentMistakes].every(Number.isSafeInteger) ||
      correct < 0 || total < 0 || correct > total || recentMistakes < 0) {
    throw new Error("Invalid learning evidence");
  }
  if (!["text", "audio", "visual", "interactive"].includes(preferences.preferredMode)) {
    throw new Error("Invalid learning mode");
  }
  if (total < 3) {
    return { skill: evidence.skill, proficiency: "beginner", action: "practice",
      mode: preferences.preferredMode, reason: "insufficient_evidence" };
  }
  const accuracy = correct / total;
  if (accuracy < 0.6 || recentMistakes >= 3) {
    return { skill: evidence.skill, proficiency: "beginner", action: "review",
      mode: preferences.preferredMode, reason: "needs_support" };
  }
  if (accuracy >= 0.9 && total >= 5 && recentMistakes === 0) {
    return { skill: evidence.skill, proficiency: "advanced", action: "advance",
      mode: preferences.preferredMode, reason: "ready_to_advance" };
  }
  return { skill: evidence.skill, proficiency: accuracy >= 0.8 ? "independent" : "developing",
    action: "practice", mode: preferences.preferredMode, reason: "keep_practicing" };
}
