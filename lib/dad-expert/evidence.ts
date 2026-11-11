/**
 * Pure, offline evidence gate for future Dad Expert responses.
 * This module DOES NOT fetch documents, call AI providers, or certify factual accuracy.
 */
export type SourceEvidence = {
  id: string;
  title: string;
  excerpt: string;
  sourceType: "official_verified" | "dadyoom_enrichment";
  permitted: boolean;
};
export type DraftAnswer = {
  text: string;
  sourceIds: readonly string[];
};
export type EvidenceGateResult =
  | { ok: true; sources: SourceEvidence[] }
  | { ok: false; reason: "empty_answer" | "missing_citation" | "unknown_source" | "unpermitted_source" | "empty_excerpt" };

export function validateEvidence(answer: DraftAnswer, sources: readonly SourceEvidence[]): EvidenceGateResult {
  if (!answer.text.trim()) return { ok: false, reason: "empty_answer" };
  if (answer.sourceIds.length === 0) return { ok: false, reason: "missing_citation" };
  const available = new Map(sources.map((source) => [source.id, source]));
  const matched: SourceEvidence[] = [];
  for (const id of new Set(answer.sourceIds)) {
    const source = available.get(id);
    if (!source) return { ok: false, reason: "unknown_source" };
    if (!source.permitted) return { ok: false, reason: "unpermitted_source" };
    if (!source.excerpt.trim()) return { ok: false, reason: "empty_excerpt" };
    matched.push(source);
  }
  return { ok: true, sources: matched };
}

export function labelSourceType(type: SourceEvidence["sourceType"]): string {
  return type === "official_verified" ? "مصدر رسمي موثق" : "إثراء أصلي من ضاديوم";
}
