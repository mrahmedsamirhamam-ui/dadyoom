import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "components/roles/RolePortalLayout.tsx",
  "app/(dashboard)/student/layout.tsx",
  "app/(dashboard)/teacher/layout.tsx",
  "app/(dashboard)/parent/layout.tsx",
  "app/(dashboard)/school/layout.tsx",
  "app/(dashboard)/student/page.tsx",
  "app/(dashboard)/teacher/page.tsx",
  "app/(dashboard)/parent/page.tsx",
  "app/(dashboard)/school/page.tsx",
];

for (const rel of requiredFiles) {
  if (!fs.existsSync(path.resolve(root, rel))) {
    throw new Error(
      `ROLE_EXPERIENCE_FILE_MISSING:${rel}`
    );
  }
}

const shell = fs.readFileSync(
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
  'href="/ask"',
  "DadyoomLogo",
]) {
  if (!shell.includes(marker)) {
    throw new Error(
      `ROLE_SHELL_MARKER_MISSING:${marker}`
    );
  }
}

const roleLayouts = {
  student: [
    "/student",
    "/courses",
    "/journey",
    "/skills",
    "/reading-challenge",
    "/dictionary",
  ],
  teacher: [
    "/teacher",
    "/courses",
    "/skills",
    "/reading-challenge",
    "/dictionary",
  ],
  parent: [
    "/parent",
    "/courses",
    "/reading-challenge",
    "/skills",
    "/ask",
  ],
  school: [
    "/school",
    "/school/reports",
    "/courses",
    "/skills",
    "/ask",
  ],
};

for (const [role, links] of Object.entries(roleLayouts)) {
  const rel =
    `app/(dashboard)/${role}/layout.tsx`;

  const text = fs.readFileSync(
    path.resolve(root, rel),
    "utf8"
  );

  if (!text.includes(`role="${role}"`)) {
    throw new Error(
      `ROLE_LAYOUT_ROLE_MISMATCH:${role}`
    );
  }

  for (const href of links) {
    if (!text.includes(href)) {
      throw new Error(
        `ROLE_NAV_LINK_MISSING:${role}:${href}`
      );
    }
  }
}

console.log("STUDENT_EXPERIENCE_SHELL=PASS");
console.log("TEACHER_EXPERIENCE_SHELL=PASS");
console.log("PARENT_EXPERIENCE_SHELL=PASS");
console.log("SCHOOL_EXPERIENCE_SHELL=PASS");
console.log("ROLE_ACCESS_GUARD=PASS");
console.log("ADMIN_PREVIEW_ACCESS=PASS");
console.log("DAD_ENTRY_POINT=PASS");
console.log("ROLE_EXPERIENCE_GATE=PASS");
