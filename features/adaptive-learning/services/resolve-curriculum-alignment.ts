import type {
  CurriculumAlignment,
  CurriculumSystem,
  UnifiedLearningObjective,
} from "./unified-objective-contract";

export type CurriculumSelection = {
  system: CurriculumSystem;
  sourceVersion: string;
  code: string;
  countryCode?: string;
};

export type CurriculumResolution =
  | { available: true; learningObjectiveId: string; lessonId: string; alignment: CurriculumAlignment }
  | { available: false; reason: "not_reviewed" | "no_exact_verified_alignment" };

/**
 * Exact syllabus provenance only; no automatic national/IB/Cambridge
 * equivalence from title similarity or embeddings.
 * Alignment is editorial data, never permissions or grade authority.
 */
export function resolveCurriculumAlignment(
  objective: UnifiedLearningObjective,
  wanted: CurriculumSelection,
): CurriculumResolution {
  if (!objective.editoriallyApproved) {
    return { available: false, reason: "not_reviewed" };
  }
  const verified = objective.curriculumAlignments.find((row) =>
    row.verified === true &&
    typeof row.sourceUrl === "string" && row.sourceUrl.length > 0 &&
    row.system === wanted.system &&
    row.sourceVersion === wanted.sourceVersion &&
    row.code === wanted.code &&
    (wanted.system !== "national" || (
      wanted.countryCode !== undefined &&
      wanted.countryCode.toUpperCase() === row.countryCode
    ))
  );
  if (!verified) return { available: false, reason: "no_exact_verified_alignment" };
  return {
    available: true,
    learningObjectiveId: objective.id,
    lessonId: objective.lessonId,
    alignment: verified,
  };
}
