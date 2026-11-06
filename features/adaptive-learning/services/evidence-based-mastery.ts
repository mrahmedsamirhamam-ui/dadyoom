/**
 * A conservative, deterministic policy for a proposed mastery-evidence pilot.
 *
 * This is a pure decision function, NOT a grade writer or credentialing engine.
 * Call from a server endpoint ONLY with authenticated, RLS-authorized attempts
 * joined to server-graded results and editorially reviewed question metadata.
 * Never pass isCorrect, reviewedItem, userId or hintCount through from browser.
 *
 * All thresholds are PILOT assumptions pending educational validation.
 */
export type EvidenceKind = "guided" | "independent" | "transfer" | "retention";

export type MasteryEvidence = {
  objectiveId: string;
  itemId: string;
  sessionId: string;
  occurredAt: string; // timestamp from trusted server persistence
  kind: EvidenceKind;
  isCorrect: boolean; // computed by authoritative server grading
  gradedBy: "server" | "unverified";
  reviewedItem: boolean; // editorially signed off, server-derived metadata
  hintCount: number; // server-recorded help; >=1 excludes independent credit
};

export type EvidenceStatus =
  | "insufficient_evidence"
  | "needs_support"
  | "demonstrated_not_retained"
  | "retention_review_due"
  | "retained_on_check"
  | "needs_retention_repair";

export type RecommendedAction =
  | "collect_independent_evidence"
  | "guided_practice"
  | "schedule_independent_check"
  | "offer_transfer_check"
  | "wait_for_retention"
  | "run_retention_check"
  | "repair_then_recheck"
  | "offer_next_objective";

export type EvidenceDecision = {
  policyVersion: "evidence-alpha-v1";
  status: EvidenceStatus;
  action: RecommendedAction;
  canClaimValidatedMastery: false; // never claim psychometric validation
  pilotEvidenceMet: boolean;
  initialIndependentCount: number;
  initialCorrectCount: number;
  independentAccuracy: number | null;
  distinctInitialSessions: number;
  correctTransferCount: number;
  eligibleRetentionChecks: number;
  ignoredEvents: number;
  nextReviewAt: string | null;
  reason: string;
};

const DAY = 24 * 60 * 60 * 1000;
const MIN_DISTINCT_ITEMS = 5;
const MIN_INITIAL_ACCURACY = 0.8;
const MIN_SESSION_GAP_MS = DAY;
const RETENTION_GAP_MS = 7 * DAY;

type TrustedEvent = MasteryEvidence & { time: number };

const BASE = {
  policyVersion: "evidence-alpha-v1",
  canClaimValidatedMastery: false,
} as const;

