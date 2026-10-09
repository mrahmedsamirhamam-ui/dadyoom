/** Country-specific school-grade limits, shared by onboarding, API and dashboards. */
export function maxGradeForCountry(country: string | null | undefined): number {
  const code = String(country ?? "").trim().toUpperCase();
  return code === "TN" || code === "MR" ? 13 : 12;
}
export function isValidGradeForCountry(
  grade: number,
  country: string | null | undefined,
): boolean {
  return Number.isInteger(grade) && grade >= 1 && grade <= maxGradeForCountry(country);
}
export function thirteenthGradeArabicLabel(country: string | null | undefined): string {
  return String(country ?? "").trim().toUpperCase() === "TN"
    ? "السنة الرابعة ثانوي (تونس)"
    : "السنة السابعة الثانوية (موريتانيا)";
}
