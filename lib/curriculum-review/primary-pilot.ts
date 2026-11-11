/** Client-safe presentation types. No authority to grant an official match. */
export type PilotLane = "green" | "yellow" | "red";
export type PilotAction = "approve_official" | "mark_enrichment" | "keep_draft";
export type PilotProofKey = "official_source" | "complete_explanation" | "tested_interactions" | "independent_review";
export type PilotAuditRow = {
  id: string;
  title: string;
  country: string;
  grade: number;
  status: string;
  content_kind: string;
  evidence: Record<PilotProofKey, boolean>;
  OFFICIAL_SYLLABUS_MATCH: string;
  eligible_for_independent_human_decision: boolean;
  issues: string[];
  editorial_flags: string[];
};
export type PilotRow = PilotAuditRow & { lane: PilotLane };
export const PROOF_NAMES: Record<PilotProofKey, string> = {
  official_source: "المصدر الوزاري",
  complete_explanation: "الشرح",
  tested_interactions: "الأنشطة المجربة",
  independent_review: "التدقيق البشري",
};

/** The green queue is not an approval; it is a candidate for a DB-guarded decision. */
export function pilotLane(row: PilotAuditRow, snapshotComplete: boolean): PilotLane {
  if (row.editorial_flags.includes("EDITORIAL_OFFICIAL_CLAIM_CONFLICT")
    || row.issues.includes("EDITORIAL_OFFICIAL_CLAIM_CONFLICT")) return "yellow";
  if (snapshotComplete
    && row.country === "BH"
    && [1, 2, 3].includes(row.grade)
    && row.status === "published"
    && row.content_kind === "official_candidate"
    && row.OFFICIAL_SYLLABUS_MATCH === "NOT_VERIFIED"
    && row.eligible_for_independent_human_decision
    && Object.values(row.evidence).every(Boolean)
    && row.issues.length === 0) return "green";
  return "red";
}
export function isPilotAuditRow(value: unknown): value is PilotAuditRow {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<PilotAuditRow>;
  return typeof r.id === "string"
    && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(r.id)
    && typeof r.title === "string"
    && typeof r.country === "string" && typeof r.grade === "number"
    && typeof r.status === "string" && typeof r.content_kind === "string"
    && typeof r.eligible_for_independent_human_decision === "boolean"
    && Array.isArray(r.issues) && r.issues.every(i => typeof i === "string")
    && Array.isArray(r.editorial_flags) && r.editorial_flags.every(i => typeof i === "string")
    && !!r.evidence && (["official_source", "complete_explanation", "tested_interactions", "independent_review"] as const)
      .every(k => typeof r.evidence?.[k] === "boolean");
}
