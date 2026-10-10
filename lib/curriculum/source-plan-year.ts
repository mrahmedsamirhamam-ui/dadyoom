/**
 * Year printed in the path of a verified Bahrain ministry distribution plan.
 * A URL establishes the edition of the source document; it does NOT certify
 * lesson contents, textbook completeness, or current official scheduling.
 */
export function extractBahrainPlanYear(
  countryCode: string,
  sourcePdfUrl: string | null | undefined,
): string | null {
  if (countryCode.trim().toUpperCase() !== "BH" || !sourcePdfUrl) return null;
  const year = sourcePdfUrl.match(/\/plans[12]-(20\d{2}-20\d{2})\/Arabic\//iu);
  return year?.[1] ?? null;
}
