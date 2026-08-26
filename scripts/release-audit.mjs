import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();

function exists(rel) {
  return fs.existsSync(
    path.resolve(root, rel)
  );
}

const required = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/robots.ts",
  "app/sitemap.ts",
  "app/manifest.ts",
  "app/(dashboard)/courses/CurriculumCatalogClient.tsx",
  "app/(dashboard)/journey/page.tsx",
  "app/(dashboard)/reading-challenge/page.tsx",
  "app/(dashboard)/skills/page.tsx",
  "app/api/dad/chat/route.ts",
  "app/api/auth/provider-status/route.ts",
  "app/auth/callback/route.ts",
  "app/onboarding/page.tsx",
  "components/brand/DadyoomLogo.tsx",
  "components/dad-ai/DadRobot.tsx",
  "components/dad-ai/DadCompanion.tsx",
  "components/dad-ai/DadLessonContext.tsx",
  "components/auth/GoogleAuthButton.tsx",
  "features/reading-challenge/actions/saveReadingPassportEntry.ts",
  "lib/countries.ts",
  "scripts/check-google-auth.mjs",
  "scripts/check-learning-experience.mjs",
  "scripts/import-curriculum-pack.mjs",
  "scripts/verify-curriculum-packs.mjs",
  "data/curriculum-packs/arab-countries.json",
  "data/curriculum-packs/bh-2026-arabic-primary-g1-s1.json",
  "supabase/migrations/20260826_reading_passport_mvp.sql",
  "supabase/migrations/20260826_release_security_hardening_v1.sql",
  "docs/PRODUCT-CONTRACT.md",
  ".gitattributes",
  ".gitignore",
];

for (const rel of required) {
  if (!exists(rel)) {
    throw new Error(
      `RELEASE_FILE_MISSING:${rel}`
    );
  }
}

const criticalPlaceholders = [
  "سيتم هنا إنشاء نموذج إضافة الدرس",
  "سيتم رفع الصور والملفات الصوتية هنا",
  "سنضيف تدريبات تفاعلية حقيقية لهذه المهارة",
  "وسيتم لاحقًا ربط المستوى والنقاط والتقدم",
];

const sourceRoots = [
  "app",
  "components",
  "features",
  "lib",
  "services",
];

for (const sourceRoot of sourceRoots) {
  const absoluteRoot =
    path.resolve(
      root,
      sourceRoot
    );

  if (
    !fs.existsSync(
      absoluteRoot
    )
  ) {
    continue;
  }

  const stack = [
    absoluteRoot,
  ];

  while (
    stack.length
  ) {
    const current =
      stack.pop();

    const stat =
      fs.statSync(
        current
      );

    if (
      stat.isDirectory()
    ) {
      for (
        const name of
        fs.readdirSync(
          current
        )
      ) {
        stack.push(
          path.join(
            current,
            name
          )
        );
      }

      continue;
    }

    if (
      !/\.(ts|tsx|js|jsx|mjs|cjs|css)$/.test(
        current
      )
    ) {
      continue;
    }

    const text =
      fs.readFileSync(
        current,
        "utf8"
      );

    for (
      const marker of
      criticalPlaceholders
    ) {
      if (
        text.includes(
          marker
        )
      ) {
        throw new Error(
          `CRITICAL_PLACEHOLDER_REMAINS:${path.relative(root,current)}:${marker}`
        );
      }
    }

    if (
      /Ã|Â|Ø|Ù|�/.test(
        text
      )
    ) {
      throw new Error(
        `MOJIBAKE_REMAINS:${path.relative(root,current)}`
      );
    }
  }
}

const envExample =
  path.resolve(
    root,
    ".env.example"
  );

if (
  fs.existsSync(
    envExample
  )
) {
  const unsafe =
    fs.readFileSync(
      envExample,
      "utf8"
    )
    .split(/\r?\n/)
    .filter(
      (line) =>
        /^\s*[A-Z][A-Z0-9_]*\s*=\s*.+$/.test(
          line
        )
    );

  if (
    unsafe.length
  ) {
    throw new Error(
      ".env.example contains non-empty values"
    );
  }
}

const tracked =
  execFileSync(
    "git",
    ["ls-files"],
    {
      cwd: root,
      encoding: "utf8",
    }
  )
  .split(/\r?\n/)
  .filter(Boolean);

const badTracked =
  tracked.filter(
    (rel) =>
      fs.existsSync(path.resolve(root, rel)) &&
      /(^|\/)(_backups|\.dadyoom-backups)(\/|$)|(\.bak$|\.backup$|\.old$|\.orig$|\.tmp$|~$|\.before[-.]|encoding-backup)/i.test(
        rel
      )
  );

if (
  badTracked.length
) {
  throw new Error(
    `TRACKED_BACKUPS_REMAIN:${badTracked.join(",")}`
  );
}

const registry =
  JSON.parse(
    fs.readFileSync(
      path.resolve(
        root,
        "data/curriculum-packs/arab-countries.json"
      ),
      "utf8"
    )
  );

if (
  registry?.countries?.length !==
  22
) {
  throw new Error(
    `ARAB_COUNTRY_REGISTRY_EXPECTED_22_GOT_${registry?.countries?.length ?? 0}`
  );
}

const bahrain =
  JSON.parse(
    fs.readFileSync(
      path.resolve(
        root,
        "data/curriculum-packs/bh-2026-arabic-primary-g1-s1.json"
      ),
      "utf8"
    )
  );

const lessonCount =
  (
    bahrain.units ||
    []
  ).reduce(
    (
      sum,
      unit
    ) =>
      sum +
      (
        unit.lessons ||
        []
      ).length,
    0
  );

if (
  lessonCount !== 18
) {
  throw new Error(
    `BAHRAIN_PACK_EXPECTED_18_GOT_${lessonCount}`
  );
}

for (
  const rel of
  [
    "app/dad-pack-01/page.tsx",
    "app/dad-v2/page.tsx",
    "app/dad-v2-pro/page.tsx",
  ]
) {
  const text =
    fs.readFileSync(
      path.resolve(
        root,
        rel
      ),
      "utf8"
    );

  if (
    !text.includes(
      'redirect("/ask")'
    )
  ) {
    throw new Error(
      `LEGACY_DAD_ROUTE_NOT_REDIRECTED:${rel}`
    );
  }
}

const dad =
  fs.readFileSync(
    path.resolve(
      root,
      "components/dad-ai/DadCompanion.tsx"
    ),
    "utf8"
  );

if (
  !dad.includes(
    "requestLockRef"
  )
) {
  throw new Error(
    "DAD_DUPLICATE_POST_GUARD_MISSING"
  );
}

if (
  !dad.includes(
    "DAD_LESSON_CONTEXT_EVENT"
  )
) {
  throw new Error(
    "DAD_LESSON_CONTEXT_MISSING"
  );
}

console.log(
  "RELEASE_REQUIRED_FILES=PASS"
);
console.log(
  "CRITICAL_PLACEHOLDERS=0"
);
console.log(
  "ACTIVE_SOURCE_MOJIBAKE=0"
);
console.log(
  "TRACKED_BACKUPS=0"
);
console.log(
  "ARAB_COUNTRY_REGISTRY=22"
);
console.log(
  "BAHRAIN_PACK_LESSONS=18"
);
console.log(
  "DAD_SINGLE_PRODUCT_ROUTE=PASS"
);
console.log(
  "DAD_DUPLICATE_POST_GUARD=PASS"
);
console.log(
  "DAD_LESSON_CONTEXT=PASS"
);
console.log(
  "RELEASE_SOURCE_AUDIT=PASS"
);
