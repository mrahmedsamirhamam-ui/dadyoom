/**
 * Dadyoom curriculum contract: ONE immutable objective identity; many routes.
 * Metadata is safe for rendering. Answer keys, scores and student PII DO NOT
 * belong here. Framework alignments require editorial evidence, not inference.
 */
export type DeliveryStrategy = "visual" | "inquiry" | "creative";
export type AssessmentTier = "support" | "application" | "challenge";
export type CurriculumSystem = "national" | "cambridge" | "ib" | "cefr";
export type ResponseMode = "visual_choice" | "drag_drop" | "short_answer" | "constructed_response";

export interface CurriculumAlignment {
  system: CurriculumSystem;
  code: string;
  sourceVersion: string; // Ministry year / Cambridge examination year / IB guide edition
  countryCode?: string; // only for a verified national alignment
  sourceUrl?: string;
  verified: boolean;
}

export interface ObjectiveStrategy {
  learningObjectiveId: string;
  id: DeliveryStrategy;
  label: string;
  explanation: string;
  teachingActivities: readonly string[];
}

export interface ObjectiveAssessment {
  learningObjectiveId: string;
  tier: AssessmentTier;
  responseMode: ResponseMode;
  prompt: string;
  formativeHint?: string;
  rubric: readonly string[];
  requiresHumanReview: boolean;
}

export interface UnifiedLearningObjective {
  id: string; // maps to existing lesson_learning_objectives.id
  lessonId: string;
  objective: string;
  observableSuccessCriterion: string;
  curriculumAlignments: readonly CurriculumAlignment[];
  strategies: readonly ObjectiveStrategy[];
  assessments: readonly ObjectiveAssessment[];
  editoriallyApproved: boolean;
}

const REQUIRED_STRATEGIES: readonly DeliveryStrategy[] = ["visual", "inquiry", "creative"];
const REQUIRED_TIERS: readonly AssessmentTier[] = ["support", "application", "challenge"];
const ALLOWED_MODES: readonly ResponseMode[] = ["visual_choice", "drag_drop", "short_answer", "constructed_response"];

/** Publishing gate. Never infer the mapping from a lesson title or grade alone. */
export function validateUnifiedObjective(input: UnifiedLearningObjective): string[] {
  const errors: string[] = [];
  if (!input.id.trim() || !input.lessonId.trim()) errors.push("missing-objective-or-lesson-id");
  if (!input.objective.trim() || !input.observableSuccessCriterion.trim()) {
    errors.push("missing-measurable-objective");
  }
  if (!input.editoriallyApproved) errors.push("objective-not-reviewed");

  for (const id of REQUIRED_STRATEGIES) {
    const matches = input.strategies.filter((s) => s.id === id);
    if (matches.length !== 1) errors.push("strategy-" + id + "-not-exactly-once");
  }
  for (const tier of REQUIRED_TIERS) {
    const matches = input.assessments.filter((a) => a.tier === tier);
    if (matches.length !== 1) errors.push("assessment-" + tier + "-not-exactly-once");
  }
  for (const strategy of input.strategies) {
    if (strategy.learningObjectiveId !== input.id ||
        !REQUIRED_STRATEGIES.includes(strategy.id) ||
        !strategy.label.trim() || !strategy.explanation.trim() ||
        strategy.teachingActivities.length === 0 ||
        strategy.teachingActivities.some((step) => !step.trim())) {
      errors.push("invalid-strategy-" + strategy.id);
    }
  }
  for (const item of input.assessments) {
    if (item.learningObjectiveId !== input.id ||
        !REQUIRED_TIERS.includes(item.tier) ||
        !ALLOWED_MODES.includes(item.responseMode) ||
        !item.prompt.trim() || item.rubric.length === 0 ||
        item.rubric.some((criterion) => !criterion.trim())) {
      errors.push("invalid-assessment-" + item.tier);
    }
    if (item.tier === "challenge" &&
        (item.responseMode !== "constructed_response" || !item.requiresHumanReview)) {
      errors.push("challenge-requires-constructed-response-human-review");
    }
    // Hints are formative only: never part of independent mastery evidence.
    if (item.tier !== "support" && item.formativeHint) {
      errors.push("hints-only-in-support-assessment");
    }
  }
  for (const mapping of input.curriculumAlignments) {
    if (!mapping.code.trim() || !mapping.sourceVersion.trim() ||
        (mapping.system === "national" && !/^[A-Z]{2}$/.test(mapping.countryCode ?? "")) ||
        (mapping.verified && !mapping.sourceUrl)) {
      errors.push("alignment-needs-source-" + mapping.system);
    }
  }
  return [...new Set(errors)];
}
