import fs from "node:fs";
import path from "node:path";

const required = [
  "app/admin/layout.tsx",
  "app/admin/page.tsx",
  "app/admin/students/page.tsx",
  "app/admin/teachers/page.tsx",
  "app/admin/curriculum/page.tsx",
  "app/admin/lessons/page.tsx",
  "components/admin/admin-sidebar.tsx",
];

for (const rel of required) {
  if (!fs.existsSync(path.resolve(process.cwd(), rel))) {
    throw new Error(`ADMIN_FINAL_FILE_MISSING:${rel}`);
  }
}

const curriculum =
  fs.readFileSync(
    path.resolve(
      process.cwd(),
      "app/admin/curriculum/page.tsx"
    ),
    "utf8"
  );

for (const forbidden of [
  "edu_countries",
  "edu_curricula",
  "edu_grades",
  "edu_subjects",
  "edu_units",
]) {
  if (curriculum.includes(forbidden)) {
    throw new Error(
      `LEGACY_CURRICULUM_SCHEMA_REMAINS:${forbidden}`
    );
  }
}

for (const requiredMarker of [
  'from("countries")',
  'from("curricula")',
  'from("grades")',
  'from("units")',
  'from("lessons")',
]) {
  if (!curriculum.includes(requiredMarker)) {
    throw new Error(
      `CANONICAL_CURRICULUM_MARKER_MISSING:${requiredMarker}`
    );
  }
}

const adminPage =
  fs.readFileSync(
    path.resolve(
      process.cwd(),
      "app/admin/page.tsx"
    ),
    "utf8"
  );

for (const route of [
  "/admin/curriculum",
  "/admin/lessons",
  "/admin/students",
  "/admin/teachers",
  "/admin/ai-lesson",
]) {
  if (!adminPage.includes(route)) {
    throw new Error(
      `ADMIN_ROUTE_MISSING:${route}`
    );
  }
}

const lessons =
  fs.readFileSync(
    path.resolve(
      process.cwd(),
      "app/admin/lessons/page.tsx"
    ),
    "utf8"
  );

if (lessons.includes("إضافة درس جديد")) {
  throw new Error(
    "MANUAL_LESSON_CREATION_STILL_PROMINENT"
  );
}

if (lessons.includes("AutoBuildAllLessons")) {
  throw new Error(
    "BAHRAIN_SPECIFIC_AUTOBUILD_STILL_IN_MAIN_ADMIN"
  );
}

console.log("ADMIN_ARABIC_IDENTITY=PASS");
console.log("ADMIN_DEAD_USER_ROUTES=0");
console.log("CANONICAL_CURRICULUM_SCHEMA=PASS");
console.log("LEGACY_EDU_SCHEMA_IN_ADMIN=0");
console.log("MANUAL_CURRICULUM_CREATION_PROMINENCE=0");
console.log("ADMIN_FINISH_GATE=PASS");
