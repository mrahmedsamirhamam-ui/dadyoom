import fs from "node:fs";
import path from "node:path";

const layoutPath = path.resolve(
  process.cwd(),
  "app/(dashboard)/teacher/layout.tsx"
);

const pagePath = path.resolve(
  process.cwd(),
  "app/(dashboard)/teacher/academy/page.tsx"
);

const guardPath = path.resolve(
  process.cwd(),
  "components/roles/RolePortalLayout.tsx"
);

for (const file of [
  layoutPath,
  pagePath,
  guardPath,
]) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `TEACHER_ACADEMY_AUTH_FILE_MISSING:${file}`
    );
  }
}

const layout = fs.readFileSync(
  layoutPath,
  "utf8"
);

const page = fs.readFileSync(
  pagePath,
  "utf8"
);

const guard = fs.readFileSync(
  guardPath,
  "utf8"
);

if (
  !layout.includes(
    'href: "/teacher/academy"'
  )
) {
  throw new Error(
    "TEACHER_ACADEMY_LINK_MISSING"
  );
}

if (
  !layout.includes(
    'label: "غرفة تدريب المعلم"'
  )
) {
  throw new Error(
    "TEACHER_ACADEMY_ROOM_LABEL_MISSING"
  );
}

if (
  !page.includes(
    '"force-dynamic"'
  )
) {
  throw new Error(
    "TEACHER_ACADEMY_NOT_DYNAMIC"
  );
}

if (
  page.includes(
    '"force-static"'
  )
) {
  throw new Error(
    "TEACHER_ACADEMY_FORCE_STATIC_STILL_PRESENT"
  );
}

for (const marker of [
  'supabase.auth.getUser()',
  'redirect("/login")',
  'actualRole !== role',
  'actualRole !== "admin"',
]) {
  if (!guard.includes(marker)) {
    throw new Error(
      `ROLE_GUARD_MARKER_MISSING:${marker}`
    );
  }
}

console.log(
  "TEACHER_ACADEMY_NAV_LINK=PASS"
);
console.log(
  "TEACHER_ACADEMY_AUTH_RENDER_MODE=FORCE_DYNAMIC"
);
console.log(
  "TEACHER_ROLE_GUARD=PRESERVED"
);
console.log(
  "TEACHER_ACADEMY_ROOM=PRIVATE"
);
console.log(
  "TEACHER_ACADEMY_AUTH_GATE=PASS"
);
