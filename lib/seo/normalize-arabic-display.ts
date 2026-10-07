export function normalizeArabicDisplayText(
  value: string | null | undefined,
): string {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\)+\s*/u, "")
    .replace(/\(\s+/gu, "(")
    .replace(/\s+\)/gu, ")")
    .replace(/\s+([،؛:,.!?])/gu, "$1")
    .replace(/\/\s*:/gu, ":")
    .replace(/اإل/gu, "الإ")
    .replace(/األ/gu, "الأ")
    .replace(/الإ\s+نتاج/gu, "الإنتاج")
    .replace(/ال\s+ّكتابي/gu, "الكتابي")
    .replace(/\s+-\s*$/u, "")
    .trim();
}
