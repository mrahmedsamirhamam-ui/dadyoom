/**
 * Only known source-book title cards, never inferred from generic lesson names.
 * These are catalog references, NOT individual textbook lesson TOC entries.
 * Keep stable DB IDs/rows intact for provenance and future source validation.
 */
export function isBookReference(input: {
  countryCode: string;
  unitTitle: string;
  lessonTitle: string;
}): boolean {
  const { countryCode, unitTitle, lessonTitle } = input;
  switch (countryCode.toUpperCase()) {
    case "YE":
      return unitTitle === "اللغة العربية — حزمة الكتب الرسمية" &&
        /^(الأدب والنصوص والبلاغة|القراءة|النحو والصرف)(?: — الجزء (?:الأول|الثاني))?$/u.test(lessonTitle);
    case "TN":
      return unitTitle === "اللغة العربية — حزمة الكتاب الرسمي" &&
        /^(?:كتاب النصوص — رياضة|عيون الأدب — الجزء الثاني|نصوص — آداب(?: — الجزء (?:الأول|الثاني))?|كتاب العربية — رياضة)$/u.test(lessonTitle);
    case "OM":
      return unitTitle === "كتب اللغة العربية الرسمية المعتمدة — 2026/2027" &&
        /^(?:لغتي الجميلة — الفصل الدراسي (?:الأول|الثاني)|المؤنس — الفصل الدراسي (?:الأول|الثاني)|المفيد)$/u.test(lessonTitle);
    case "LY":
      return /^كتاب (?:الأدب والنصوص|المطالعة والإنشاء|النقد الأدبي) — ثالث ثانوي أدبي$/u.test(unitTitle) &&
        /^(?:الأدب والنصوص|المطالعة والإنشاء|النقد الأدبي) — تغطية كتابية تكاملية$/u.test(lessonTitle);
    default:
      return false;
  }
}


// Exact IDs are an additional safety barrier for legacy /lessons/... links.
// Do not infer an ID solely from a generic grammar or reading title.
export const BOOK_REFERENCE_IDS: Readonly<Record<string, readonly string[]>> =
  {
  "LY": [
    "409a3723-ac04-4b9f-828f-d78a6fa16f5d",
    "fa77fc34-0c9e-439c-819a-d21dd9193218",
    "5fc3a3eb-1ac8-4c26-ad74-04a1116bc221"
  ],
  "OM": [
    "54de9949-783f-4597-9849-931c439eede8",
    "159c3d30-51c5-4036-b7d5-0c2be14b0ffa",
    "a478bfc8-f2be-4789-9207-d26cd07da0ea",
    "c9e04d71-05c6-4a4b-9ce1-4ae8dcab80e0",
    "9ef20c8a-16b1-494a-bf20-863e10a2890a"
  ],
  "TN": [
    "f7314947-c47e-4506-92bc-e53b398f2e71",
    "22b6db36-cc06-481c-a096-f4326ea33d24",
    "a2529f0a-364c-4557-93a5-a0f7f8ff8684",
    "f527eb04-cb5d-4712-98db-a3eeb39c1ce5",
    "c3d2fe7b-5b23-4870-b80f-defe0e4bb92b",
    "de3d48b7-bff5-44e3-9d0f-8cd6818a2194",
    "d6938c46-ab5b-44b9-9018-ff2003ee9545",
    "cd78ed80-a6b2-4e9d-a4c4-2e5b86f03fe0"
  ],
  "YE": [
    "a20af910-9105-43f6-9a0e-fbba7cd83cf0",
    "da3d9cad-c051-48c1-bb8a-c6949ffbdd1e",
    "4a9d8b2e-36ce-4e5a-b46d-860a121cebaf",
    "6fcc7fac-64c9-486c-9bb9-f874e5e4c03b",
    "4446ece4-b120-4433-88e1-94eeeb929b08",
    "14cc723b-78be-4b17-8490-437700601df2",
    "cb988aba-45fc-45c9-8903-3af59122b330",
    "5d356fbc-5910-4890-a408-4ab7d67d7ee5",
    "dccac621-d773-4bee-8c6e-a60c966d5d0c",
    "7d736715-539a-4d5b-8445-56ad13820f2b",
    "28c7fa13-2ecb-4fe5-862a-8237cf1db1ce",
    "c7602ca8-c2f4-4862-b30c-dcf165aefbf1",
    "669a7009-920e-40c0-bd4e-d590ec4a396d",
    "a9a3a610-39a8-41f9-8c4b-7b65784ee9c3"
  ]
} as const;

const knownBookReferenceIds = new Set(Object.values(BOOK_REFERENCE_IDS).flat());
export function isKnownBookReferenceId(id: string): boolean {
  return knownBookReferenceIds.has(id);
}
