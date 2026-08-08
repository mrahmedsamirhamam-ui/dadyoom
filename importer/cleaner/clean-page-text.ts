const NOISE_PATTERNS = [
  /^\s*\d+\s*$/gm,
  /PM\s+\d{1,2}:\d{2}.*$/gm,
  /\d+\s+indd\d*\.Read04ARA.*$/gm,
  /Read04ARA.*$/gm,
];

export function cleanPageText(input: string): string {
  let text = input;

  for (const pattern of NOISE_PATTERNS) {
    text = text.replace(pattern, "");
  }

  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}