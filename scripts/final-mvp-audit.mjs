import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();

const requiredFiles = [
  "app/page.tsx",
  "app/login/page.tsx",
  "app/signup/page.tsx",
  "app/auth/callback/route.ts",
  "app/onboarding/page.tsx",
  "app/courses/CurriculumCatalogClient.tsx",
  "app/(dashboard)/student/layout.tsx",
  "app/(dashboard)/teacher/layout.tsx",
  "app/(dashboard)/parent/layout.tsx",
  "app/(dashboard)/school/layout.tsx",
  "app/(dashboard)/reading-challenge/page.tsx",
  "app/admin/page.tsx",
  "app/admin/curriculum/page.tsx",
  "app/admin/curriculum/packs/page.tsx",
  "app/admin/students/page.tsx",
  "app/admin/teachers/page.tsx",
  "app/api/dad/chat/route.ts",
  "app/api/auth/provider-status/route.ts",
  "components/brand/DadyoomLogo.tsx",
  "components/dad-ai/DadRobot.tsx",
  "components/dad-ai/DadCompanion.tsx",
  "components/dad-ai/DadLessonContext.tsx",
  "components/auth/GoogleAuthButton.tsx",
  "components/roles/RolePortalLayout.tsx",
  "lib/countries.ts",
  "lib/curriculum-packs/schema.ts",
  "lib/curriculum-packs/validate.mjs",
  "lib/curriculum-packs/control-center.ts",
  "scripts/import-curriculum-pack.mjs",
  "scripts/verify-curriculum-packs.mjs",
  "scripts/curriculum-coverage.mjs",
  "data/curriculum-packs/arab-countries.json",
  "data/curriculum-packs/official-sources-2026.json",
  "data/core-curriculum/dadyoom-core-templates-2026-2027.json",
  "scripts/seed-dadyoom-core-22.mjs",
  "data/curriculum-packs/bh-2026-arabic-primary-g1-s1.json",
  "docs/PRODUCT-CONTRACT.md",
  "docs/CURRICULUM-OPERATIONS.md",
  "docs/RELEASE-GATE.md",
  "supabase/migrations/20260826_release_security_hardening_v1.sql",
  "supabase/migrations/20260925_fix_welcome_trial_to_one_day.sql",
  "supabase/migrations/20260925062000_secure_student_xp_and_plan_rpcs.sql",
  "supabase/migrations/20260925063500_harden_authorization_helper_rpcs.sql",
];

for (const rel of requiredFiles) {
  if (!fs.existsSync(path.resolve(root, rel))) {
    throw new Error(`FINAL_REQUIRED_FILE_MISSING:${rel}`);
  }
}

const registry = JSON.parse(
  fs.readFileSync(
    path.resolve(
      root,
      "data/curriculum-packs/arab-countries.json"
    ),
    "utf8"
  )
);

if (
  !Array.isArray(registry.countries) ||
  registry.countries.length !== 22
) {
  throw new Error("FINAL_ARAB_COUNTRY_REGISTRY_NOT_22");
}

const coreReadyCountries =
  registry.countries.filter(
    (country) =>
      country.coreStatus === "published" &&
      country.coreAcademicYear === "2026-2027" &&
      Number(country.coreGrades) >= 12 &&
      Number(country.coreLessons) >= 216
  );

if (coreReadyCountries.length !== 22) {
  throw new Error(
    `FINAL_DADYOOM_CORE_EXPECTED_22_GOT_${coreReadyCountries.length}`
  );
}

const officialSources = JSON.parse(
  fs.readFileSync(
    path.resolve(
      root,
      "data/curriculum-packs/official-sources-2026.json"
    ),
    "utf8"
  )
);

const officialSourceCountries =
  Array.isArray(officialSources.countries)
    ? officialSources.countries
    : [];

const officialCodes =
  new Set(
    officialSourceCountries.map(
      (country) => country.code
    )
  );

if (
  officialSourceCountries.length !== 22 ||
  officialCodes.size !== 22 ||
  registry.countries.some(
    (country) => !officialCodes.has(country.code)
  ) ||
  officialSourceCountries.some(
    (country) =>
      !Array.isArray(country.sources) ||
      country.sources.length === 0
  )
) {
  throw new Error(
    "FINAL_OFFICIAL_SOURCE_CATALOG_NOT_22"
  );
}

const coreTemplates = JSON.parse(
  fs.readFileSync(
    path.resolve(
      root,
      "data/core-curriculum/dadyoom-core-templates-2026-2027.json"
    ),
    "utf8"
  )
);

if (
  coreTemplates.schemaVersion !== 1 ||
  coreTemplates.academicYear !== "2026-2027" ||
  !Array.isArray(coreTemplates.templates) ||
  coreTemplates.templates.length !== 72
) {
  throw new Error(
    "FINAL_DADYOOM_CORE_TEMPLATE_BANK_INVALID"
  );
}

const bahrain = JSON.parse(
  fs.readFileSync(
    path.resolve(
      root,
      "data/curriculum-packs/bh-2026-arabic-primary-g1-s1.json"
    ),
    "utf8"
  )
);

const bahrainLessons =
  (bahrain.units || []).reduce(
    (sum, unit) =>
      sum +
      (unit.lessons || []).length,
    0
  );

if (bahrainLessons !== 18) {
  throw new Error(
    `FINAL_BAHRAIN_LESSON_COUNT_EXPECTED_18_GOT_${bahrainLessons}`
  );
}

