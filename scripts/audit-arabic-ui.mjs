/**
 * Arabic UI lint: flags HIGH-CONFIDENCE fixed-number/count noun errors in TSX.
 * This is not a replacement for human Arabic proofreading or contextual cases.
 * Run: node scripts/audit-arabic-ui.mjs [--strict]
 */
import fg from "fast-glob";
import { readFileSync } from "node:fs";

const patterns = [
  { name: "3–10 require plural genitive (راجع السياق)",
    re: /(?<![\p{L}\p{N}])(?:[3-9]|10)\s+(?:مهارة|درس|صف|طالب|معلم|مدرسة)(?![\p{L}])/gu },
  { name: "11–99 require singular accusative (راجع السياق)",
    re: /(?<![\p{L}\p{N}])(?:1[1-9]|[2-9]\d)\s+(?:صفوف|دروس|مهارات|طلاب|معلمون|مدارس)(?![\p{L}])/gu },
];

const files = await fg(["app/**/*.tsx", "components/**/*.tsx", "features/**/*.tsx"], {
  ignore: ["**/node_modules/**", "**/*.test.tsx", "**/*.spec.tsx"],
});
let found = 0;
for (const file of files.sort()) {
  const lines = readFileSync(file, "utf8").split("\n");
  for (const [index, line] of lines.entries()) {
    for (const pattern of patterns) {
      for (const match of line.matchAll(pattern.re)) {
        console.log(`${file}:${index + 1}: ${pattern.name}: ${JSON.stringify(match[0])}`);
        found += 1;
      }
    }
  }
}
console.log(`Arabic UI review candidates: ${found}; human grammar review still required.`);
if (found && process.argv.includes("--strict")) process.exitCode = 1;
