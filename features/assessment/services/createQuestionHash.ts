import {
  createHash,
} from "node:crypto";

function removeArabicDiacritics(
  value: string
): string {
  return value.replace(
    /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/gu,
    ""
  );
}

export function normalizeQuestion(
  question: string
): string {
  return removeArabicDiacritics(
    question
  )
    .normalize("NFKC")
    .replace(/[أإآٱ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/ؤ/gu, "و")
    .replace(/ئ/gu, "ي")
    .replace(/ة/gu, "ه")
    .replace(/[ـ]/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .toLowerCase();
}

export function createQuestionHash(
  question: string
): string {
  const normalized =
    normalizeQuestion(question);

  return createHash("sha256")
    .update(normalized, "utf8")
    .digest("hex");
}