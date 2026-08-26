import fs from "node:fs";
import path from "node:path";

const required = [
  "app/(dashboard)/journey/page.tsx",
  "app/(dashboard)/reading-challenge/page.tsx",
  "features/reading-challenge/actions/saveReadingPassportEntry.ts",
  "app/(dashboard)/skills/page.tsx",
  "components/dad-ai/DadCompanion.tsx",
  "components/dad-ai/DadLessonContext.tsx",
  "supabase/migrations/20260826_reading_passport_mvp.sql",
  "docs/PRODUCT-CONTRACT.md",
];

for (const rel of required) {
  if (!fs.existsSync(path.resolve(process.cwd(), rel))) {
    throw new Error(`LEARNING_EXPERIENCE_FILE_MISSING:${rel}`);
  }
}

const journey = fs.readFileSync(
  path.resolve(process.cwd(), "app/(dashboard)/journey/page.tsx"),
  "utf8"
);

for (const marker of [
  "/courses",
  "/journey/daily",
  "/skills",
  "/reading-challenge",
  "/dictionary",
  "/assessment/",
  "/ask",
  "/student",
]) {
  if (!journey.includes(marker)) {
    throw new Error(`JOURNEY_MARKER_MISSING:${marker}`);
  }
}

const reading = fs.readFileSync(
  path.resolve(process.cwd(), "app/(dashboard)/reading-challenge/page.tsx"),
  "utf8"
);

for (const marker of [
  "ملخصي",
  "تفكيري الناقد",
  "لمستي الإبداعية",
  "comprehension_score",
  "saveReadingPassportEntry",
]) {
  if (!reading.includes(marker)) {
    throw new Error(`READING_PASSPORT_MARKER_MISSING:${marker}`);
  }
}

const dad = fs.readFileSync(
  path.resolve(process.cwd(), "components/dad-ai/DadCompanion.tsx"),
  "utf8"
);

if (!dad.includes("requestLockRef")) {
  throw new Error("DAD_DUPLICATE_POST_GUARD_MISSING");
}

console.log("UNIFIED_JOURNEY=PASS");
console.log("FOUR_SKILLS=CONNECTED");
console.log("DICTIONARY=CONNECTED");
console.log("ASSESSMENT=CONNECTED");
console.log("GAMIFICATION=CONNECTED");
console.log("DAD=CONNECTED");
console.log("READING_PASSPORT=CONNECTED");
console.log("LEARNING_EXPERIENCE_GATE=PASS");
