/**
 * High-confidence static scan of dynamic number+count labels in Arabic UI.
 * It emits findings for review, without claiming an NLP proof of correctness.
 *
 * Use --strict to fail if dashboard-critical role pages regress.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, join } from "node:path";

const ROOTS = ["app", "components", "features"];
const OMIT = new Set(["node_modules", ".git", ".next", ".vercel", ".open-next", "dist", "build"]);
const EXT = /\.(?:tsx|jsx|ts|js)$/u;
const SUSPECT = /(?:\{[^{}\n]{1,120}\}|\$\{[^{}\n]{1,120}\})\s*(?:صفوف|صفّ|صف|فصل|فصول|طالب|طلاب|معلم|معلمين|مهارة|مهارات|درس|دروس|نشاط|أنشطة|سؤال|أسئلة)(?=[\s<،.؛!؟"]|$)/gu;
const BAD_NUMERIC = /\b(?:12\s+صفوف|10\s+مهارة|3\s+درس|11\s+دروس|12\s+طلاب|2\s+فصول)\b/gu;
const STRICT = /^(?:app\/\(dashboard\)\/(?:student|teacher|parent|school)\/page\.tsx|components\/roles\/RolePortalLayout\.tsx)$/u;

function* files(dir) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (OMIT.has(name.name)) continue;
    const full = join(dir, name.name);
    if (name.isDirectory()) yield* files(full);
    else if (name.isFile() && EXT.test(name.name)) yield full;
  }
}

const found = [];
for (const root of ROOTS) {
  try {
    if (!statSync(root).isDirectory()) continue;
  } catch { continue; }
  for (const file of files(root)) {
    const relativePath = relative(process.cwd(), file).replaceAll("\\", "/");
    const lines = readFileSync(file, "utf8").split(/\r?\n/u);
    for (let i = 0; i < lines.length; i += 1) {
      for (const pattern of [SUSPECT, BAD_NUMERIC]) {
        pattern.lastIndex = 0;
        for (const match of lines[i].matchAll(pattern)) {
          found.push({ path: relativePath, line: i + 1, label: match[0].trim().slice(0, 140) });
        }
      }
    }
  }
}
for (const item of found.slice(0, 100)) {
  console.log(item.path + ":" + item.line + " suspect Arabic count: " + item.label);
}
console.log("ARABIC_UI_COUNT_REVIEW_NEEDED=" + found.length);
const critical = found.filter(item => STRICT.test(item.path));
if (process.argv.includes("--strict") && critical.length) {
  console.error("ARABIC_UI_ROLE_PAGE_REGRESSION=" + critical.length);
  process.exitCode = 1;
}