function parseTime(time: string): number | null {
  const milliseconds = Date.parse(time);
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

/**
 * No student's identity is needed to decide the next instructional step.
 * Enforce permissions and origin of all fields BEFORE calling this function.
 * Repeating the same item in another session never counts as new evidence.
 */
export function assessObjectiveEvidence(
  objectiveId: string,
  events: readonly MasteryEvidence[],
  asOfIso: string,
): EvidenceDecision {
  const now = parseTime(asOfIso);
  if (!objectiveId.trim() || now === null) {
    throw new TypeError("Objective and trusted observation time are required");
  }

  const seen = new Set<string>();
  const eligible: TrustedEvent[] = [];
  const chronological = events
    .map((event) => ({ ...event, time: parseTime(event.occurredAt) }))
    .filter((event): event is MasteryEvidence & { time: number } => event.time !== null)
    .sort((a, b) => a.time - b.time);

  for (const event of chronological) {
    if (event.objectiveId !== objectiveId ||
        !event.itemId.trim() ||
        !event.sessionId.trim() ||
        event.time > now ||
        event.gradedBy !== "server" ||
        event.reviewedItem !== true ||
        typeof event.isCorrect !== "boolean" ||
        event.kind === "guided" ||
        !Number.isInteger(event.hintCount) ||
        event.hintCount !== 0 ||
        seen.has(event.itemId)) {
      continue;
    }
    seen.add(event.itemId);
    eligible.push(event);
  }

  const initial = eligible.filter((event) =>
    event.kind === "independent" || event.kind === "transfer"
  );
  const retentions = eligible.filter((event) => event.kind === "retention");
  const initialCorrect = initial.filter((event) => event.isCorrect).length;
  const accuracy = initial.length ? initialCorrect / initial.length : null;
  const transferCorrect = initial.filter((event) =>
    event.kind === "transfer" && event.isCorrect
  ).length;
  const initialTimes = initial.map((event) => event.time);
  const sessionFirst = new Map<string, number>();
  for (const event of initial) {
    sessionFirst.set(event.sessionId, Math.min(
      sessionFirst.get(event.sessionId) ?? event.time,
      event.time,
    ));
  }
  const sessions = [...sessionFirst.values()].sort((a, b) => a - b);
  const hasSpacedSessions = sessions.length >= 2 &&
    sessions[sessions.length - 1] - sessions[0] >= MIN_SESSION_GAP_MS;

  const common = {
    ...BASE,
    initialIndependentCount: initial.length,
    initialCorrectCount: initialCorrect,
    independentAccuracy: accuracy === null ? null : Math.round(accuracy * 100),
    distinctInitialSessions: sessionFirst.size,
    correctTransferCount: transferCorrect,
    ignoredEvents: events.length - eligible.length,
  };

  const result = (
    status: EvidenceStatus,
    action: RecommendedAction,
    reason: string,
    pilotEvidenceMet: boolean,
    nextReviewAt: string | null,
    eligibleRetentionChecks: number,
  ): EvidenceDecision => ({
    ...common,
    status,
    action,
    reason,
    pilotEvidenceMet,
    nextReviewAt,
    eligibleRetentionChecks,
  });

  if (initial.length < MIN_DISTINCT_ITEMS) {
    return result("insufficient_evidence", "collect_independent_evidence",
      "At least five distinct, reviewed, unassisted items are needed; repeats and guided attempts do not count.",
      false, null, 0);
  }
  if (accuracy === null || accuracy < MIN_INITIAL_ACCURACY) {
    return result("needs_support", "guided_practice",
      "Independent evidence suggests revisiting the explanation; this is not a learner label.",
      false, null, 0);
  }
  if (transferCorrect === 0) {
    return result("insufficient_evidence", "offer_transfer_check",
      "A different transfer task must show the same objective in a new context.",
      false, null, 0);
  }
  if (!hasSpacedSessions) {
    const due = new Date(sessions[0] + MIN_SESSION_GAP_MS).toISOString();
    return result("insufficient_evidence", "schedule_independent_check",
      "Correct work in one sitting does not establish persistent understanding.",
      false, due, 0);
  }

  const lastInitial = Math.max(...initialTimes);
  const retentionDue = lastInitial + RETENTION_GAP_MS;
  const eligibleRetentions = retentions.filter((event) => event.time >= retentionDue);
  const firstRetention = eligibleRetentions[0];

  if (firstRetention && !firstRetention.isCorrect) {
    return result("needs_retention_repair", "repair_then_recheck",
      "A spaced check identified an item to revisit; recheck with new questions.",
      false, null, eligibleRetentions.length);
  }
  if (firstRetention && firstRetention.isCorrect) {
    return result("retained_on_check", "offer_next_objective",
      "A new reviewed item was answered correctly at least seven days after the initial checks.",
      true, null, eligibleRetentions.length);
  }
  if (now >= retentionDue) {
    return result("retention_review_due", "run_retention_check",
      "A fresh, unassisted, reviewed retention check is now due.",
      false, new Date(retentionDue).toISOString(), 0);
  }
  return result("demonstrated_not_retained", "wait_for_retention",
    "Multiple independent spaced checks passed, but retention is not yet established.",
    false, new Date(retentionDue).toISOString(), 0);
}
