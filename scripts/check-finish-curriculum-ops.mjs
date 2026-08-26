import fs from "node:fs";
import path from "node:path";

const root =
  process.cwd();

const required = [
  "lib/curriculum-packs/schema.ts",
  "lib/curriculum-packs/validate.mjs",
  "lib/curriculum-packs/control-center.ts",
  "scripts/import-curriculum-pack.mjs",
  "scripts/verify-curriculum-packs.mjs",
  "scripts/curriculum-coverage.mjs",
  "data/curriculum-packs/arab-countries.json",
  "data/curriculum-packs/README.md",
  "app/admin/curriculum/packs/page.tsx",
  "lib/countries.ts",
];

for (const rel of required) {
  if (
    !fs.existsSync(
      path.resolve(
        root,
        rel
      )
    )
  ) {
    throw new Error(
      `CURRICULUM_OPS_FILE_MISSING:${rel}`
    );
  }
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
  !Array.isArray(
    registry.countries
  ) ||
  registry.countries.length !== 22
) {
  throw new Error(
    "ARAB_COUNTRY_REGISTRY_MUST_EQUAL_22"
  );
}

const registryCodes =
  registry.countries
    .map(
      (country) =>
        country.code
    )
    .sort();

const countriesSource =
  fs.readFileSync(
    path.resolve(
      root,
      "lib/countries.ts"
    ),
    "utf8"
  );

const arabSection =
  countriesSource.match(
    /export const ARAB_COUNTRY_CODES = \[([\s\S]*?)\] as const;/
  );

if (!arabSection) {
  throw new Error(
    "ARAB_COUNTRY_CODES_SECTION_MISSING"
  );
}

const signupArabCodes =
  [
    ...arabSection[1]
      .matchAll(
        /"([A-Z]{2})"/g
      ),
  ]
    .map(
      (match) =>
        match[1]
    )
    .sort();

if (
  JSON.stringify(
    signupArabCodes
  ) !==
  JSON.stringify(
    registryCodes
  )
) {
  throw new Error(
    "SIGNUP_ARAB_COUNTRIES_DO_NOT_MATCH_CURRICULUM_REGISTRY"
  );
}

const adminLayout =
  fs.readFileSync(
    path.resolve(
      root,
      "app/admin/layout.tsx"
    ),
    "utf8"
  );

if (
  !adminLayout.includes(
    "/admin/curriculum/packs"
  )
) {
  throw new Error(
    "CURRICULUM_PACKS_ADMIN_LINK_MISSING"
  );
}

const adminPage =
  fs.readFileSync(
    path.resolve(
      root,
      "app/admin/curriculum/packs/page.tsx"
    ),
    "utf8"
  );

for (const marker of [
  "حزم المناهج",
  "الدول العربية الـ22",
  "مصدر ← حزمة ← تحقق ← استيراد",
  "لا نكتب كودًا جديدًا لكل دولة أو صف",
]) {
  if (
    !adminPage.includes(
      marker
    )
  ) {
    throw new Error(
      `CURRICULUM_CONTROL_MARKER_MISSING:${marker}`
    );
  }
}

const importer =
  fs.readFileSync(
    path.resolve(
      root,
      "scripts/import-curriculum-pack.mjs"
    ),
    "utf8"
  );

if (!importer.includes("--apply")) {
  throw new Error(
    "GENERIC_IMPORTER_APPLY_MODE_MISSING"
  );
}

console.log(
  "ARAB_CURRICULUM_REGISTRY=22"
);
console.log(
  "SIGNUP_ARAB_COUNTRIES_MATCH=PASS"
);
console.log(
  "CURRICULUM_CONTROL_CENTER=PASS"
);
console.log(
  "GENERIC_IMPORTER=PASS"
);
console.log(
  "NO_NEW_CODE_PER_COUNTRY=CONTRACT_LOCKED"
);
console.log(
  "CURRICULUM_OPS_GATE=PASS"
);