const dad = fs.readFileSync(
  path.resolve(
    root,
    "components/dad-ai/DadCompanion.tsx"
  ),
  "utf8"
);

if (!dad.includes("requestLockRef")) {
  throw new Error(
    "FINAL_DAD_DUPLICATE_REQUEST_GUARD_MISSING"
  );
}

if (!dad.includes("DAD_LESSON_CONTEXT_EVENT")) {
  throw new Error(
    "FINAL_DAD_LESSON_CONTEXT_MISSING"
  );
}

const roleShell = fs.readFileSync(
  path.resolve(
    root,
    "components/roles/RolePortalLayout.tsx"
  ),
  "utf8"
);

for (const marker of [
  'actualRole !== role',
  'actualRole !== "admin"',
  'redirect("/login")',
]) {
  if (!roleShell.includes(marker)) {
    throw new Error(
      `FINAL_ROLE_GUARD_MARKER_MISSING:${marker}`
    );
  }
}

const legacyCompletionFiles = [
  "app/api/progress/route.ts",
  "app/api/progress/complete/route.ts",
  "app/lessons/[id]/CompleteLessonButton.tsx",
];

for (const rel of legacyCompletionFiles) {
  const source = fs.readFileSync(
    path.resolve(root, rel),
    "utf8",
  );

  if (
    source.includes('.from("student_progress")') ||
    source.includes('.from("lesson_progress")')
  ) {
    throw new Error(
      `FINAL_LEGACY_COMPLETION_BYPASS_REMAINS:${rel}`,
    );
  }

  if (
    !source.includes("/api/lessons/complete")
  ) {
    throw new Error(
      `FINAL_CANONICAL_COMPLETION_BRIDGE_MISSING:${rel}`,
    );
  }
}

const canonicalCompletion = fs.readFileSync(
  path.resolve(
    root,
    "features/student-progress/actions/completeLesson.ts",
  ),
  "utf8",
);

for (const marker of [
  "REQUIRED_MASTERY_SCORE = 90",
  "syncLessonMasteryAction",
  "updateStreak",
  "getUnifiedGamificationXP",
  "completeAdaptiveStep",
]) {
  if (!canonicalCompletion.includes(marker)) {
    throw new Error(
      `FINAL_CANONICAL_COMPLETION_MARKER_MISSING:${marker}`,
    );
  }
}

const checkoutUI = fs.readFileSync(
  path.resolve(
    root,
    "components/billing/CheckoutButtons.tsx",
  ),
  "utf8",
);

const tapCreate = fs.readFileSync(
  path.resolve(
    root,
    "app/api/payments/tap/create/route.ts",
  ),
  "utf8",
);

const paddleConfig = fs.readFileSync(
  path.resolve(
    root,
    "app/api/payments/paddle/config/route.ts",
  ),
  "utf8",
);

if (
  !checkoutUI.includes("الدفع غير مفعّل حاليًا") ||
  !tapCreate.includes("PAYMENTS_PAUSED") ||
  !paddleConfig.includes("PAYMENTS_PAUSED")
) {
  throw new Error(
    "FINAL_ZERO_COST_PAYMENT_PAUSE_MISSING",
  );
}

const tracked = execFileSync(
  "git",
  ["ls-files"],
  {
    cwd: root,
    encoding: "utf8",
  }
)
  .split(/\r?\n/)
  .filter(Boolean);

const forbiddenTracked = tracked.filter(
  (rel) =>
    rel === ".env.local" ||
    rel.startsWith(".vs/") ||
    rel.startsWith("supabase/.temp/")
);

if (forbiddenTracked.length) {
  throw new Error(
    `FINAL_LOCAL_ARTIFACT_TRACKED:${forbiddenTracked.join(",")}`
  );
}

const existingTrackedBackups = tracked.filter(
  (rel) =>
    fs.existsSync(path.resolve(root, rel)) &&
    /(^|\/)(_backups|\.dadyoom-backups)(\/|$)|\.bak$|\.backup$|\.tmp$|\.before[-.]|encoding-backup/i.test(rel)
);

if (existingTrackedBackups.length) {
  throw new Error(
    `FINAL_TRACKED_BACKUPS_REMAIN:${existingTrackedBackups.join(",")}`
  );
}

console.log("FINAL_REQUIRED_FILES=PASS");
console.log("FINAL_ARAB_COUNTRY_REGISTRY=22");
console.log("FINAL_DADYOOM_CORE_COUNTRIES=22");
console.log("FINAL_DADYOOM_CORE_TEMPLATES=72");
console.log("FINAL_OFFICIAL_SOURCE_CATALOG=22");
console.log("FINAL_BAHRAIN_PACK=18");
console.log("FINAL_DAD_GUARDS=PASS");
console.log("FINAL_ROLE_GUARDS=PASS");
console.log("FINAL_CANONICAL_COMPLETION_GATE=PASS");
console.log("FINAL_LEGACY_COMPLETION_BYPASSES=0");
console.log("FINAL_ZERO_COST_PAYMENTS=PAUSED");
console.log("FINAL_LOCAL_ARTIFACTS_TRACKED=0");
console.log("FINAL_TRACKED_BACKUPS_EXISTING=0");
console.log("FINAL_MVP_SOURCE_AUDIT=PASS");
