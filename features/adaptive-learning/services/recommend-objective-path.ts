import {
  type AssessmentTier,
  type DeliveryStrategy,
  type UnifiedLearningObjective,
  validateUnifiedObjective,
} from "./unified-objective-contract";
import type { EvidenceDecision } from "./evidence-based-mastery";

export type ObjectivePathDecision = {
  learningObjectiveId: string;
  strategy: DeliveryStrategy;
  assessmentTier: AssessmentTier;
  nextAction: EvidenceDecision["action"];
  reasonAr: string;
  nextReviewAt: string | null;
  canClaimValidatedMastery: false;
  /** The student may freely change explanation, not rewrite evidence. */
  isStrategyLearnerSelected: boolean;
};

const DEFAULT_STRATEGY: Record<AssessmentTier, DeliveryStrategy> = {
  support: "visual",
  application: "inquiry",
  challenge: "creative",
};

function tierForEvidence(decision: EvidenceDecision): AssessmentTier {
  if (decision.status === "needs_support" ||
      decision.status === "needs_retention_repair") return "support";
  if (decision.action === "collect_independent_evidence" ||
      decision.action === "guided_practice") return "support";
  if (decision.action === "offer_transfer_check" ||
      decision.action === "schedule_independent_check" ||
      decision.action === "run_retention_check") return "application";
  return "challenge";
}

/**
 * Rule-based route selection. Only accept EvidenceDecision produced server-side
 * from verified attempts. The browser may choose a delivery strategy but never
 * a score, hint count, question key, authorization role, or mastery claim.
 */
export function recommendObjectivePath(
  objective: UnifiedLearningObjective,
  evidence: EvidenceDecision,
  preferredStrategy?: DeliveryStrategy,
): ObjectivePathDecision {
  const errors = validateUnifiedObjective(objective);
  if (errors.length) throw new Error("Unapproved objective contract: " + errors.join(","));

  const tier = tierForEvidence(evidence);
  const validChoice = preferredStrategy !== undefined &&
    objective.strategies.some((strategy) => strategy.id === preferredStrategy);
  const strategy = validChoice ? preferredStrategy : DEFAULT_STRATEGY[tier];
  const reason: Record<AssessmentTier, string> = {
    support: "نعود إلى شرح موجّه وتمرين بنائي؛ التلميح للتدريب ولا يثبت الإتقان.",
    application: "نطبّق الهدف نفسه باستقلال، ثم نراجعه في سياق مختلف.",
    challenge: "نعمّق تطبيق الهدف بإبداع؛ مراجعة الاحتفاظ هي التي تؤكد استمرار التعلّم.",
  };
  return {
    learningObjectiveId: objective.id,
    strategy,
    assessmentTier: tier,
    nextAction: evidence.action,
    reasonAr: reason[tier],
    nextReviewAt: evidence.nextReviewAt,
    canClaimValidatedMastery: false,
    isStrategyLearnerSelected: validChoice,
  };
}
