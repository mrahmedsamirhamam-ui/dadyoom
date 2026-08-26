export const COUNTRY_CODES = [
  "BH",
  "SA",
  "AE",
  "QA",
  "KW",
  "OM",
  "EG",
  "JO",
  "LB",
  "SY",
  "IQ",
  "PS",
  "YE",
  "MA",
  "DZ",
  "TN",
  "LY",
  "SD",
  "SO",
  "DJ",
  "KM",
  "MR",
  "US",
  "GB",
  "CA",
  "DE",
  "FR",
  "TR",
  "MY",
  "BN",
  "SG"
] as const;

export const ARAB_COUNTRY_CODES = [
  "BH",
  "SA",
  "AE",
  "QA",
  "KW",
  "OM",
  "EG",
  "JO",
  "LB",
  "SY",
  "IQ",
  "PS",
  "YE",
  "MA",
  "DZ",
  "TN",
  "LY",
  "SD",
  "SO",
  "DJ",
  "KM",
  "MR"
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

export type CountryOption = { code: string; name: string; arabPriority: boolean };

export function getArabicCountryOptions(): CountryOption[] {
  const names = new Intl.DisplayNames(["ar"], { type: "region" });
  const arabSet = new Set<string>(ARAB_COUNTRY_CODES);

  return COUNTRY_CODES.map((code) => ({
    code,
    name: names.of(code) || code,
    arabPriority: arabSet.has(code),
  })).sort((a, b) => {
    if (a.arabPriority !== b.arabPriority) return a.arabPriority ? -1 : 1;
    return a.name.localeCompare(b.name, "ar");
  });
}

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && (COUNTRY_CODES as readonly string[]).includes(value.toUpperCase());
}
