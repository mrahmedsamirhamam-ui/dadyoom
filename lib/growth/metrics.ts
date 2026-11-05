/** Growth metric definitions. Missing measurement is null, never zero. */
export function safeRate(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator <= 0) return null;
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  return Math.round((1000 * numerator) / denominator) / 10;
}

/**
 * Weekly North Star: unique consented students with >=3 distinct qualifying
 * learning sessions (a session requires a real learning interaction).
 * Until session events exist, the only truthful value is null.
 */
export type GrowthMetrics = {
  northStarWeekly: number | null;
  retentionD1: number | null;
  retentionD7: number | null;
  retentionD30: number | null;
  exitedPages: null | Array<{ path: string; exits: number }>;
};

export const unavailableGrowthMetrics: GrowthMetrics = {
  northStarWeekly: null,
  retentionD1: null,
  retentionD7: null,
  retentionD30: null,
  exitedPages: null,
};
